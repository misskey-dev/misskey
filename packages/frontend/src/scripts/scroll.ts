/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

type ScrollBehavior = 'auto' | 'smooth' | 'instant';

export function getScrollContainer(el: HTMLElement | null): HTMLElement | null {
	if (el == null || el.tagName === 'HTML') return null;
	const overflow = window.getComputedStyle(el).getPropertyValue('overflow-y');
	if (overflow === 'scroll' || overflow === 'auto') {
		return el;
	} else {
		return getScrollContainer(el.parentElement);
	}
}

export function getStickyTop(el: HTMLElement, container: HTMLElement | null = null, top = 0) {
	if (!el.parentElement) return top;
	const data = el.dataset.stickyContainerHeaderHeight;
	const newTop = data ? Number(data) + top : top;
	if (el === container) return newTop;
	return getStickyTop(el.parentElement, container, newTop);
}

export function getScrollPosition(el: HTMLElement | null): number {
	const container = getScrollContainer(el);
	return container == null ? window.scrollY : container.scrollTop;
}

export function onScrollTop(el: HTMLElement, cb: () => unknown, tolerance = 1, once = false) {
	// とりあえず評価してみる
	if (el.isConnected && isTopVisible(el)) {
		cb();
		if (once) return null;
	}

	const container = getScrollContainer(el) ?? window;

	const onScroll = ev => {
		if (!document.body.contains(el)) return;
		if (isTopVisible(el, tolerance)) {
			cb();
			if (once) removeListener();
		}
	};

	function removeListener() { container.removeEventListener('scroll', onScroll); }

	container.addEventListener('scroll', onScroll, { passive: true });
	return removeListener;
}

export function onScrollBottom(el: HTMLElement, cb: () => unknown, tolerance = 1, once = false) {
	const container = getScrollContainer(el);

	// とりあえず評価してみる
	if (el.isConnected && isBottomVisible(el, tolerance, container)) {
		cb();
		if (once) return null;
	}

	const containerOrWindow = container ?? window;
	const onScroll = ev => {
		if (!document.body.contains(el)) return;
		if (isBottomVisible(el, 1, container)) {
			cb();
			if (once) removeListener();
		}
	};

	function removeListener() {
		containerOrWindow.removeEventListener('scroll', onScroll);
	}

	containerOrWindow.addEventListener('scroll', onScroll, { passive: true });
	return removeListener;
}

export function scroll(el: HTMLElement, options: ScrollToOptions | undefined) {
	const container = getScrollContainer(el);
	if (container == null) {
		window.scroll(options);
	} else {
		container.scroll(options);
	}
}

/**
 * Scroll to Top
 * @param el Scroll container element
 * @param options Scroll options
 */
export function scrollToTop(el: HTMLElement, options: { behavior?: ScrollBehavior; } = {}) {
	scroll(el, { top: 0, ...options });
}

/**
 * Scroll to Bottom
 * @param el Content element
 * @param options Scroll options
 * @param container Scroll container element
 */
export function scrollToBottom(
	el: HTMLElement,
	options: ScrollToOptions = {},
	container = getScrollContainer(el),
) {
	if (container) {
		container.scroll({ top: el.scrollHeight - container.clientHeight + getStickyTop(el, container) || 0, ...options });
	} else {
		window.scroll({
			top: (el.scrollHeight - window.innerHeight + getStickyTop(el, container) + (window.innerWidth <= 500 ? 96 : 0)) || 0,
			...options,
		});
	}
}

export function isTopVisible(el: HTMLElement, tolerance = 1): boolean {
	const scrollTop = getScrollPosition(el);
	return scrollTop <= tolerance;
}

export function isBottomVisible(el: HTMLElement, tolerance = 1, container = getScrollContainer(el)) {
	if (container) return el.scrollHeight <= container.clientHeight + Math.abs(container.scrollTop) + tolerance;
	return el.scrollHeight <= window.innerHeight + window.scrollY + tolerance;
}

// https://ja.javascript.info/size-and-scroll-window#ref-932
export function getBodyScrollHeight() {
	return Math.max(
		document.body.scrollHeight, document.documentElement.scrollHeight,
		document.body.offsetHeight, document.documentElement.offsetHeight,
		document.body.clientHeight, document.documentElement.clientHeight,
	);
}
