import { Inject, Injectable } from '@nestjs/common';
import FFmpeg from 'fluent-ffmpeg';
import { DI } from '@/di-symbols.js';
import type { Config } from '@/config.js';
import { ImageProcessingService } from '@/core/ImageProcessingService.js';
import type { IImage } from '@/core/ImageProcessingService.js';
import { createTempDir } from '@/misc/create-temp.js';
import { bindThis } from '@/decorators.js';
import { appendQuery, query } from '@/misc/prelude/url.js';

@Injectable()
export class VideoProcessingService {
	constructor(
		@Inject(DI.config)
		private config: Config,

		private imageProcessingService: ImageProcessingService,
	) {
	}

	@bindThis
	public async generateVideoThumbnail(source: string): Promise<IImage> {
		const [dir, cleanup] = await createTempDir();
	
		try {
			await new Promise((res, rej) => {
				FFmpeg({
					source,
				})
					.on('end', res)
					.on('error', rej)
					.screenshot({
						folder: dir,
						filename: 'out.png',	// must have .png extension
						count: 1,
						timestamps: ['5%'],
					});
			});

			return await this.imageProcessingService.convertToWebp(`${dir}/out.png`, 498, 422);
		} finally {
			cleanup();
		}
	}

	@bindThis
	public getExternalVideoThumbnailUrl(url: string): string | null {
		if (this.config.videoThumbnailGenerator == null) return null;

		return appendQuery(
			`${this.config.videoThumbnailGenerator}/thumbnail.webp`,
			query({
				thumbnail: '1',
				url,
			})
		);
	}
}

