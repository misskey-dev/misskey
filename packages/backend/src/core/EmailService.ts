/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { URLSearchParams } from 'node:url';
import * as nodemailer from 'nodemailer';
import { Inject, Injectable } from '@nestjs/common';
import { validate as validateEmail } from 'deep-email-validator';
import Redis from 'ioredis';
import { MetaService } from '@/core/MetaService.js';
import { UtilityService } from '@/core/UtilityService.js';
import { DI } from '@/di-symbols.js';
import type { Config } from '@/config.js';
import type Logger from '@/logger.js';
import type { UserProfilesRepository } from '@/models/_.js';
import { LoggerService } from '@/core/LoggerService.js';
import { bindThis } from '@/decorators.js';
import { HttpRequestService } from '@/core/HttpRequestService.js';
import { RedisKVCache } from '@/misc/cache.js';

@Injectable()
export class EmailService {
	private logger: Logger;

	private verifymailResponseCache: RedisKVCache<{
		valid: boolean,
		reason?: string | null,
	}>;

	constructor(
		@Inject(DI.config)
		private config: Config,

		@Inject(DI.redis)
		private redisClient: Redis.Redis,

		@Inject(DI.userProfilesRepository)
		private userProfilesRepository: UserProfilesRepository,

		private metaService: MetaService,
		private loggerService: LoggerService,
		private utilityService: UtilityService,
		private httpRequestService: HttpRequestService,
	) {
		this.logger = this.loggerService.getLogger('email');
		this.verifymailResponseCache = new RedisKVCache<{
			valid: boolean,
			reason?: string | null,
		}>(this.redisClient, 'verifymailResponse', {
			lifetime: 1000 * 60 * 60 * 24 * 7, // 7d
			memoryCacheLifetime: 1000 * 60 * 60 * 24 * 7, // 7d
			fetcher: (key) => this.verifyMail(key),
			toRedisConverter: (value) => JSON.stringify(value),
			fromRedisConverter: (value) => JSON.parse(value),
		});
	}

	@bindThis
	public async sendEmail(to: string, subject: string, html: string, text: string) {
		const meta = await this.metaService.fetch(true);

		if (!meta.enableEmail) return;

		const iconUrl = `${this.config.url}/static-assets/mi-white.png`;
		const emailSettingUrl = `${this.config.url}/settings/email`;

		const enableAuth = meta.smtpUser != null && meta.smtpUser !== '';

		const transporter = nodemailer.createTransport({
			host: meta.smtpHost,
			port: meta.smtpPort,
			secure: meta.smtpSecure,
			ignoreTLS: !enableAuth,
			proxy: this.config.proxySmtp,
			auth: enableAuth ? {
				user: meta.smtpUser,
				pass: meta.smtpPass,
			} : undefined,
		} as any);

		try {
			// TODO: htmlサニタイズ
			const info = await transporter.sendMail({
				from: meta.email!,
				to: to,
				subject: subject,
				text: text,
				html: `<!doctype html>
<html>
	<head>
		<meta charset="utf-8">
		<title>${ subject }</title>
		<style>
			html {
				background: #eee;
			}

			body {
				padding: 16px;
				margin: 0;
				font-family: sans-serif;
				font-size: 14px;
			}

			a {
				text-decoration: none;
				color: #86b300;
			}
			a:hover {
				text-decoration: underline;
			}

			main {
				max-width: 500px;
				margin: 0 auto;
				background: #fff;
				color: #555;
			}
				main > header {
					padding: 32px;
					background: #86b300;
				}
					main > header > img {
						max-width: 128px;
						max-height: 28px;
						vertical-align: bottom;
					}
				main > article {
					padding: 32px;
				}
					main > article > h1 {
						margin: 0 0 1em 0;
					}
				main > footer {
					padding: 32px;
					border-top: solid 1px #eee;
				}

			nav {
				box-sizing: border-box;
				max-width: 500px;
				margin: 16px auto 0 auto;
				padding: 0 32px;
			}
				nav > a {
					color: #888;
				}
		</style>
	</head>
	<body>
		<main>
			<header>
				<img src="${ meta.logoImageUrl ?? meta.iconUrl ?? iconUrl }"/>
			</header>
			<article>
				<h1>${ subject }</h1>
				<div>${ html }</div>
			</article>
			<footer>
				<a href="${ emailSettingUrl }">${ 'Email setting' }</a>
			</footer>
		</main>
		<nav>
			<a href="${ this.config.url }">${ this.config.host }</a>
		</nav>
	</body>
</html>`,
			});

			this.logger.info(`Message sent: ${info.messageId}`);
		} catch (err) {
			this.logger.error('Failed to send email', { error: err });
			throw err;
		}
	}

