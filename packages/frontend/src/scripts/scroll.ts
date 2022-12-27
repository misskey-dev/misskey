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

export function getScrollPosition(el: Element | null): number {
	const container = getScrollContainer(el);
	return container == null ? window.scrollY : container.scrollTop;
}

export function isTopVisible(el: Element | null): boolean {
	const scrollTop = getScrollPosition(el);
	const topPosition = el.offsetTop; // TODO: container内でのelの相対位置を取得できればより正確になる

	return scrollTop <= topPosition;
}

export function isBottomVisible(el: HTMLElement, tolerance = 1, container = getScrollContainer(el)) {
	if (container) return el.scrollHeight <= container.clientHeight + Math.abs(container.scrollTop) + tolerance;
	return el.scrollHeight <= window.innerHeight + window.scrollY + tolerance;
}

export function onScrollTop(el: Element, cb) {
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

export function onScrollBottom(el: Element, cb) {
	const container = getScrollContainer(el) || window;
	const onScroll = ev => {
		if (!document.body.contains(el)) return;
		const pos = getScrollPosition(el);
		if (pos + el.clientHeight > el.scrollHeight - 1) {
			cb();
			container.removeEventListener('scroll', onScroll);
		}
	};
	container.addEventListener('scroll', onScroll, { passive: true });
}

export function scroll(el: Element, options: {
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

export function scrollToTop(el: Element, options: { behavior?: ScrollBehavior; } = {}) {
	scroll(el, { top: 0, ...options });
}

export function scrollToBottom(el: Element, options: { behavior?: ScrollBehavior; } = {}) {
	scroll(el, { top: 99999, ...options }); // TODO: ちゃんと計算する
}

export function isBottom(el: Element, asobi = 0) {
	const container = getScrollContainer(el);
	const current = container
		? el.scrollTop + el.offsetHeight
		: window.scrollY + window.innerHeight;
	const max = container
		? el.scrollHeight
		: document.body.offsetHeight;
	return current >= (max - asobi);
}
