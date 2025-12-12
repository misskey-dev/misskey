/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export function isLink(el: HTMLElement) {
	if (el.tagName === 'A') return true;
	if (el.parentElement) {
		return isLink(el.parentElement);
	}
	return false;
}
