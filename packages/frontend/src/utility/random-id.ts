/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

const CHARS = 'abcdefghijklmnopqrstuvwxyz'; // CSSの<custom-ident>などで使われることもあるのでa-z以外使うな

export function randomId(length = 32, characters = CHARS) {
	let result = '';
	const charactersLength = characters.length;
	for ( let i = 0; i < length; i++ ) {
		result += characters.charAt(Math.floor(Math.random() * charactersLength));
	}
	return result;
}
