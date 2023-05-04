import { MeiliSearch, Index } from 'meilisearch';
import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import type { Config } from '@/config.js';
import { DI } from '@/di-symbols.js';
import { Note } from '@/models/entities/Note.js';

@Injectable()
export class MeiliService implements OnModuleInit {
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

	addNote (note: Note): void {
		if ( this.index !== null && !(note.renoteId && !note.text) ) {
			this.index.addDocuments([
				{
					id: note.id,
					createdAt: note.createdAt,
					text: note.text,
					cw: note.cw,
					userHost: note.userHost,
				},
			]);			
		}
	}
}
