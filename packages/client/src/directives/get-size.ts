import { Directive } from 'vue';

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

		// Vue3では使えなくなった
		// 無くても大丈夫か...？
		// TODO: ↑大丈夫じゃなかったので解決策を探す
		//vn.context.$on('hook:activated', calc);

		const ro = new ResizeObserver((entries, observer) => {
			calc();
		});
		ro.observe(src);

		src._get_size_ro_ = ro;
	},

	unmounted(src, binding, vn) {
		binding.value(0, 0);
		src._get_size_ro_.unobserve(src);
	}
} as Directive;
