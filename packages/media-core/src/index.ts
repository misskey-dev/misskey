/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// 本体バックエンドとスタンドアロン版メディアプロキシの両方で使用するもの
// スタンドアロン版でしか使用しないものは ./standalone.ts からエクスポートし、
// 本体が読み込むモジュール (と依存パッケージ) を最小限に保つ

// common
export { StatusError } from './common/status-error.js';
export { FILE_TYPE_BROWSERSAFE } from './common/const.js';
export { isMimeImage, fixMime } from './common/mime.js';
export { contentDisposition } from './common/content-disposition.js';
export { correctFilename } from './common/correct-filename.js';

// file
export { detectType, checkSvg, getFileSize, TYPE_OCTET_STREAM, TYPE_SVG } from './file/file-type.js';
export type { DetectedType, DetectTypeOptions } from './file/file-type.js';
export { calcHash } from './file/hash.js';
export { detectImageSize } from './file/image-size.js';
export type { ImageSize } from './file/image-size.js';

// image
export {
	webpDefault,
	avifDefault,
	convertToWebp,
	convertSharpToWebp,
	convertToWebpStream,
	convertSharpToWebpStream,
	convertToAvif,
	convertSharpToAvif,
	convertToAvifStream,
	convertSharpToAvifStream,
	convertToPng,
	convertSharpToPng,
} from './image/image.js';
export type { IImage, IImageStream, IImageSharp, IImageStreamable } from './image/image.js';
export { getBlurhash } from './image/blurhash.js';

// download
export { downloadUrl } from './download/download.js';
export type { DownloadOptions, DownloadLogger } from './download/download.js';

// proxy
export { getProxyTargetUrl, validateProxyUserAgent } from './proxy/proxy-request.js';
export type { ProxyQuery } from './proxy/proxy-request.js';
export { convertProxyImage } from './proxy/proxy-image.js';
export type { ProxySourceFile } from './proxy/proxy-image.js';
export { createProxyResponseHeaders } from './proxy/proxy-response.js';
