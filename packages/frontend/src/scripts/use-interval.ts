import { onMounted, onUnmounted } from 'vue';

export function useInterval(fn: () => void, interval: number, options: {
	immediate: boolean;
	afterMounted: boolean;
}): (() => void) | undefined {
	if (Number.isNaN(interval)) return;

	let intervalId: number | null = null;

	if (options.afterMounted) {
		onMounted(() => {
			if (options.immediate) fn();
			intervalId = window.setInterval(fn, interval);
		});
	} else {
		if (options.immediate) fn();
		intervalId = window.setInterval(fn, interval);
	}

	const clear = () => {
		if (intervalId) window.clearInterval(intervalId);
		intervalId = null;
	};

	onUnmounted(() => {
		clear();
	});

	return clear;
}
