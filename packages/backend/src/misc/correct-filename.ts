/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

/**
 * Array.includes()よりSet.has()の方が高速
 */
const targetExtsToSkip = new Set([
	'.gz',
	'.tar',
	'.tgz',
	'.bz2',
	'.xz',
	'.zip',
	'.7z',
]);

const extRegExp = /\.[0-9a-zA-Z]+$/i;

/**
 * 与えられた拡張子とファイル名が一致しているかどうかを確認し、
 * 一致していない場合は拡張子を付与して返す
 * 
 * extはfile-typeのextを想定
 */
export function correctFilename(filename: string, ext: string | null) {
	const dotExt = ext ? ext[0] === '.' ? ext : `.${ext}` : '.unknown';

	const match = extRegExp.exec(filename);
	if (!match || !match[0]) {
		// filenameが拡張子を持っていない場合は拡張子をつける
		return `${filename}${dotExt}`;
	}

	const filenameExt = match[0].toLowerCase();
	if (
		// 未知のファイル形式かつ拡張子がある場合は何もしない
		ext === null ||
		// 拡張子が一致している場合は何もしない
		filenameExt === dotExt ||

		// jpeg, tiffを同一視
		dotExt === '.jpg' && filenameExt === '.jpeg' ||
		dotExt === '.tif' && filenameExt === '.tiff' ||
		// dllもexeもportable executableなので判定が正しく行われない
		dotExt === '.exe' && filenameExt === '.dll' ||

		// 圧縮形式っぽければ下手に拡張子を変えない
		// https://github.com/misskey-dev/misskey/issues/11482
		targetExtsToSkip.has(dotExt)
	) {
		return filename;
	}

	// 拡張子があるが一致していないなどの場合は拡張子を付け足す
	return `${filename}${dotExt}`;
}
