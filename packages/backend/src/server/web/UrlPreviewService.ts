import { Inject, Injectable } from '@nestjs/common';
import summaly from 'summaly';
import { DI } from '@/di-symbols.js';
import type { UsersRepository } from '@/models/index.js';
import type { Config } from '@/config.js';
import { MetaService } from '@/core/MetaService.js';
import { HttpRequestService } from '@/core/HttpRequestService.js';
import type Logger from '@/logger.js';
import { query } from '@/misc/prelude/url.js';
import { LoggerService } from '@/core/LoggerService.js';
import { bindThis } from '@/decorators.js';
import type { FastifyRequest, FastifyReply } from 'fastify';

@Injectable()
export class UrlPreviewService {
	private logger: Logger;

	constructor(
		@Inject(DI.config)
		private config: Config,

		@Inject(DI.usersRepository)
		private usersRepository: UsersRepository,

		private metaService: MetaService,
		private httpRequestService: HttpRequestService,
		private loggerService: LoggerService,
	) {
		this.logger = this.loggerService.getLogger('url-preview');
	}

	@bindThis
	private wrap(url?: string): string | null {
		return url != null
			? url.match(/^https?:\/\//)
				? `${this.config.url}/proxy/preview.webp?${query({
					url,
					preview: '1',
				})}`
				: url
			: null;
	}

	@bindThis
	public async handle(
		request: FastifyRequest<{ Querystring: { url: string; lang: string; } }>,
		reply: FastifyReply,
	) {
		const url = request.query.url;
		if (typeof url !== 'string') {
			reply.code(400);
			return;
		}
	
		const lang = request.query.lang;
		if (Array.isArray(lang)) {
			reply.code(400);
			return;
		}
	
		const meta = await this.metaService.fetch();
	
		this.logger.info(meta.summalyProxy
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
	
			this.logger.succ(`Got preview of ${url}: ${summary.title}`);
	
			summary.icon = this.wrap(summary.icon);
			summary.thumbnail = this.wrap(summary.thumbnail);
	
			// Cache 7days
			reply.header('Cache-Control', 'max-age=604800, immutable');
	
			return summary;
		} catch (err) {
			this.logger.warn(`Failed to get preview of ${url}: ${err}`);
			reply.code(200);
			reply.header('Cache-Control', 'max-age=86400, immutable');
			return {};
		}
	}
}
