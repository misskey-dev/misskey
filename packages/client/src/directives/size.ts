import { Directive } from 'vue';

type Value = { max?: number[]; min?: number[]; };

const addClass = (el: Element, cls: string) => {
	el.classList.add(cls);
};

const removeClass = (el: Element, cls: string) => {
	el.classList.remove(cls);
};

//const observers = new Map<Element, ResizeObserver>();
const mountings = new Map<Element, {
	value: Value;
	resize: ResizeObserver;
	intersection: IntersectionObserver;
	previousWidth: number;
}>();

function calc(el: Element) {
	const info = mountings.get(el);
	const width = el.clientWidth;

	if (!info || !width || info.previousWidth === width) return;

	mountings.set(el, Object.assign(info, { previousWidth: width }));

	if (info.value.max) {
		for (const v of info.value.max) {
			if (width <= v) {
				addClass(el, 'max-width_' + v + 'px');
			} else {
				removeClass(el, 'max-width_' + v + 'px');
			}
		}
	}
	if (info.value.min) {
		for (const v of info.value.min) {
			if (width >= v) {
				addClass(el, 'min-width_' + v + 'px');
			} else {
				removeClass(el, 'min-width_' + v + 'px');
			}
		}
	}
}

export default {
	mounted(src, binding, vn) {
		const resize = new ResizeObserver((entries, observer) => {
			calc(src);
		});

		// アクティベート前などでsrcが描画されていない場合があるので、
		// IntersectionObserverで表示検出する
		const intersection = new IntersectionObserver(entries => {
			if (entries.some(entry => entry.isIntersecting)) calc(src);
		});

		mountings.set(src, {
			value: binding.value,
			resize,
			intersection,
			previousWidth: 0,
		});

		calc(src);
		resize.observe(src);
		intersection.observe(src);
	},

	updated(src, binding, vn) {
		mountings.set(src, Object.assign({}, mountings.get(src), { value: binding.value }));
	},

	unmounted(src, binding, vn) {
		const info = mountings.get(src);
		if (!info) return;
		info.resize.observe(src);
		info.intersection.observe(src);
		mountings.delete(src);
	}
} as Directive<Element, Value>;
