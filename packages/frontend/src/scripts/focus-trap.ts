/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { getHTMLElementOrNull } from '@/scripts/get-or-null.js';

const focusTrapElements = new Set<HTMLElement>();
const ignoreElements = [
	'script',
	'style',
];

function containsFocusTrappedElements(el: HTMLElement): boolean {
	return Array.from(focusTrapElements).some((focusTrapElement) => {
		return el.contains(focusTrapElement);
	});
}

function releaseFocusTrap(el: HTMLElement): void {
	// eslint-disable-next-line @typescript-eslint/ban-ts-comment
	//@ts-expect-error
	if (window.Cypress) return;

	console.log('releaseFocusTrap', el, focusTrapElements.size);
	focusTrapElements.delete(el);
	if (el.parentElement != null && el !== document.body) {
		el.parentElement.childNodes.forEach((siblingNode) => {
			const siblingEl = getHTMLElementOrNull(siblingNode);
			if (!siblingEl) return;
			if (siblingEl !== el && (focusTrapElements.has(siblingEl) || containsFocusTrappedElements(siblingEl) || focusTrapElements.size === 0)) {
				siblingEl.inert = false;
			} else if (
				focusTrapElements.size > 0 &&
				!containsFocusTrappedElements(siblingEl) &&
				!focusTrapElements.has(siblingEl) &&
				!ignoreElements.includes(siblingEl.tagName.toLowerCase())
			) {
				siblingEl.inert = true;
			} else {
				siblingEl.inert = false;
			}
		});
		releaseFocusTrap(el.parentElement);
	}
}

export function focusTrap(el: HTMLElement): { release: () => void; } {
	// eslint-disable-next-line @typescript-eslint/ban-ts-comment
	// @ts-expect-error
	if (window.Cypress) return;

	if (el.parentElement != null && el !== document.body) {
		el.parentElement.childNodes.forEach((siblingNode) => {
			const siblingEl = getHTMLElementOrNull(siblingNode);
			if (!siblingEl) return;
			if (siblingEl !== el && !ignoreElements.includes(siblingEl.tagName.toLowerCase())) {
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
