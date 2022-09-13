import { Inject, Injectable } from '@nestjs/common';
import { Emojis } from '@/models/index.js';
import type { GlobalEventService } from '@/services/GlobalEventService.js';
import { DI_SYMBOLS } from '@/di-symbols.js';
import type { Config } from '@/config/types.js';
import { genId } from '@/misc/gen-id.js';
import type { DriveFile } from '@/models/entities/drive-file.js';
import type { Emoji } from '@/models/entities/emoji.js';
import type { DataSource } from 'typeorm';

@Injectable()
export class CustomEmojiService {
	constructor(
		@Inject(DI_SYMBOLS.config)
		private config: Config,

		@Inject(DI_SYMBOLS.db)
		private db: DataSource,

		@Inject('emojisRepository')
		private emojisRepository: typeof Emojis,

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
			id: genId(),
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
