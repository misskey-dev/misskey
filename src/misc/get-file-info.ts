import * as fs from 'fs';
import * as crypto from 'crypto';
import * as stream from 'stream';
import * as util from 'util';
import * as fileType from 'file-type';
import isSvg from 'is-svg';
import * as probeImageSize from 'probe-image-size';
import * as sharp from 'sharp';
import { encode } from 'blurhash';

const pipeline = util.promisify(stream.pipeline);

export type FileInfo = {
	size: number;
	md5: string;
	type: {
		mime: string;
		ext: string | null;
	};
	width?: number;
	height?: number;
	blurhash?: string;
	warnings: string[];
};

const TYPE_OCTET_STREAM = {
	mime: 'application/octet-stream',
	ext: null
};

const TYPE_SVG = {
	mime: 'image/svg+xml',
	ext: 'svg'
};

/**
 * Get file information
 */
export async function getFileInfo(path: string): Promise<FileInfo> {
	const warnings = [] as string[];

	const size = await getFileSize(path);
	const md5 = await calcHash(path);

	let type = await detectType(path);

	// image dimensions
	let width: number | undefined;
	let height: number | undefined;

	if (['image/jpeg', 'image/gif', 'image/png', 'image/apng', 'image/webp', 'image/bmp', 'image/tiff', 'image/svg+xml', 'image/vnd.adobe.photoshop'].includes(type.mime)) {
		const imageSize = await detectImageSize(path).catch(e => {
			warnings.push(`detectImageSize failed: ${e}`);
			return undefined;
		});

		// うまく判定できない画像は octet-stream にする
		if (!imageSize) {
			warnings.push(`cannot detect image dimensions`);
			type = TYPE_OCTET_STREAM;
		} else if (imageSize.wUnits === 'px') {
			width = imageSize.width;
			height = imageSize.height;

			// 制限を超えている画像は octet-stream にする
			if (imageSize.width > 16383 || imageSize.height > 16383) {
				warnings.push(`image dimensions exceeds limits`);
				type = TYPE_OCTET_STREAM;
			}
		} else {
			warnings.push(`unsupported unit type: ${imageSize.wUnits}`);
		}
	}

	let blurhash: string | undefined;

	if (['image/jpeg', 'image/gif', 'image/png', 'image/apng', 'image/webp', 'image/svg+xml'].includes(type.mime)) {
		blurhash = await getBlurhash(path).catch(e => {
			warnings.push(`getBlurhash failed: ${e}`);
			return undefined;
		});
	}

	return {
		size,
		md5,
		type,
		width,
		height,
		blurhash,
		warnings,
	};
}

/**
 * Detect MIME Type and extension
 */
export async function detectType(path: string) {
	// Check 0 byte
	const fileSize = await getFileSize(path);
	if (fileSize === 0) {
		return TYPE_OCTET_STREAM;
	}

	const type = await fileType.fromFile(path);

	if (type) {
		// XMLはSVGかもしれない
		if (type.mime === 'application/xml' && await checkSvg(path)) {
			return TYPE_SVG;
		}

		return {
			mime: type.mime,
			ext: type.ext
		};
	}

	// 種類が不明でもSVGかもしれない
	if (await checkSvg(path)) {
		return TYPE_SVG;
	}

	// それでも種類が不明なら application/octet-stream にする
	return TYPE_OCTET_STREAM;
}

/**
 * Check the file is SVG or not
 */
export async function checkSvg(path: string) {
	try {
		const size = await getFileSize(path);
		if (size > 1 * 1024 * 1024) return false;
		return isSvg(fs.readFileSync(path));
	} catch {
		return false;
	}
}

/**
 * Get file size
 */
export async function getFileSize(path: string): Promise<number> {
	const getStat = util.promisify(fs.stat);
	return (await getStat(path)).size;
}

/**
 * Calculate MD5 hash
 */
async function calcHash(path: string): Promise<string> {
	const hash = crypto.createHash('md5').setEncoding('hex');
	await pipeline(fs.createReadStream(path), hash);
	return hash.read();
}

/**
 * Detect dimensions of image
 */
async function detectImageSize(path: string): Promise<{
	width: number;
	height: number;
	wUnits: string;
	hUnits: string;
}> {
	const readable = fs.createReadStream(path);
	const imageSize = await probeImageSize(readable);
	readable.destroy();
	return imageSize;
}

/**
 * Calculate average color of image
 */
function getBlurhash(path: string): Promise<string> {
	return new Promise((resolve, reject) => {
		sharp(path)
			.raw()
			.ensureAlpha()
			.resize(64, 64, { fit: 'inside' })
			.toBuffer((err, buffer, { width, height }) => {
				if (err) return reject(err);
				resolve(encode(new Uint8ClampedArray(buffer), width, height, 7, 7));
			});
	});
}
