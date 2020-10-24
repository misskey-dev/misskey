import { Directive } from 'vue';

//const observers = new Map<Element, ResizeObserver>();

export default {
	mounted(src, binding, vn) {
		const query = binding.value;

		const addClass = (el: Element, cls: string) => {
			el.classList.add(cls);
		};

		const removeClass = (el: Element, cls: string) => {
			el.classList.remove(cls);
		};

		const calc = () => {
			const width = src.clientWidth;

			// 要素が(一時的に)DOMに存在しないときは計算スキップ
			if (width === 0) return;

			if (query.max) {
				for (const v of query.max) {
					if (width <= v) {
						addClass(src, 'max-width_' + v + 'px');
					} else {
						removeClass(src, 'max-width_' + v + 'px');
					}
				}
			}
			if (query.min) {
				for (const v of query.min) {
					if (width >= v) {
						addClass(src, 'min-width_' + v + 'px');
					} else {
						removeClass(src, 'min-width_' + v + 'px');
					}
				}
			}
		};

		calc();

		window.addEventListener('resize', calc);

		// Vue3では使えなくなった
		// 無くても大丈夫か...？
		// TODO: ↑大丈夫じゃなかったので解決策を探す
		//vn.context.$on('hook:activated', calc);

		//const ro = new ResizeObserver((entries, observer) => {
		//	calc();
		//});

		//ro.observe(el);

		// TODO: 新たにプロパティを作るのをやめMapを使う
		// ただメモリ的には↓の方が省メモリかもしれないので検討中
		//el._ro_ = ro;
		src._calc_ = calc;
	},

	unmounted(src, binding, vn) {
		//el._ro_.unobserve(el);
		window.removeEventListener('resize', src._calc_);
	}
} as Directive;
