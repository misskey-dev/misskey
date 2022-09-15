import { Inject, Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Emojis } from '@/models/index.js';
import { GlobalEventService } from '@/services/GlobalEventService.js';
import { DI } from '@/di-symbols.js';
import { Config } from '@/config.js';
import { IdService } from '@/services/IdService.js';
import type { DriveFile } from '@/models/entities/drive-file.js';
import type { Emoji } from '@/models/entities/emoji.js';

@Injectable()
export class CustomEmojiService {
	constructor(
		@Inject(DI.config)
		private config: Config,

		@Inject(DI.db)
		private db: DataSource,

		@Inject('emojisRepository')
		private emojisRepository: typeof Emojis,

		private idService: IdService,
		private globalEventServie: GlobalEventService,
	) {
	}

	public async add(data: {
		driveFile: DriveFile;
		name: string;
		category: string | null;
		aliases: string[];
		host: string | null;
	}): Promise<Emoji> {
		const emoji = await this.emojisRepository.insert({
			id: this.idService.genId(),
			updatedAt: new Date(),
			name: data.name,
			category: data.category,
			host: data.host,
			aliases: data.aliases,
			originalUrl: data.driveFile.url,
			publicUrl: data.driveFile.webpublicUrl ?? data.driveFile.url,
			type: data.driveFile.webpublicType ?? data.driveFile.type,
		}).then(x => Emojis.findOneByOrFail(x.identifiers[0]));

		await this.db.queryResultCache!.remove(['meta_emojis']);

		return emoji;
	}
}
