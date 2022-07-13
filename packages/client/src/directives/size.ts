import { Directive } from 'vue';

type Value = { max?: number[]; min?: number[]; };

//const observers = new Map<Element, ResizeObserver>();
const mountings = new Map<Element, {
	value: Value;
	resize: ResizeObserver;
	intersection?: IntersectionObserver;
	previousWidth: number;
}>();

type ClassOrder = {
	add: string[];
	remove: string[];
};

const cache = new Map<string, ClassOrder>();

function getClassOrder(width: number, queue: Value): ClassOrder {
	const getMaxClass = (v: number) => `max-width_${v}px`;
	const getMinClass = (v: number) => `min-width_${v}px`;

	return {
		add: [
			...(queue.max ? queue.max.filter(v => width <= v).map(getMaxClass) : []),
			...(queue.min ? queue.min.filter(v => width >= v).map(getMinClass) : []),
		],
		remove: [
			...(queue.max ? queue.max.filter(v => width > v).map(getMaxClass) : []),
			...(queue.min ? queue.min.filter(v => width < v).map(getMinClass) : []),
		]
	};
}

function applyClassOrder(el: Element, order: ClassOrder) {
	el.classList.add(...order.add);
	el.classList.remove(...order.remove);
}

function getOrderName(width: number, queue: Value): string {
	return `${width}|${queue.max ? queue.max.join(',') : ''}|${queue.min ? queue.min.join(',') : ''}`;
}

function calc(el: Element) {
	const info = mountings.get(el);
	const width = el.clientWidth;

	if (!info || info.previousWidth === width) return;

	// アクティベート前などでsrcが描画されていない場合
	if (!width) {
		// IntersectionObserverで表示検出する
		if (!info.intersection) {
			info.intersection = new IntersectionObserver(entries => {
				if (entries.some(entry => entry.isIntersecting)) calc(el);
			});
		}
		info.intersection.observe(el);
		return;
	}
	if (info.intersection) {
		info.intersection.disconnect();
		delete info.intersection;
	}

	mountings.set(el, Object.assign(info, { previousWidth: width }));

	const cached = cache.get(getOrderName(width, info.value));
	if (cached) {
		applyClassOrder(el, cached);
	} else {
		const order = getClassOrder(width, info.value);
		cache.set(getOrderName(width, info.value), order);
		applyClassOrder(el, order);
	}
}

export default {
	mounted(src, binding, vn) {
		const resize = new ResizeObserver((entries, observer) => {
			calc(src);
		});

		mountings.set(src, {
			value: binding.value,
			resize,
			previousWidth: 0,
		});

		calc(src);
		resize.observe(src);
	},

	updated(src, binding, vn) {
		mountings.set(src, Object.assign({}, mountings.get(src), { value: binding.value }));
		calc(src);
	},

	unmounted(src, binding, vn) {
		const info = mountings.get(src);
		if (!info) return;
		info.resize.disconnect();
		if (info.intersection) info.intersection.disconnect();
		mountings.delete(src);
	}
} as Directive<Element, Value>;
