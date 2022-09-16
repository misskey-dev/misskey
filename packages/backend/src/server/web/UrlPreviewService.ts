import { Inject, Injectable } from '@nestjs/common';
import summaly from 'summaly';
import { DI } from '@/di-symbols.js';
import type { Users } from '@/models/index.js';
import { Config } from '@/config.js';
import { MetaService } from '@/services/MetaService.js';
import { HttpRequestService } from '@/services/HttpRequestService.js';
import Logger from '@/logger.js';
import { query } from '@/prelude/url.js';
import type Koa from 'koa';

@Injectable()
export class UrlPreviewService {
	#logger: Logger;

	constructor(
		@Inject(DI.config)
		private config: Config,

		@Inject(DI.usersRepository)
		private usersRepository: typeof Users,

		private metaService: MetaService,
		private httpRequestService: HttpRequestService,
	) {
		this.#logger = new Logger('url-preview');
	}

	#wrap(url?: string): string | null {
		return url != null
			? url.match(/^https?:\/\//)
				? `${this.config.url}/proxy/preview.webp?${query({
					url,
					preview: '1',
				})}`
				: url
			: null;
	}

	public async handle(ctx: Koa.Context) {
		const url = ctx.query.url;
		if (typeof url !== 'string') {
			ctx.status = 400;
			return;
		}
	
		const lang = ctx.query.lang;
		if (Array.isArray(lang)) {
			ctx.status = 400;
			return;
		}
	
		const meta = await this.metaService.fetch();
	
		this.#logger.info(meta.summalyProxy
			? `(Proxy) Getting preview of ${url}@${lang} ...`
			: `Getting preview of ${url}@${lang} ...`);
	
		try {
			const summary = meta.summalyProxy ? await this.httpRequestService.getJson(`${meta.summalyProxy}?${query({
				url: url,
				lang: lang ?? 'ja-JP',
			})}`) : await summaly.default(url, {
				followRedirects: false,
				lang: lang ?? 'ja-JP',
			});
	
			this.#logger.succ(`Got preview of ${url}: ${summary.title}`);
	
			summary.icon = this.#wrap(summary.icon);
			summary.thumbnail = this.#wrap(summary.thumbnail);
	
			// Cache 7days
			ctx.set('Cache-Control', 'max-age=604800, immutable');
	
			ctx.body = summary;
		} catch (err) {
			this.#logger.warn(`Failed to get preview of ${url}: ${err}`);
			ctx.status = 200;
			ctx.set('Cache-Control', 'max-age=86400, immutable');
			ctx.body = '{}';
		}
	}
}
