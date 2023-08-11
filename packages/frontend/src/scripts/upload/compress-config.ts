import isAnimated from 'is-file-animated';
import type { BrowserImageResizerConfig } from 'browser-image-resizer';

const compressTypeMap = {
	'image/jpeg': { quality: 0.85, mimeType: 'image/jpeg' },
	'image/png': { quality: 1, mimeType: 'image/png' },
	'image/webp': { quality: 0.85, mimeType: 'image/jpeg' },
	'image/svg+xml': { quality: 1, mimeType: 'image/png' },
} as const;

export async function getCompressionConfig(file: File): Promise<BrowserImageResizerConfig | undefined> {
	const imgConfig = compressTypeMap[file.type];
	if (!imgConfig || await isAnimated(file)) {
		return;
	}

	return {
		maxWidth: 2048,
		maxHeight: 2048,
		debug: true,
		...imgConfig,
	};
}
