export function getScrollContainer(el: Element | null): Element | null {
	if (el == null || el.tagName === 'BODY') return null;
	const style = window.getComputedStyle(el);
	if (style.getPropertyValue('overflow') === 'auto') {
		return el;
	} else {
		return getScrollContainer(el.parentElement);
	}
}

export function getScrollPosition(el: Element | null): number {
	const container = getScrollContainer(el);
	return container == null ? window.scrollY : container.scrollTop;
}

export function onScrollTop(el: Element, cb) {
	const container = getScrollContainer(el) || window;
	const onScroll = ev => {
		if (!document.body.contains(el)) return;
		const pos = getScrollPosition(el);
		if (pos === 0) {
			cb();
			container.removeEventListener('scroll', onscroll);
		}
	};
	container.addEventListener('scroll', onScroll, { passive: true });
}
