import { Inject, Injectable } from '@nestjs/common';
import { DI } from '@/di-symbols.js';
import type { DriveFilesRepository } from '@/models/index.js';
import type { Config } from '@/config.js';
import type { CacheableRemoteUser } from '@/models/entities/User.js';
import type { DriveFile } from '@/models/entities/DriveFile.js';
import { MetaService } from '@/core/MetaService.js';
import { truncate } from '@/misc/truncate.js';
import { DB_MAX_IMAGE_COMMENT_LENGTH } from '@/misc/hard-limits.js';
import { DriveService } from '@/core/DriveService.js';
import type Logger from '@/logger.js';
import { ApResolverService } from '../ApResolverService.js';
import { ApLoggerService } from '../ApLoggerService.js';

@Injectable()
export class ApImageService {
	private logger: Logger;

	constructor(
		@Inject(DI.config)
		private config: Config,

		@Inject(DI.driveFilesRepository)
		private driveFilesRepository: DriveFilesRepository,

		private metaService: MetaService,
		private apResolverService: ApResolverService,
		private driveService: DriveService,
		private apLoggerService: ApLoggerService,
	) {
		this.logger = this.apLoggerService.logger;
	}
	
	/**
	 * Imageを作成します。
	 */
	public async createImage(actor: CacheableRemoteUser, value: any): Promise<DriveFile> {
		// 投稿者が凍結されていたらスキップ
		if (actor.isSuspended) {
			throw new Error('actor has been suspended');
		}

		const image = await this.apResolverService.createResolver().resolve(value) as any;

		if (image.url == null) {
			throw new Error('invalid image: url not privided');
		}

		this.logger.info(`Creating the Image: ${image.url}`);

		const instance = await this.metaService.fetch();

		let file = await this.driveService.uploadFromUrl({
			url: image.url,
			user: actor,
			uri: image.url,
			sensitive: image.sensitive,
			isLink: !instance.cacheRemoteFiles,
			comment: truncate(image.name, DB_MAX_IMAGE_COMMENT_LENGTH),
		});

		if (file.isLink) {
			// URLが異なっている場合、同じ画像が以前に異なるURLで登録されていたということなので、
			// URLを更新する
			if (file.url !== image.url) {
				await this.driveFilesRepository.update({ id: file.id }, {
					url: image.url,
					uri: image.url,
				});

				file = await this.driveFilesRepository.findOneByOrFail({ id: file.id });
			}
		}

		return file;
	}

	/**
	 * Imageを解決します。
	 *
	 * Misskeyに対象のImageが登録されていればそれを返し、そうでなければ
	 * リモートサーバーからフェッチしてMisskeyに登録しそれを返します。
	 */
	public async resolveImage(actor: CacheableRemoteUser, value: any): Promise<DriveFile> {
		// TODO

		// リモートサーバーからフェッチしてきて登録
		return await this.createImage(actor, value);
	}
}
