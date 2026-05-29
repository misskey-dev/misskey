/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { Hono } from 'hono';
import type { Config } from '@/config.js';
import { DI } from '@/di-symbols.js';
import { bindThis } from '@/decorators.js';
import { genOpenapiSpec } from './gen-spec.js';
import { ApiDocPage } from './api-doc.js';

@Injectable()
export class OpenApiServerService {
	constructor(
		@Inject(DI.config)
		private config: Config,
	) {
	}

	@bindThis
	public createServer(): Hono {
		const hono = new Hono();

		hono.get('/api-doc', (ctx) => {
			ctx.header('Cache-Control', 'public, max-age=86400');
			return ctx.html(ApiDocPage());
		});

		hono.get('/api.json', (ctx) => {
			ctx.header('Cache-Control', 'public, max-age=600');
			return ctx.json(genOpenapiSpec(this.config));
		});

		return hono;
	}
}
