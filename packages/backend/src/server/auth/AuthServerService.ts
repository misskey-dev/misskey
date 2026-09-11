/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import cors from '@fastify/cors';
import type { Config } from '@/config.js';
import { DI } from '@/di-symbols.js';
import { bindThis } from '@/decorators.js';
import { SigninApiService } from '@/server/auth/SigninApiService.js';
import type { FastifyInstance, FastifyPluginOptions } from 'fastify';

/**
 * `/auth` 配下のサーバー。サインインのように「まだアクセストークンを持っていない」リクエストを扱う。
 */
@Injectable()
export class AuthServerService {
	constructor(
		@Inject(DI.config)
		private config: Config,

		private signinApiService: SigninApiService,
	) {
	}

	@bindThis
	public createServer(fastify: FastifyInstance, options: FastifyPluginOptions, done: (err?: Error) => void) {
		// 資格情報を Cookie で送ることはないので credentials は付けない
		fastify.register(cors, {
			origin: this.config.url,
			credentials: false,
			methods: ['POST'],
		});

		// サインインの応答は一回限りのもの。中間キャッシュに残さない
		fastify.addHook('onRequest', (request, reply, done) => {
			reply.header('Cache-Control', 'no-store');
			done();
		});

		// 正当なボディの最大は WebAuthn の assertion で数 KB
		const routeOptions = { bodyLimit: 64 * 1024 };

		// NOTE: ワイルドカードルートを登録しないこと。`GET /auth/:token` (MiAuth の認可画面) は
		// ClientServerService の catch-all が返しており、ここで `/auth/*` を拾うと開かなくなる
		fastify.post('/signin/init', routeOptions, (request, reply) => this.signinApiService.signinInit(request, reply));
		fastify.post('/signin/continue', routeOptions, (request, reply) => this.signinApiService.signinContinue(request, reply));

		done();
	}
}
