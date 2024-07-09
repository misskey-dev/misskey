/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { getHTMLElementOrNull } from '@/scripts/get-or-null.js';

function releaseFocusTrap(el: HTMLElement): void {
	if (el.parentElement && el.parentElement !== document.body) {
		el.parentElement.childNodes.forEach((siblingNode) => {
			const siblingEl = getHTMLElementOrNull(siblingNode);
			if (!siblingEl) return;
			if (siblingEl !== el) {
				siblingEl.inert = false;
			}
		});
		releaseFocusTrap(el.parentElement);
	}
}

export function focusTrap(el: HTMLElement): { release: () => void; } {
	if (el.parentElement && el.parentElement !== document.body) {
		el.parentElement.childNodes.forEach((siblingNode) => {
			const siblingEl = getHTMLElementOrNull(siblingNode);
			if (!siblingEl) return;
			if (siblingEl !== el) {
				siblingEl.inert = true;
			}
		});
		focusTrap(el.parentElement);
	}

	return {
		release: () => {
			releaseFocusTrap(el);
		},
	};
}
