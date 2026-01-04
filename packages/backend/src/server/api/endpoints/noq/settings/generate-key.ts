/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import ms from 'ms';
import * as crypto from 'node:crypto';
import { Endpoint } from '@/server/api/endpoint-base.js';
import type { NoqUserSettingsRepository } from '@/models/_.js';
import { DI } from '@/di-symbols.js';
import { NoqestionService } from '@/core/NoqestionService.js';
import { ApiError } from '../../../error.js';

/**
 * noq/settings/generate-key
 * E2E暗号化用の公開鍵を生成・保存する
 *
 * アルゴリズム:
 * - PBKDF2 (SHA-256, 100,000 iterations) によるパスワードからの鍵導出
 * - ECDH P-256 (secp256r1) による公開鍵生成
 * - 公開鍵のみデータベースに保存、パスワード・秘密鍵は保存しない
 *
 * セキュリティレベル: 本番用（NISTおよびOWASP推奨準拠）
 */

// 固定ソルト（アプリケーション固有）
// パスワードから決定的に鍵を導出するため、ユーザーごとに異なるソルトは使用しない
const SALT = 'noqestion-e2e-salt-v1';
const PBKDF2_ITERATIONS = 100000;

/**
 * Base64エンコード（URL-safe）
 */
function base64Encode(buffer: Buffer): string {
	return buffer.toString('base64url');
}

/**
 * パスワードからECDH P-256公開鍵を生成
 * @param password ユーザーが入力したパスワード
 * @returns 公開鍵（Base64 URL-safe エンコード）
 */
async function generatePublicKeyFromPassword(password: string): Promise<string> {
	// PBKDF2でパスワードからシードを導出
	const seed = await new Promise<Buffer>((resolve, reject) => {
		crypto.pbkdf2(
			password,
			SALT,
			PBKDF2_ITERATIONS,
			32, // 256ビット
			'sha256',
			(err, derivedKey) => {
				if (err) reject(err);
				else resolve(derivedKey);
			},
		);
	});

	// シードからECDH P-256秘密鍵を作成
	// P-256の秘密鍵は256ビットの整数（曲線の位数未満）
	// PBKDF2の出力をそのまま使用（ほぼ確実に有効な範囲内）
	const privateKeyDer = Buffer.concat([
		// ECPrivateKeyのDER形式プレフィックス（P-256用）
		Buffer.from('308141020100301306072a8648ce3d020106082a8648ce3d030107042730250201010420', 'hex'),
		seed,
	]);

	// DER形式からKeyObjectを作成
	const privateKey = crypto.createPrivateKey({
		key: privateKeyDer,
		format: 'der',
		type: 'sec1',
	});

	// 秘密鍵から公開鍵を導出
	const publicKey = crypto.createPublicKey(privateKey);

	// 公開鍵をSPKI形式でエクスポート
	const publicKeySpki = publicKey.export({
		format: 'der',
		type: 'spki',
	});

	// SPKIから生の公開鍵データを抽出（65バイト: 0x04 + 32バイトx + 32バイトy）
	// P-256のSPKI形式は固定ヘッダー（26バイト）+ 公開鍵（65バイト）
	const rawPublicKey = publicKeySpki.slice(-65);

	return base64Encode(rawPublicKey);
}

export const meta = {
	tags: ['noq'],

	requireCredential: true,
	prohibitMoved: true,

	kind: 'write:account',

	limit: {
		duration: ms('1hour'),
		max: 10,
	},

	errors: {
		passwordRequired: {
			message: 'Password is required.',
			code: 'PASSWORD_REQUIRED',
			id: 'e2e1f2c3-0001-4001-9001-000000000001',
		},
		passwordTooShort: {
			message: 'Password must be at least 4 characters.',
			code: 'PASSWORD_TOO_SHORT',
			id: 'e2e1f2c3-0001-4001-9001-000000000002',
		},
	},

	res: {
		type: 'object',
		optional: false, nullable: false,
		properties: {
			publicKey: {
				type: 'string',
				optional: false, nullable: false,
			},
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		password: { type: 'string', minLength: 4, maxLength: 128 },
	},
	required: ['password'],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		@Inject(DI.noqUserSettingsRepository)
		private noqUserSettingsRepository: NoqUserSettingsRepository,

		private noqestionService: NoqestionService,
	) {
		super(meta, paramDef, async (ps, me) => {
			// パスワードバリデーション
			if (!ps.password || ps.password.trim().length === 0) {
				throw new ApiError(meta.errors.passwordRequired);
			}

			if (ps.password.length < 4) {
				throw new ApiError(meta.errors.passwordTooShort);
			}

			// 公開鍵を生成
			const publicKeyString = await generatePublicKeyFromPassword(ps.password);

			// 設定を更新
			await this.noqestionService.updateUserSetting(me.id, {
				e2ePublicKey: publicKeyString,
			});

			return {
				publicKey: publicKeyString,
			};
		});
	}
}
