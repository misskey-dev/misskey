/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import bcrypt from 'bcryptjs';
import { IsNull } from 'typeorm';
import * as Redis from 'ioredis';
import * as Misskey from 'misskey-js';
import { DI } from '@/di-symbols.js';
import type {
	MiMeta,
	SigninsRepository,
	UserProfilesRepository,
	UserSecurityKeysRepository,
	UsersRepository,
} from '@/models/_.js';
import type { MiLocalUser } from '@/models/User.js';
import type { Config } from '@/config.js';
import type Logger from '@/logger.js';
import { bindThis } from '@/decorators.js';
import { IdService } from '@/core/IdService.js';
import { LoggerService } from '@/core/LoggerService.js';
import { CaptchaService } from '@/core/CaptchaService.js';
import { TotpService } from '@/core/TotpService.js';
import { WebAuthnService } from '@/core/WebAuthnService.js';
import { IdentifiableError } from '@/misc/identifiable-error.js';
import { FastifyReplyError } from '@/misc/fastify-reply-error.js';
import { getIpHash } from '@/misc/get-ip-hash.js';
import { secureRndstr } from '@/misc/secure-rndstr.js';
import { RateLimiterService } from '@/server/api/RateLimiterService.js';
import { SigninService } from '@/server/auth/SigninService.js';
import { acceptableMethods, isSatisfied, toWireNext } from '@/server/auth/signin-policy.js';
import type { AuthMethod, SigninSession } from '@/server/auth/signin-policy.js';
import type { AuthenticationResponseJSON } from '@simplewebauthn/server';
import type { FastifyReply, FastifyRequest } from 'fastify';

/** サインインフローの一時状態の寿命(秒)。Conditional Mediation の待機中も切れないよう長めに取る */
const SIGNIN_SESSION_TTL = 600;

const SIGNIN_SESSION_VERSION = 1;

//#region エラー ID (MkSignin.vue の switch と対応)
const ERR_NO_SUCH_USER = '6cc579cc-885d-43d8-95c2-b8c7fc963280';
const ERR_INCORRECT_PASSWORD = '932c904e-9460-45b7-9ce6-7ed33be7eb2c';
const ERR_SUSPENDED = 'e03a5f46-d309-4865-9b69-56282d94e1eb';
const ERR_RATE_LIMIT_EXCEEDED = '22d05606-fbcf-421a-a2db-b32610dcfd1b';
const ERR_INCORRECT_TOTP = 'cdf1235b-ac71-46d4-a3a6-84ccce48df6f';
const ERR_PASSKEY_VERIFICATION_FAILED = '93b86c4b-72f9-40eb-9815-798928603d1e';
const ERR_ANONYMOUS_PASSKEY_VERIFICATION_FAILED = 'b18c89a7-5b5e-4cec-bb5b-0419f332d430';
const ERR_UNKNOWN_WEBAUTHN_KEY = '36b96a7d-b547-412d-aeed-2d611cdc8cdc';
const ERR_PASSWORDLESS_DISABLED = '2d84773e-f7b7-4d0b-8f72-bb69b584c912';
const ERR_INVALID_SIGNIN_SESSION = '8e385d0a-bee2-43f3-a8cf-3fdd54da7446';
const ERR_INTERNAL = '4e30e80c-e338-45a0-8c8f-44455efa3b76';
//#endregion

/** リクエスト 1 回で扱えるステップは必ず 1 つだけ */
const STEP_KEYS = ['username', 'password', 'token', 'passkeyCredential'] as const;
type StepKey = typeof STEP_KEYS[number];

type StepFailure = {
	status: number;
	id: string;
	/**
	 * セッションを破棄するか。パスワード / TOTP の不一致は false にして同じセッションで再入力させる。
	 * パスキー検証失敗は challenge を消費済みなので必ず true にすること。
	 */
	hard: boolean;
};

type StepResult = { ok: true } | { ok: false; failure: StepFailure };

const OK: StepResult = { ok: true };

function fail(status: number, id: string, hard: boolean): StepResult {
	return { ok: false, failure: { status, id, hard } };
}

@Injectable()
export class SigninApiService {
	private logger: Logger;

