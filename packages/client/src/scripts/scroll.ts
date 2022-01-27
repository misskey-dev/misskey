type ScrollBehavior = 'auto' | 'smooth' | 'instant';

export function getScrollContainer(el: HTMLElement | null): HTMLElement | null {
	if (el == null) return null;
	if (el.scrollHeight > el.clientHeight) {
		return el;
	} else {
		return getScrollContainer(el.parentElement);
	}
}

export function getScrollPosition(el: HTMLElement | null): number {
	const container = getScrollContainer(el);
	return container == null ? window.scrollY : container.scrollTop;
}

export function isTopVisible(el: HTMLElement | null): boolean {
	const scrollTop = getScrollPosition(el);
	const topPosition = el.offsetTop; // TODO: container内でのelの相対位置を取得できればより正確になる

	return scrollTop <= topPosition;
}

export function onScrollTop(el: HTMLElement, cb) {
	const container = getScrollContainer(el) || window;
	const onScroll = ev => {
		if (!document.body.contains(el)) return;
		if (isTopVisible(el)) {
			cb();
			container.removeEventListener('scroll', onScroll);
		}
	};
	container.addEventListener('scroll', onScroll, { passive: true });
}

export function onScrollBottom(el: HTMLElement, cb) {
	const container = getScrollContainer(el);
	const containerOrWindow = container || window;
	const onScroll = ev => {
		if (!document.body.contains(el)) return;
		if (isScrollBottom(container)) {
			cb();
			containerOrWindow.removeEventListener('scroll', onScroll);
		}
	};
	containerOrWindow.addEventListener('scroll', onScroll, { passive: true });
}

export function scroll(el: HTMLElement, options: {
	top?: number;
	left?: number;
	behavior?: ScrollBehavior;
}) {
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
 * @param el Scroll container element
 * @param options Scroll options
 */
export function scrollToBottom(el: HTMLElement, options: { behavior?: ScrollBehavior; } = {}) {
	scroll(el, { top: el.scrollHeight, ...options }); // TODO: ちゃんと計算する
}

// https://developer.mozilla.org/en-US/docs/Web/API/Element/scrollHeight#determine_if_an_element_has_been_totally_scrolled
export function isBottom(el: HTMLElement, asobi = 1) {
	const container = getScrollContainer(el);
	return isScrollBottom(container, asobi);
}

// https://ja.javascript.info/size-and-scroll-window#ref-932
export function getBodyScrollHeight() {
	return Math.max(
		document.body.scrollHeight, document.documentElement.scrollHeight,
		document.body.offsetHeight, document.documentElement.offsetHeight,
		document.body.clientHeight, document.documentElement.clientHeight
	);
}

export function isScrollBottom(container?: HTMLElement | null, asobi = 1) {
	if (container) return container.scrollHeight - Math.abs(container.scrollTop) <= container.clientHeight + asobi;
	return getBodyScrollHeight() - window.scrollY <= window.innerHeight + asobi;
}
