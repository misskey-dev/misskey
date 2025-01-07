/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
//@ts-check

/** @type {(arg: import('tsc-alias').AliasReplacerArguments) => string} */
exports.default = (arg) => {
	if (/\.js["']$/.test(arg.orig)) {
		return arg.orig.replace(/\.js/, '.mjs');
	}

	return arg.orig;
};

