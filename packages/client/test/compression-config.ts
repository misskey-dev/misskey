import { readFileSync } from 'node:fs';
import { getCompressionConfig } from '@/scripts/upload/compress-config.js';

function getBlob(url: string, type: string): Blob {
	return new Blob([readFileSync(new URL(url, import.meta.url))], { type });
}

describe('Image compression configuration', () => {
	it('PNG should be compressed', async () => {
		const blob = getBlob('./clock-static.png', 'image/png');
		const config = await getCompressionConfig(blob);

		expect(config).toBeTruthy();
		expect(config?.mimeType).toBe('image/jpeg');
	});

	it('Animated PNG should not be compressed', async () => {
		const blob = getBlob('./clock.png', 'image/png');
		const config = await getCompressionConfig(blob);

		expect(config).toBeUndefined();
	});

	it('WebP should be compressed', async () => {
		const blob = getBlob('./clock-static.webp', 'image/webp');
		const config = await getCompressionConfig(blob);

		expect(config).toBeTruthy();
		expect(config?.mimeType).toBe('image/jpeg');
	});

	it('Animated WebP should not be compressed', async () => {
		const blob = getBlob('./clock.webp', 'image/webp');
		const config = await getCompressionConfig(blob);

		expect(config).toBeUndefined();
	});
});
