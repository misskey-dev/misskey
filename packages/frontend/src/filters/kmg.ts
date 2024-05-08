/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export default (v, fractionDigits = 0) => {
	if (v == null) return 'N/A';
	if (v === 0) return '0';
	const sizes = ['', 'K', 'M', 'G', 'T', 'P', 'E', 'Z', 'Y', 'R', 'Q'];
	const isMinus = v < 0;
	if (isMinus) v = -v;
	const i = Math.floor(Math.log(v) / Math.log(1000));
	return (isMinus ? '-' : '') + (v / Math.pow(1000, i)).toFixed(fractionDigits).replace(/(\.[1-9]*)0+$/, '$1').replace(/\.$/, '') + (sizes[i] ?? `e+${ i * 3 }`);
};
