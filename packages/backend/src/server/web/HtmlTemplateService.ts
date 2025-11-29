/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Injectable, Inject } from '@nestjs/common';
import { DI } from '@/di-symbols.js';
import { bindThis } from '@/decorators.js';
import htmlSafeJsonStringify from 'htmlescape';
import { MetaEntityService } from '@/core/entities/MetaEntityService.js';
import type { FastifyReply } from 'fastify';
import type { Config } from '@/config.js';
import type { MiMeta } from '@/models/Meta.js';
import type { CommonData } from './views/_.js';

@Injectable()
export class HtmlTemplateService {

	constructor(
		@Inject(DI.config)
		private config: Config,

		@Inject(DI.meta)
		private meta: MiMeta,

		private metaEntityService: MetaEntityService,
	) {
	}

	@bindThis
	public async getCommonData(): Promise<CommonData> {
		return {
			version: this.config.version,
			config: this.config,
			instanceName: this.meta.name ?? 'Misskey',
			icon: this.meta.iconUrl,
			appleTouchIcon: this.meta.app512IconUrl,
			themeColor: this.meta.themeColor,
			serverErrorImageUrl: this.meta.serverErrorImageUrl ?? 'https://xn--931a.moe/assets/error.jpg',
			infoImageUrl: this.meta.infoImageUrl ?? 'https://xn--931a.moe/assets/info.jpg',
			notFoundImageUrl: this.meta.notFoundImageUrl ?? 'https://xn--931a.moe/assets/not-found.jpg',
			instanceUrl: this.config.url,
			metaJson: htmlSafeJsonStringify(await this.metaEntityService.packDetailed(this.meta)),
			now: Date.now(),
			federationEnabled: this.meta.federation !== 'none',
		};
	}

	public static async replyHtml(reply: FastifyReply, html: string | Promise<string>) {
		reply.header('Content-Type', 'text/html; charset=utf-8');
		const _html = await html;
		return reply.send(_html);
	}
}
