/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export default (v, digits = 0) => {
	if (v == null) return '?';
	const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
	if (v === 0) return '0';
	const isMinus = v < 0;
	if (isMinus) v = -v;
	const i = Math.floor(Math.log(v) / Math.log(1024));
	return (isMinus ? '-' : '') + (v / Math.pow(1024, i)).toFixed(digits).replace(/\.0+$/, '') + sizes[i];
};
