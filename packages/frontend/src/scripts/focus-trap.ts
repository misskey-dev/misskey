/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { getHTMLElementOrNull } from '@/scripts/get-dom-node-or-null.js';

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
	focusTrapElements.delete(el);
	if (el.inert === true) {
		el.inert = false;
	}
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

export function focusTrap(el: HTMLElement, hasInteractionWithOtherFocusTrappedEls: boolean, parent: true): void;
export function focusTrap(el: HTMLElement, hasInteractionWithOtherFocusTrappedEls?: boolean, parent?: false): { release: () => void; };
export function focusTrap(el: HTMLElement, hasInteractionWithOtherFocusTrappedEls = false, parent = false): { release: () => void; } | void {
	if (el.inert === true) {
		el.inert = false;
	}
	if (el.parentElement != null && el !== document.body) {
		el.parentElement.childNodes.forEach((siblingNode) => {
			const siblingEl = getHTMLElementOrNull(siblingNode);
			if (!siblingEl) return;
			if (
				siblingEl !== el &&
				(
					hasInteractionWithOtherFocusTrappedEls === false ||
					(!focusTrapElements.has(siblingEl) && !containsFocusTrappedElements(siblingEl))
				) &&
				!ignoreElements.includes(siblingEl.tagName.toLowerCase())
			) {
				siblingEl.inert = true;
			}
		});
		focusTrap(el.parentElement, hasInteractionWithOtherFocusTrappedEls, true);
	}

	if (!parent) {
		focusTrapElements.add(el);

		return {
			release: () => {
				releaseFocusTrap(el);
			},
		};
	}
}
