export default {
	inserted(src, binding, vn) {
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

		vn.context.$on('hook:activated', calc);

		const ro = new ResizeObserver((entries, observer) => {
			calc();
		});

		ro.observe(el);

		el._ro_ = ro;
	},

	unbind(src, binding, vn) {
		const query = binding.value;

		const el = query.el ? query.el() : src;

		el._ro_.unobserve(el);
	}
};
