/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import textExts from 'text-extensions';

/**
 * Array.includes()よりSet.has()の方が高速
 */

const targetExtsToSkip = new Set([
	'gz',
	'tar',
	'tgz',
	'bz2',
	'xz',
	'zip',
	'7z',
]);

const sourceExtsToSkip = new Set(textExts);

const extRegExp = /\.([0-9a-zA-Z]+$)/i;

/**
 * 与えられた拡張子とファイル名が一致しているかどうかを確認し、
 * 一致していない場合は拡張子を付与して返す
 * 
 * extはfile-typeのextを想定
 */
export function correctFilename(filename: string, ext: string | null) {
	const dotExt = ext ? ext.startsWith('.') ? ext : `.${ext}` : '.unknown';

	const match = extRegExp.exec(filename);
	if (!match || !match[1]) {
		return `${filename}${dotExt}`;
	}
	const filenameExt = match[1].toLowerCase();
	if (filenameExt === ext) {
		return filename;
	}

	if (
		ext === 'jpg' && filenameExt === 'jpeg' ||
		ext === 'tif' && filenameExt === 'tiff' ||

		// 圧縮形式っぽければ下手に拡張子を変えない
		// https://github.com/misskey-dev/misskey/issues/11482
		ext !== null && targetExtsToSkip.has(ext) ||

		// テキストファイル？（ext === null）かつ拡張子がテキストファイルっぽい場合は
		// 拡張子を変えない
		ext === null && sourceExtsToSkip.has(filenameExt)
	) {
		return filename;
	}
	return `${filename}${dotExt}`;
}
