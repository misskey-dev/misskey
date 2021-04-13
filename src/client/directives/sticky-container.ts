import { Directive } from 'vue';

export default {
	mounted(src, binding, vn) {
		//const query = binding.value;

		const header = src.children[0];
		const currentStickyTop = getComputedStyle(src).getPropertyValue('--stickyTop');
		src.style.setProperty('--stickyTop', `${parseInt(currentStickyTop) + header.offsetHeight}px`);
		header.style.setProperty('--stickyTop', currentStickyTop);
		header.style.position = 'sticky';
		header.style.top = 'var(--stickyTop)';
		header.style.zIndex = '1';
	},
} as Directive;
