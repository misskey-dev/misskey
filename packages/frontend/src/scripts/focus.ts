/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export function focusPrev(el: Element | null, self = false, scroll = true) {
	if (el == null) return;
	if (!self) el = el.previousElementSibling;
	if (el) {
		if (el.hasAttribute('tabindex')) {
			(el as HTMLElement).focus({
				preventScroll: !scroll,
			});
		} else {
			focusPrev(el.previousElementSibling, true);
		}
	}
}

export function focusNext(el: Element | null, self = false, scroll = true) {
	if (el == null) return;
	if (!self) el = el.nextElementSibling;
	if (el) {
		if (el.hasAttribute('tabindex')) {
			(el as HTMLElement).focus({
				preventScroll: !scroll,
			});
		} else {
			focusPrev(el.nextElementSibling, true);
		}
	}
}
