import { Directive } from 'vue';

const mountings = new Map<Element, {
	resize: ResizeObserver;
	intersection: IntersectionObserver;
}>();

export default {
	mounted(src, binding, vn) {
		const calc = () => {
			const height = src.clientHeight;
			const width = src.clientWidth;

			// 要素が(一時的に)DOMに存在しないときは計算スキップ
			if (height === 0) return;

			binding.value(width, height);
		};

		calc();

		const resize = new ResizeObserver((entries, observer) => {
			calc();
		});
		resize.observe(src);

		// アクティベート前などでsrcが描画されていない場合があるので、
		// IntersectionObserverで表示検出する
		const intersection = new IntersectionObserver(entries => {
			if (entries.some(entry => entry.isIntersecting)) calc();
		});
		intersection.observe(src);

		mountings.set(src, { resize, intersection, });
	},

	unmounted(src, binding, vn) {
		binding.value(0, 0);
		const info = mountings.get(src);
		if (!info) return;
		info.resize.disconnect();
		info.intersection.disconnect();
		mountings.delete(src);
	}
} as Directive<Element, (w: number, h: number) => void>;
