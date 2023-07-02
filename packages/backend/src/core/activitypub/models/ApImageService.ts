import { Inject, Injectable } from '@nestjs/common';
import type { DriveFilesRepository } from '@/models/index.js';
import type { RemoteUser } from '@/models/entities/User.js';
import type { DriveFile } from '@/models/entities/DriveFile.js';
import { truncate } from '@/misc/truncate.js';
import { checkHttps } from '@/misc/check-https.js';
import type Logger from '@/logger.js';
import { DI } from '@/di-symbols.js';
import { bindThis } from '@/decorators.js';
import type { MetaService } from '@/core/MetaService.js';
import type { DriveService } from '@/core/DriveService.js';
import { DB_MAX_IMAGE_COMMENT_LENGTH } from '@/const.js';
import type { Config } from '@/config.js';
import type { IObject } from '../type.js';
import type { ApResolverService } from '../ApResolverService.js';
import type { ApLoggerService } from '../ApLoggerService.js';

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
	@bindThis
	public async createImage(actor: RemoteUser, value: string | IObject): Promise<DriveFile> {
		// 投稿者が凍結されていたらスキップ
		if (actor.isSuspended) {
			throw new Error('actor has been suspended');
		}

		const image = await this.apResolverService.createResolver().resolve(value);

		if (image.url == null) {
			throw new Error('invalid image: url not privided');
		}

		if (typeof image.url !== 'string') {
			throw new Error('invalid image: unexpected type of url: ' + JSON.stringify(image.url));
		}

		if (!checkHttps(image.url)) {
			throw new Error('invalid image: unexpected schema of url: ' + image.url);
		}

		this.logger.info(`Creating the Image: ${image.url}`);

		const instance = await this.metaService.fetch();

		let file = await this.driveService.uploadFromUrl({
			url: image.url,
			user: actor,
			uri: image.url,
			sensitive: image.sensitive,
			isLink: !instance.cacheRemoteFiles,
			comment: truncate(image.name ?? undefined, DB_MAX_IMAGE_COMMENT_LENGTH),
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
	@bindThis
	public async resolveImage(actor: RemoteUser, value: string | IObject): Promise<DriveFile> {
		// TODO

		// リモートサーバーからフェッチしてきて登録
		return await this.createImage(actor, value);
	}
}