	@bindThis
	public async validateEmailForAccount(emailAddress: string): Promise<{
		available: boolean;
		reason: null | 'used' | 'format' | 'disposable' | 'mx' | 'smtp' | 'banned' | 'network' | 'blacklist';
	}> {
		const meta = await this.metaService.fetch();

		const exist = await this.userProfilesRepository.countBy({
			emailVerified: true,
			email: emailAddress,
		});

		if (exist !== 0) {
			return {
				available: false,
				reason: 'used',
			};
		}

		let validated: {
			valid: boolean,
			reason?: string | null,
		} = { valid: true, reason: null };

		if (meta.enableActiveEmailValidation) {
			validated = await validateEmail({
				email: emailAddress,
				validateRegex: true,
				validateMx: true,
				validateTypo: false, // TLDを見ているみたいだけどclubとか弾かれるので
				validateDisposable: true, // 捨てアドかどうかチェック
				validateSMTP: false, // 日本だと25ポートが殆どのプロバイダーで塞がれていてタイムアウトになるので
			});

			if (validated.valid && meta.enableVerifymailApi && meta.verifymailAuthKey != null) {
				const domain = emailAddress.split('@')[1];
				validated = await this.verifymailResponseCache.fetch(domain);
			}

			if (validated.valid && meta.enableTruemailApi && meta.truemailInstance && meta.truemailAuthKey != null) {
				validated = await this.trueMail(meta.truemailInstance, emailAddress, meta.truemailAuthKey);
			}
		}

		if (!validated.valid) {
			const formatReason: Record<string, 'format' | 'disposable' | 'mx' | 'smtp' | 'network' | 'blacklist' | undefined> = {
				regex: 'format',
				disposable: 'disposable',
				mx: 'mx',
				smtp: 'smtp',
				network: 'network',
				blacklist: 'blacklist',
			};

			return {
				available: false,
				reason: validated.reason ? formatReason[validated.reason] ?? null : null,
			};
		}

		const emailDomain: string = emailAddress.split('@')[1];
		const isBanned = this.utilityService.isItemListedIn(emailDomain, meta.bannedEmailDomains);

		if (isBanned) {
			return {
				available: false,
				reason: 'banned',
			};
		}

		return {
			available: true,
			reason: null,
		};
	}

	private async verifyMail(domain: string): Promise<{
		valid: boolean;
		reason: 'used' | 'format' | 'disposable' | 'mx' | 'smtp' | null;
	}> {
		const meta = await this.metaService.fetch();
		if (meta.verifymailAuthKey == null) throw new Error('verifymailAuthKey is not set');

		const endpoint = 'https://verifymail.io/api/' + domain + '?key=' + meta.verifymailAuthKey;
		const res = await this.httpRequestService.send(endpoint, {
			method: 'GET',
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded',
				Accept: 'application/json, */*',
			},
		});

		const json = (await res.json()) as Partial<{
			message: string;
			block: boolean;
			catch_all: boolean;
			deliverable_email: boolean;
			disposable: boolean;
			domain: string;
			email_address: string;
			email_provider: string;
			mx: boolean;
			mx_fallback: boolean;
			mx_host: string[];
			mx_ip: string[];
			mx_priority: { [key: string]: number };
			privacy: boolean;
			related_domains: string[];
		}>;

		/* api error: when there is only one `message` attribute in the returned result */
		if (Object.keys(json).length === 1 && Reflect.has(json, 'message')) {
			return {
				valid: false,
				reason: null,
			};
		}
		if (json.disposable) {
			return {
				valid: false,
				reason: 'disposable',
			};
		}
		if (json.mx !== undefined && !json.mx) {
			return {
				valid: false,
				reason: 'mx',
			};
		}
		if (json.mx_host?.some(host => this.utilityService.isItemListedIn(host, meta.bannedEmailDomains))) {
			return {
				valid: false,
				reason: 'mx',
			};
		}

		return {
			valid: true,
			reason: null,
		};
	}

	private async trueMail<T>(truemailInstance: string, emailAddress: string, truemailAuthKey: string): Promise<{
		valid: boolean;
		reason: 'used' | 'format' | 'blacklist' | 'mx' | 'smtp' | 'network' | T | null;
	}> {
		const endpoint = truemailInstance + '?email=' + emailAddress;
		try {
			const res = await this.httpRequestService.send(endpoint, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Accept: 'application/json',
					Authorization: truemailAuthKey,
				},
				isLocalAddressAllowed: true,
			});

			const json = (await res.json()) as {
				email: string;
				success: boolean;
				error?: string;
				errors?: {
					list_match?: string;
					regex?: string;
					mx?: string;
					smtp?: string;
				} | null;
			};

			if (json.email === undefined || json.errors?.regex) {
				return {
					valid: false,
					reason: 'format',
				};
			}
			if (json.errors?.smtp) {
				return {
					valid: false,
					reason: 'smtp',
				};
			}
			if (json.errors?.mx) {
				return {
					valid: false,
					reason: 'mx',
				};
			}
			if (!json.success) {
				return {
					valid: false,
					reason: json.errors?.list_match as T || 'blacklist',
				};
			}

			return {
				valid: true,
				reason: null,
			};
		} catch (error) {
			return {
				valid: false,
				reason: 'network',
			};
		}
	}
}
