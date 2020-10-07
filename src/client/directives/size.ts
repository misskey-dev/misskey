import { Directive } from 'vue';

//const observers = new Map<Element, ResizeObserver>();

export default {
	mounted(src, binding, vn) {
		const query = binding.value;

		// TODO: 要素をもらうというよりはカスタム幅算出関数をもらうようにしてcalcで都度呼び出して計算するようにした方が柔軟そう
		// その場合はunbindの方も改修することを忘れずに
		const el = query.el ? query.el() : src;

		const addClass = (el: Element, cls: string) => {
			el.classList.add(cls);
		};

		const removeClass = (el: Element, cls: string) => {
			el.classList.remove(cls);
		};

		const calc = () => {
			const width = el.clientWidth;

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
		//vn.context.$on('hook:activated', calc);

		//const ro = new ResizeObserver((entries, observer) => {
		//	calc();
		//});

		//ro.observe(el);

		// TODO: 新たにプロパティを作るのをやめMapを使う
		// ただメモリ的には↓の方が省メモリかもしれないので検討中
		//el._ro_ = ro;
		el._calc_ = calc;
	},

	unmounted(src, binding, vn) {
		const query = binding.value;

		const el = query.el ? query.el() : src;

		//el._ro_.unobserve(el);
		window.removeEventListener('resize', el._calc_);
	}
} as Directive;
