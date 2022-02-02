export function getScrollContainer(el: HTMLElement | null): HTMLElement | null {
	if (el == null || el.tagName === 'HTML') return null;
	const overflow = window.getComputedStyle(el).getPropertyValue('overflow');
	if (
		// xとyを個別に指定している場合、`hidden scroll`みたいな値になる
		overflow.endsWith('scroll') ||
		overflow.endsWith('auto')
	) {
		return el;
	} else {
		return getScrollContainer(el.parentElement);
	}
}

export function getScrollPosition(el: HTMLElement | null): number {
	const container = getScrollContainer(el);
	return container == null ? window.scrollY : container.scrollTop;
}

export function isTopVisible(el: HTMLElement): boolean {
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
			removeListener();
		}
	};
	function removeListener() { container.removeEventListener('scroll', onScroll) }
	container.addEventListener('scroll', onScroll, { passive: true });
	return removeListener;
}

export function onScrollBottom(el: HTMLElement, cb) {
	const container = getScrollContainer(el);
	const containerOrWindow = container || window;
	const onScroll = ev => {
		if (!document.body.contains(el)) return;
		if (isBottom(el, 1, container)) {
			cb();
			removeListener();
		}
	};
	function removeListener() { containerOrWindow.removeEventListener('scroll', onScroll) }
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
export function scrollToBottom(el: HTMLElement, options: ScrollToOptions = {}, container = getScrollContainer(el)) {
	if (container) {
		container.scroll({ top: el.scrollHeight - container.clientHeight || 0, ...options });
	} else {
		window.scroll({ top: el.scrollHeight - window.innerHeight || 0, ...options });
	}
}

export function isBottom(el: HTMLElement, asobi = 1, container = getScrollContainer(el)) {
	if (container) return el.scrollHeight <= container.clientHeight + Math.abs(container.scrollTop) + asobi;
	return el.scrollHeight <= window.innerHeight + window.scrollY + asobi;
}
