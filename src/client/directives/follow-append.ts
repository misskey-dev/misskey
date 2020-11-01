import { Directive } from 'vue';
import { getScrollContainer, getScrollPosition } from '@/scripts/scroll';

export default {
	mounted(src, binding, vn) {
		const ro = new ResizeObserver((entries, observer) => {
			const pos = getScrollPosition(src);
			const container = getScrollContainer(src);
			const viewHeight = container.clientHeight;
			const height = container.scrollHeight;
			if (pos + viewHeight > height - 32) {
				container.scrollTop = height;
			}
		});

		ro.observe(src);

		// TODO: 新たにプロパティを作るのをやめMapを使う
		src._ro_ = ro;
	},

	unmounted(src, binding, vn) {
		src._ro_.unobserve(src);
	}
} as Directive;
