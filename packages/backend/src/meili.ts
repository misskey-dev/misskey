import { MeiliSearch, Index } from 'meilisearch';
import { Inject, OnModuleInit } from '@nestjs/common';
import type { Config } from '@/config.js';
import { DI } from '@/di-symbols.js';

export class Meili implements OnModuleInit {
	public index: Index | null = null;
	private client: MeiliSearch;
	constructor(
		@Inject(DI.config) private config: Config,
	) { }

	async onModuleInit(): Promise<void> {
		if (this.config.meilisearch) {
			this.client = new MeiliSearch({
				host: `http://${this.config.meilisearch.host}:${this.config.meilisearch.port}`, 
				apiKey: this.config.meilisearch.apiKey,			
			});
			this.index = this.client.index(this.config.meilisearch.index);
			this.index.updateSettings(
				this.config.meilisearch.config,
			);
		}
	}
}
