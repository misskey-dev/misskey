import { Injectable } from '@nestjs/common';
import sharp from 'sharp';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { CustomEmojiService } from '@/core/CustomEmojiService.js';

export const meta = {
	tags: ['admin'],
	requireCredential: true,
	requireRolePolicy: 'canManageCustomEmojis',
	kind: 'write:admin:emoji',
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		url: {
			type: 'string',
		},
	},
	required: ['url'],
} as const;

@Injectable()
// eslint-disable-next-line import/no-default-export
export default class extends Endpoint<typeof meta, typeof paramDef> {
	constructor(
		private customEmojiService: CustomEmojiService,
	) {
		super(meta, paramDef, async (ps, me) => {
			const response = await fetch(ps.url, {
				'headers': {
					'accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
					'cache-control': 'no-cache',
					'pragma': 'no-cache',
					'priority': 'u=1, i',
				},
				'method': 'GET',
			});

			if (!response.ok) {
				throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
			}
			const buffer = await response.arrayBuffer();
			const metadata = await sharp(buffer).metadata();

			if (!metadata.pages) {
				throw new Error('Invalid image format or no animation frames found.');
			}

			const frameRate = metadata.delay && metadata.delay.length > 0
				? 1000 / metadata.delay[0]
				: 30; // Fallback to 30 FPS if no delay information is present

			const colorsPerFrame: number[] = [];
			for (let i = 0; i < metadata.pages; i++) {
				const { data, info } = await sharp(buffer, { page: i }).raw().toBuffer({ resolveWithObject: true });
				const uniqueColors = new Set<string>();
				for (let y = 0; y < info.height; y++) {
					for (let x = 0; x < info.width; x++) {
						const offset = (y * info.width + x) * info.channels;
						const color = `${data[offset]}-${data[offset + 1]}-${data[offset + 2]}`;
						uniqueColors.add(color);
					}
				}
				colorsPerFrame.push(uniqueColors.size);
			}

			const colorChanges = colorsPerFrame.map((colorCount, index, arr) => {
				if (index === 0) return 0;
				return Math.abs(colorCount - arr[index - 1]);
			});

			const averageColorChangePerSecond = colorChanges.reduce((sum, change) => sum + change, 0) / colorsPerFrame.length;
			 console.log('Average color change per second:', 10 < averageColorChangePerSecond);
			return Boolean(10 < averageColorChangePerSecond);
			// You can store or use this information as needed
		});
	}
}