	constructor(
		@Inject(DI.config)
		private config: Config,

		@Inject(DI.meta)
		private meta: MiMeta,

		@Inject(DI.redis)
		private redisClient: Redis.Redis,

		@Inject(DI.usersRepository)
		private usersRepository: UsersRepository,

		@Inject(DI.userProfilesRepository)
		private userProfilesRepository: UserProfilesRepository,

		@Inject(DI.userSecurityKeysRepository)
		private userSecurityKeysRepository: UserSecurityKeysRepository,

		@Inject(DI.signinsRepository)
		private signinsRepository: SigninsRepository,

		private loggerService: LoggerService,
		private idService: IdService,
		private rateLimiterService: RateLimiterService,
		private captchaService: CaptchaService,
		private totpService: TotpService,
		private webAuthnService: WebAuthnService,
		private signinService: SigninService,
	) {
		this.logger = this.loggerService.getLogger('Signin');
	}

	/** POST /auth/signin/init — セッションを発行し、Conditional Mediation 用の匿名 challenge を返す */
	@bindThis
	public async signinInit(request: FastifyRequest, reply: FastifyReply) {
		if (!await this.checkIpRateLimit(request, 'init')) {
			return this.rateLimited(reply);
		}

		const signinFlowId = secureRndstr(32);
		const session: SigninSession = {
			v: SIGNIN_SESSION_VERSION,
			userId: null,
			available: null,
			passwordless: false,
			satisfied: [],
			createdAt: Date.now(),
		};

		const expiresAt = await this.saveSession(signinFlowId, session);
		const passkeyOptions = await this.webAuthnService.initiateSignInWithPasskeyAuthentication(signinFlowId);

		reply.code(200);
		return {
			sessionId: signinFlowId,
			expiresAt,
			passkeyOptions,
		} satisfies Misskey.entities.SigninInitResponse;
	}

	/**
	 * POST /auth/signin/continue — 1 リクエストにつき 1 ステップを検証する。
	 * 「次に何を要求するか」の判断は signin-policy.ts に集約してある。
	 */
	@bindThis
	public async signinContinue(request: FastifyRequest, reply: FastifyReply) {
		if (!await this.checkIpRateLimit(request, 'continue')) {
			return this.rateLimited(reply);
		}

		const body = (request.body ?? {}) as Record<string, unknown>;

		const signinFlowId = body.sessionId;
		if (typeof signinFlowId !== 'string' || signinFlowId.length === 0) {
			return this.error(reply, 401, ERR_INVALID_SIGNIN_SESSION);
		}

		const session = await this.loadSession(signinFlowId);
		if (session == null) {
			return this.error(reply, 401, ERR_INVALID_SIGNIN_SESSION);
		}

		const steps = STEP_KEYS.filter(k => body[k] !== undefined);
		if (steps.length !== 1) {
			await this.dropSession(signinFlowId);
			return this.error(reply, 400, ERR_INTERNAL);
		}
		const step: StepKey = steps[0];

		// ユーザー未確定ならユーザー名か匿名パスキーのみ、確定済みならユーザー名は入れ直せない
		if (session.userId == null ? (step !== 'username' && step !== 'passkeyCredential') : step === 'username') {
			await this.dropSession(signinFlowId);
			return this.error(reply, 400, ERR_INTERNAL);
		}

		// 受理できる手段は、案内する 1 つ (toWireNext) より広い
		if (session.userId != null) {
			const method: AuthMethod = step === 'password' ? 'password' : step === 'token' ? 'totp' : 'passkey';
			if (!acceptableMethods(session).has(method)) {
				await this.dropSession(signinFlowId);
				return this.error(reply, 400, ERR_INTERNAL);
			}

			// パスワード等の総当たりは、IP を変えられても効くこのバケットで止める
			if (!await this.checkUserRateLimit(session.userId)) {
				return this.rateLimited(reply);
			}
		}

		let result: StepResult;
		switch (step) {
			case 'username':
				result = await this.handleUsername(session, body);
				break;
			case 'password':
				result = await this.handlePassword(session, body);
				break;
			case 'token':
				result = await this.handleTotp(session, body);
				break;
			case 'passkeyCredential':
				result = await this.handlePasskey(signinFlowId, session, body);
				// 匿名経路ではここで初めてユーザーが確定するので、ユーザー別バケットも事後に消費する
				if (result.ok && session.userId != null && !await this.checkUserRateLimit(session.userId)) {
					return this.rateLimited(reply);
				}
				break;
		}

		if (!result.ok) {
			// ユーザーが特定できている失敗だけサインイン履歴に残す
			if (session.userId != null) {
				await this.signinsRepository.insert({
					id: this.idService.gen(),
					userId: session.userId,
					ip: request.ip,
					headers: request.headers as any,
					success: false,
				});
			}

			if (result.failure.hard) {
				await this.dropSession(signinFlowId);
			} else {
				await this.saveSession(signinFlowId, session);
			}

			return this.error(reply, result.failure.status, result.failure.id);
		}

		if (isSatisfied(session)) {
			await this.dropSession(signinFlowId);

			// セッションの寿命の間に凍結された可能性があるので、ここで最新の状態を引き直す
			const user = await this.usersRepository.findOneBy({ id: session.userId!, host: IsNull() }) as MiLocalUser | null;
			if (user == null) {
				return this.error(reply, 404, ERR_NO_SUCH_USER);
			}
			if (user.isSuspended) {
				return this.error(reply, 403, ERR_SUSPENDED);
			}

			return this.signinService.signin(request, reply, user);
		}

		const expiresAt = await this.saveSession(signinFlowId, session);
		const next = toWireNext(acceptableMethods(session));

		if (next == null) {
			// isSatisfied が false なのに次の手段が無いのは、ポリシー導出のバグ
			this.logger.error(`signin flow stuck: no acceptable method for user ${session.userId}`);
			await this.dropSession(signinFlowId);
			return this.error(reply, 500, ERR_INTERNAL);
		}

		reply.code(200);

		if (next === 'passkey' || next === 'totpOrPasskey') {
			return {
				finished: false,
				next,
				expiresAt,
				passkeyOptions: await this.webAuthnService.initiateAuthentication(session.userId!),
			} satisfies Misskey.entities.SigninContinueResponse;
		}

		return {
			finished: false,
			next,
			expiresAt,
		} satisfies Misskey.entities.SigninContinueResponse;
	}

