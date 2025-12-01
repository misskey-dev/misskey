/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promises as fsp } from 'node:fs';
import { languages } from 'i18n/const';
import { Injectable, Inject } from '@nestjs/common';
import { DI } from '@/di-symbols.js';
import { bindThis } from '@/decorators.js';
import { htmlSafeJsonStringify } from '@/misc/json-stringify-html-safe.js';
import { MetaEntityService } from '@/core/entities/MetaEntityService.js';
import type { FastifyReply } from 'fastify';
import type { Config } from '@/config.js';
import type { MiMeta } from '@/models/Meta.js';
import type { CommonData } from './views/_.js';

const _filename = fileURLToPath(import.meta.url);
const _dirname = dirname(_filename);

const frontendVitePublic = `${_dirname}/../../../../frontend/public/`;
const frontendEmbedVitePublic = `${_dirname}/../../../../frontend-embed/public/`;

@Injectable()
export class HtmlTemplateService {
	private frontendBootloadersFetched = false;
	public frontendBootloaderJs: string | null = null;
	public frontendBootloaderCss: string | null = null;
	public frontendEmbedBootloaderJs: string | null = null;
	public frontendEmbedBootloaderCss: string | null = null;

	constructor(
		@Inject(DI.config)
		private config: Config,

		@Inject(DI.meta)
		private meta: MiMeta,

		private metaEntityService: MetaEntityService,
	) {
	}

	@bindThis
	private async prepareFrontendBootloaders() {
		if (this.frontendBootloadersFetched) return;
		this.frontendBootloadersFetched = true;

		const [bootJs, bootCss, embedBootJs, embedBootCss] = await Promise.all([
			fsp.readFile(`${frontendVitePublic}loader/boot.js`, 'utf-8').catch(() => null),
			fsp.readFile(`${frontendVitePublic}loader/style.css`, 'utf-8').catch(() => null),
			fsp.readFile(`${frontendEmbedVitePublic}loader/boot.js`, 'utf-8').catch(() => null),
			fsp.readFile(`${frontendEmbedVitePublic}loader/style.css`, 'utf-8').catch(() => null),
		]);

		if (bootJs != null) {
			this.frontendBootloaderJs = bootJs;
		}

		if (bootCss != null) {
			this.frontendBootloaderCss = bootCss;
		}

		if (embedBootJs != null) {
			this.frontendEmbedBootloaderJs = embedBootJs;
		}

		if (embedBootCss != null) {
			this.frontendEmbedBootloaderCss = embedBootCss;
		}
	}

	@bindThis
	public async getCommonData(): Promise<CommonData> {
		await this.prepareFrontendBootloaders();

		return {
			version: this.config.version,
			config: this.config,
			langs: [...languages],
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
			frontendBootloaderJs: this.frontendBootloaderJs,
			frontendBootloaderCss: this.frontendBootloaderCss,
			frontendEmbedBootloaderJs: this.frontendEmbedBootloaderJs,
			frontendEmbedBootloaderCss: this.frontendEmbedBootloaderCss,
		};
	}

	public static async replyHtml(reply: FastifyReply, html: string | Promise<string>) {
		reply.header('Content-Type', 'text/html; charset=utf-8');
		const _html = await html;
		return reply.send(_html);
	}
}
