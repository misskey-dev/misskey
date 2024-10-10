/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { getScrollPosition, getScrollContainer, getStickyBottom, getStickyTop } from '@@/js/scroll.js';
import { getElementOrNull, getNodeOrNull } from '@/scripts/get-dom-node-or-null.js';

type MaybeHTMLElement = EventTarget | Node | Element | HTMLElement;

export const isFocusable = (input: MaybeHTMLElement | null | undefined): input is HTMLElement => {
	if (input == null || !(input instanceof HTMLElement)) return false;

	if (input.tabIndex < 0) return false;
	if ('disabled' in input && input.disabled === true) return false;
	if ('readonly' in input && input.readonly === true) return false;

	if (!input.ownerDocument.contains(input)) return false;

	const style = window.getComputedStyle(input);
	if (style.display === 'none') return false;
	if (style.visibility === 'hidden') return false;
	if (style.opacity === '0') return false;
	if (style.pointerEvents === 'none') return false;

	return true;
};

export const focusPrev = (input: MaybeHTMLElement | null | undefined, self = false, scroll = true) => {
	const element = self ? input : getElementOrNull(input)?.previousElementSibling;
	if (element == null) return;
	if (isFocusable(element)) {
		focusOrScroll(element, scroll);
	} else {
		focusPrev(element, false, scroll);
	}
};

export const focusNext = (input: MaybeHTMLElement | null | undefined, self = false, scroll = true) => {
	const element = self ? input : getElementOrNull(input)?.nextElementSibling;
	if (element == null) return;
	if (isFocusable(element)) {
		focusOrScroll(element, scroll);
	} else {
		focusNext(element, false, scroll);
	}
};

export const focusParent = (input: MaybeHTMLElement | null | undefined, self = false, scroll = true) => {
	const element = self ? input : getNodeOrNull(input)?.parentElement;
	if (element == null) return;
	if (isFocusable(element)) {
		focusOrScroll(element, scroll);
	} else {
		focusParent(element, false, scroll);
	}
};

const focusOrScroll = (element: HTMLElement, scroll: boolean) => {
	if (scroll) {
		const scrollContainer = getScrollContainer(element) ?? document.documentElement;
		const scrollContainerTop = getScrollPosition(scrollContainer);
		const stickyTop = getStickyTop(element, scrollContainer);
		const stickyBottom = getStickyBottom(element, scrollContainer);
		const top = element.getBoundingClientRect().top;
		const bottom = element.getBoundingClientRect().bottom;

		let scrollTo = scrollContainerTop;
		if (top < stickyTop) {
			scrollTo += top - stickyTop;
		} else if (bottom > window.innerHeight - stickyBottom) {
			scrollTo += bottom - window.innerHeight + stickyBottom;
		}
		scrollContainer.scrollTo({ top: scrollTo, behavior: 'instant' });
	}

	if (document.activeElement !== element) {
		element.focus({ preventScroll: true });
	}
};
