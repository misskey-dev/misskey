import isAnimated from 'is-file-animated';
import { isWebpSupported } from './isWebpSupported';
import type { BrowserImageResizerConfig } from 'browser-image-resizer';
import { defaultStore } from '@/store';

const compressTypeMap = {
	'lossy': { quality: 0.90, mimeType: 'image/webp' },
	'lossless': { quality: 1, mimeType: 'image/webp' },
} as const;

const compressTypeMapFallback = {
	'lossy': { quality: 0.85, mimeType: 'image/jpeg' },
	'lossless': { quality: 1, mimeType: 'image/png' },
} as const;

const prefferedCompressKindMap = {
	'image/jpeg': 'lossy',
	'image/png': 'lossless',
	'image/webp': 'lossy',
	'image/svg+xml': 'lossless',
} as const;

const reiszeSizeConfig = { maxWidth: 2048, maxHeight: 2048 } as const;
const noRseizeSizeConfig = { maxWidth: Number.MAX_SAFE_INTEGER, maxHeight: Number.MAX_SAFE_INTEGER } as const;

export async function getCompressionConfig(file: File): Promise<BrowserImageResizerConfig | undefined> {
	// TODO: 可能ならwebpの可逆/非可逆の判定を行いたい
	let compressKind: 'lossy' | 'lossless' | undefined = prefferedCompressKindMap[file.type];
	if (!compressKind) return;
	if (await isAnimated(file)) return;

	let resize: boolean;

	switch (defaultStore.state.imageCompressionMode) {
		case 'resizeCompress':
		case null:
		default:
			resize = true;
			break;
		case 'noResizeCompress':
			resize = false;
			break;
		case 'resizeCompressLossy':
			resize = true;
			compressKind = 'lossy';
			break;
		case 'noResizeCompressLossy':
			resize = false;
			compressKind = 'lossy';
			break;
	}

	const webpSupported = isWebpSupported();
	if (!webpSupported && !resize && file.type === 'image/webp') {
		// input is webp and resize is disabled but webp compression is not enabled: it's liley to have lower compression
		return undefined;
	}

	const imgFormatConfig = (webpSupported ? compressTypeMap : compressTypeMapFallback)[compressKind];
	const sizeConfig = resize ? reiszeSizeConfig : noRseizeSizeConfig;

	return {
		debug: true,
		...imgFormatConfig,
		...sizeConfig,
	};
}