	//#region ステップ検証ハンドラ (成功時に satisfied へ足すだけ)

	@bindThis
	private async handleUsername(session: SigninSession, body: Record<string, unknown>): Promise<StepResult> {
		const username = body.username;
		if (typeof username !== 'string') {
			return fail(400, ERR_INTERNAL, true);
		}

		const captchaResponse = body.captchaResponse;
		if (captchaResponse !== undefined && !isCaptchaResponse(captchaResponse)) {
			return fail(400, ERR_INTERNAL, true);
		}

		const user = await this.usersRepository.findOneBy({
			usernameLower: username.toLowerCase(),
			host: IsNull(),
		}) as MiLocalUser | null;

		if (user == null) {
			// セッションは残す。ユーザー名を入れ直せば同じセッションで続行できる
			return fail(404, ERR_NO_SUCH_USER, false);
		}

		if (user.isSuspended) {
			return fail(403, ERR_SUSPENDED, true);
		}

		const profile = await this.userProfilesRepository.findOneByOrFail({ userId: user.id });

		if (!profile.twoFactorEnabled) {
			await this.verifyCaptcha(captchaResponse);
		}

		const securityKeysAvailable = await this.userSecurityKeysRepository.countBy({ userId: user.id }).then(result => result >= 1);

		const available: AuthMethod[] = [];
		if (profile.twoFactorEnabled) available.push('totp');
		if (securityKeysAvailable) available.push('passkey');

		session.userId = user.id;
		session.available = available;
		session.passwordless = securityKeysAvailable && profile.usePasswordLessLogin;

		return OK;
	}

	@bindThis
	private async handlePassword(session: SigninSession, body: Record<string, unknown>): Promise<StepResult> {
		const password = body.password;
		if (typeof password !== 'string') {
			return fail(400, ERR_INTERNAL, true);
		}

		const profile = await this.userProfilesRepository.findOneByOrFail({ userId: session.userId! });
		if (profile.password == null) {
			return fail(403, ERR_INCORRECT_PASSWORD, false);
		}

		if (!await bcrypt.compare(password, profile.password)) {
			return fail(403, ERR_INCORRECT_PASSWORD, false);
		}

		session.satisfied.push('password');
		return OK;
	}

	@bindThis
	private async handleTotp(session: SigninSession, body: Record<string, unknown>): Promise<StepResult> {
		const token = body.token;
		if (typeof token !== 'string') {
			return fail(400, ERR_INTERNAL, true);
		}

		const profile = await this.userProfilesRepository.findOneByOrFail({ userId: session.userId! });

		try {
			await this.totpService.twoFactorAuthenticate(profile, token);
		} catch (_) {
			return fail(403, ERR_INCORRECT_TOTP, false);
		}

		session.satisfied.push('totp');
		return OK;
	}

