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

function getZIndex(el: HTMLElement): number {
	const zIndex = parseInt(window.getComputedStyle(el).zIndex || '0', 10);
	if (isNaN(zIndex)) {
		return 0;
	}
	return zIndex;
}

function getHighestZIndexElement(): { el: HTMLElement; zIndex: number; } | null {
	let highestZIndexElement: HTMLElement | null = null;
	let highestZIndex = -Infinity;

	focusTrapElements.forEach((el) => {
		const zIndex = getZIndex(el);
		if (zIndex > highestZIndex) {
			highestZIndex = zIndex;
			highestZIndexElement = el;
		}
	});

	return highestZIndexElement == null ? null : {
		el: highestZIndexElement,
		zIndex: highestZIndex,
	};
}

function releaseFocusTrap(el: HTMLElement): void {
	focusTrapElements.delete(el);
	if (el.inert === true) {
		el.inert = false;
	}

	const highestZIndexElement = getHighestZIndexElement();

	if (el.parentElement != null && el !== document.body) {
		el.parentElement.childNodes.forEach((siblingNode) => {
			const siblingEl = getHTMLElementOrNull(siblingNode);
			if (!siblingEl) return;
			if (
				siblingEl !== el &&
				(
					highestZIndexElement == null ||
					siblingEl === highestZIndexElement.el ||
					siblingEl.contains(highestZIndexElement.el)
				)
			) {
				siblingEl.inert = false;
			} else if (
				highestZIndexElement != null &&
				siblingEl !== highestZIndexElement.el &&
				!siblingEl.contains(highestZIndexElement.el) &&
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
	const highestZIndexElement = getHighestZIndexElement();

	const highestZIndex = highestZIndexElement == null ? -Infinity : highestZIndexElement.zIndex;
	const zIndex = getZIndex(el);

	// If the element has a lower z-index than the highest z-index element, focus trap the highest z-index element instead
	// Focus trapping for this element will be done in the release function
	if (!parent && zIndex < highestZIndex) {
		focusTrapElements.add(el);
		if (highestZIndexElement) {
			focusTrap(highestZIndexElement.el, hasInteractionWithOtherFocusTrappedEls);
		}
		return {
			release: () => {
				releaseFocusTrap(el);
			},
		};
	}

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
