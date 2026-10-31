/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { generateVideoThumbnail } from '@misskey-dev/media-core/video';
import type { IImage } from '@misskey-dev/media-core';
import { DI } from '@/di-symbols.js';
import type { Config } from '@/config.js';
import { bindThis } from '@/decorators.js';
import { appendQuery, query } from '@/misc/prelude/url.js';

@Injectable()
export class VideoProcessingService {
	constructor(
		@Inject(DI.config)
		private config: Config,
	) {
	}

	/**
	 * 動画のサムネイルを生成する (実装は @misskey-dev/media-core/video)
	 */
	@bindThis
	public async generateVideoThumbnail(source: string): Promise<IImage> {
		return generateVideoThumbnail(source);
	}

	@bindThis
	public getExternalVideoThumbnailUrl(url: string): string | null {
		if (this.config.videoThumbnailGenerator == null) return null;

		return appendQuery(
			`${this.config.videoThumbnailGenerator}/thumbnail.webp`,
			query({
				thumbnail: '1',
				url,
			}),
		);
	}
}