	/**
	 * ユーザー未確定なら匿名 challenge を検証してユーザーを引き当て、
	 * 確定済みならそのユーザー宛の challenge を検証する。
	 */
	@bindThis
	private async handlePasskey(signinFlowId: string, session: SigninSession, body: Record<string, unknown>): Promise<StepResult> {
		const credential = body.passkeyCredential;
		if (typeof credential !== 'object' || credential == null) {
			return fail(400, ERR_INTERNAL, true);
		}

		// challenge は単回使用なので、検証に失敗した時点でこのセッションでは再試行できない (= hard)
		if (session.userId == null) {
			let userId: string | null;
			try {
				userId = await this.webAuthnService.verifySignInWithPasskeyAuthentication(signinFlowId, credential as AuthenticationResponseJSON);
			} catch (err) {
				this.logger.warn(`Anonymous passkey verification failed: ${err}`);
				return fail(403, identifiableErrorId(err, ERR_ANONYMOUS_PASSKEY_VERIFICATION_FAILED), true);
			}

			if (userId == null) {
				return fail(403, ERR_ANONYMOUS_PASSKEY_VERIFICATION_FAILED, true);
			}

			const user = await this.usersRepository.findOneBy({ id: userId, host: IsNull() }) as MiLocalUser | null;
			if (user == null) {
				return fail(403, ERR_NO_SUCH_USER, true);
			}
			if (user.isSuspended) {
				session.userId = user.id;
				return fail(403, ERR_SUSPENDED, true);
			}

			const profile = await this.userProfilesRepository.findOneByOrFail({ userId: user.id });
			const securityKeysAvailable = await this.userSecurityKeysRepository.countBy({ userId: user.id }).then(result => result >= 1);

			const available: AuthMethod[] = [];
			if (profile.twoFactorEnabled) available.push('totp');
			if (securityKeysAvailable) available.push('passkey');

			session.userId = user.id;
			session.available = available;
			session.passwordless = securityKeysAvailable && profile.usePasswordLessLogin;

			// パスワードレス無効ならここで打ち切る。ユーザーだけ確定して先へ進めると、
			// captcha を検証する username ステップを通らない迂回路になる
			if (!session.passwordless) {
				return fail(403, ERR_PASSWORDLESS_DISABLED, true);
			}

			session.satisfied.push('passkey');
			return OK;
		}

		try {
			if (!await this.webAuthnService.verifyAuthentication(session.userId, credential as AuthenticationResponseJSON)) {
				return fail(403, ERR_PASSKEY_VERIFICATION_FAILED, true);
			}
		} catch (err) {
			this.logger.warn(`Passkey verification failed: ${err}`);
			return fail(403, identifiableErrorId(err, ERR_PASSKEY_VERIFICATION_FAILED), true);
		}

		session.satisfied.push('passkey');
		return OK;
	}

	//#endregion

	//#region セッション

	@bindThis
	private async loadSession(signinFlowId: string): Promise<SigninSession | null> {
		const raw = await this.redisClient.get(`signin:session:${signinFlowId}`);
		if (raw == null) return null;

		let session: SigninSession;
		try {
			session = JSON.parse(raw) as SigninSession;
		} catch (_) {
			return null;
		}

		// ローリングデプロイ中に古い形のセッションを読んでしまわないようにする
		if (session.v !== SIGNIN_SESSION_VERSION) return null;

		return session;
	}

	/** セッションを保存し、延長後の失効時刻(epoch ms)を返す */
	@bindThis
	private async saveSession(signinFlowId: string, session: SigninSession): Promise<number> {
		await this.redisClient.setex(`signin:session:${signinFlowId}`, SIGNIN_SESSION_TTL, JSON.stringify(session));
		return Date.now() + (SIGNIN_SESSION_TTL * 1000);
	}

	@bindThis
	private async dropSession(signinFlowId: string): Promise<void> {
		await this.redisClient.del(`signin:session:${signinFlowId}`);
	}

	//#endregion

	//#region レートリミット (RateLimiterService.limit() は throw せず戻り値で超過を伝える)

	/**
	 * NOTE: RateLimiterService は NODE_ENV !== 'production' で自己無効化するため、テストでは効かない。
	 * init はログイン画面を開くたびに呼ばれるので、continue と同じ制限にはできない。
	 */
	@bindThis
	private async checkIpRateLimit(request: FastifyRequest, kind: 'init' | 'continue'): Promise<boolean> {
		if (!this.config.enableIpRateLimit) return true;

		if (process.env.NODE_ENV === 'production' && (request.ip === '::1' || request.ip === '127.0.0.1')) {
			this.logger.warn('Recieved signin request from localhost IP address for rate limiting in production environment. This is likely due to an improper trustProxy setting in the config file.');
		}

		const limitation = kind === 'init'
			? { key: 'signin-init', duration: 30 * 60 * 1000, max: 100, minInterval: 500 }
			: { key: 'signin-continue', duration: 60 * 60 * 1000, max: 30, minInterval: 300 };

		return await this.rateLimiterService.limit(limitation, getIpHash(request.ip)) == null;
	}

