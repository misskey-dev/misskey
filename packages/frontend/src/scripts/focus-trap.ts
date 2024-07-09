/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { getHTMLElementOrNull } from '@/scripts/get-or-null.js';

const focusTrapElements = new Set<HTMLElement>();

function containsFocusTrappedElements(el: HTMLElement): boolean {
	return Array.from(focusTrapElements).some((focusTrapElement) => {
		return el.contains(focusTrapElement);
	});
}

function releaseFocusTrap(el: HTMLElement): void {
	focusTrapElements.delete(el);
	if (el.parentElement && el.parentElement !== document.body) {
		el.parentElement.childNodes.forEach((siblingNode) => {
			const siblingEl = getHTMLElementOrNull(siblingNode);
			if (!siblingEl) return;
			if (siblingEl !== el && (focusTrapElements.has(siblingEl) || containsFocusTrappedElements(siblingEl) || focusTrapElements.size === 0)) {
				siblingEl.inert = false;
			} else if (!containsFocusTrappedElements(siblingEl) && !focusTrapElements.has(siblingEl)) {
				siblingEl.inert = true;
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

	focusTrapElements.add(el);

	return {
		release: () => {
			releaseFocusTrap(el);
		},
	};
}
