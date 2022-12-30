import { Inject, Injectable } from '@nestjs/common';
import { DataSource, In, IsNull } from 'typeorm';
import { DI } from '@/di-symbols.js';
import { IdService } from '@/core/IdService.js';
import type { DriveFile } from '@/models/entities/DriveFile.js';
import type { Emoji } from '@/models/entities/Emoji.js';
import type { EmojisRepository } from '@/models/index.js';
import { bindThis } from '@/decorators.js';

@Injectable()
export class CustomEmojiService {
	constructor(
		@Inject(DI.db)
		private db: DataSource,

		@Inject(DI.emojisRepository)
		private emojisRepository: EmojisRepository,

		private idService: IdService,
	) {
	}

	@bindThis
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
		}).then(x => this.emojisRepository.findOneByOrFail(x.identifiers[0]));

		await this.db.queryResultCache!.remove(['meta_emojis']);

		return emoji;
	}
}