	/** ユーザー単位のバケット。IP をローテーションされても効くので config.enableIpRateLimit では無効化しない */
	@bindThis
	private async checkUserRateLimit(userId: string): Promise<boolean> {
		return await this.rateLimiterService.limit({ key: 'signin-user', duration: 60 * 60 * 1000, max: 10 }, userId) == null;
	}

	//#endregion

	//#region captcha

	/**
	 * captcha を検証する。インスタンスで有効なプロバイダがあるのに、応答が無い / 有効でない
	 * プロバイダの応答しか無い場合は必ず失敗させる。
	 *
	 * `if (captchaResponse != null)` の形にしてはいけない。クライアントが captchaResponse を
	 * 省くだけで検証が丸ごとスキップされる。
	 *
	 * @throws FastifyReplyError 400
	 */
	@bindThis
	private async verifyCaptcha(captchaResponse: Misskey.entities.SigninCaptchaResponse | undefined): Promise<void> {
		if (process.env.NODE_ENV === 'test') return;

		const enabled: Record<Misskey.entities.SigninCaptchaResponse['type'], boolean> = {
			'hcaptcha': this.meta.enableHcaptcha && this.meta.hcaptchaSecretKey != null,
			'recaptcha-v2': this.meta.enableRecaptcha && this.meta.recaptchaSecretKey != null,
			'turnstile': this.meta.enableTurnstile && this.meta.turnstileSecretKey != null,
			'm-captcha': this.meta.enableMcaptcha && this.meta.mcaptchaSecretKey != null && this.meta.mcaptchaSitekey != null && this.meta.mcaptchaInstanceUrl != null,
			'testcaptcha': this.meta.enableTestcaptcha,
		};

		if (!Object.values(enabled).some(v => v)) return;

		// リクエストに載る応答は 1 つだけなので、有効なプロバイダのどれか 1 つを解けば通過する
		if (captchaResponse == null || enabled[captchaResponse.type] !== true) {
			throw new FastifyReplyError(400, 'captcha-failed: no response provided');
		}

		const onError = (err: unknown): never => {
			throw new FastifyReplyError(400, String(err));
		};

		switch (captchaResponse.type) {
			case 'hcaptcha':
				await this.captchaService.verifyHcaptcha(this.meta.hcaptchaSecretKey!, captchaResponse.response).catch(onError);
				break;
			case 'recaptcha-v2':
				await this.captchaService.verifyRecaptcha(this.meta.recaptchaSecretKey!, captchaResponse.response).catch(onError);
				break;
			case 'turnstile':
				await this.captchaService.verifyTurnstile(this.meta.turnstileSecretKey!, captchaResponse.response).catch(onError);
				break;
			case 'm-captcha':
				await this.captchaService.verifyMcaptcha(this.meta.mcaptchaSecretKey!, this.meta.mcaptchaSitekey!, this.meta.mcaptchaInstanceUrl!, captchaResponse.response).catch(onError);
				break;
			case 'testcaptcha':
				await this.captchaService.verifyTestcaptcha(captchaResponse.response).catch(onError);
				break;
		}
	}

	//#endregion

	@bindThis
	private error(reply: FastifyReply, status: number, id: string) {
		reply.code(status);
		return { error: { id } };
	}

	@bindThis
	private rateLimited(reply: FastifyReply) {
		reply.code(429);
		return {
			error: {
				message: 'Too many failed attempts to sign in. Try again later.',
				code: 'TOO_MANY_AUTHENTICATION_FAILURES',
				id: ERR_RATE_LIMIT_EXCEEDED,
			},
		};
	}
}

function isCaptchaResponse(value: unknown): value is Misskey.entities.SigninCaptchaResponse {
	if (typeof value !== 'object' || value == null) return false;
	const v = value as Record<string, unknown>;
	return typeof v.type === 'string' && typeof v.response === 'string';
}

/** WebAuthnService が投げた IdentifiableError の ID はそのままクライアントへ伝える */
function identifiableErrorId(err: unknown, fallback: string): string {
	if (err instanceof IdentifiableError && (err.id === ERR_UNKNOWN_WEBAUTHN_KEY || err.id === ERR_ANONYMOUS_PASSKEY_VERIFICATION_FAILED)) {
		return err.id;
	}
	return fallback;
}
