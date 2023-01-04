import { onMounted, onUnmounted } from 'vue';

export function useInterval(fn: () => void, interval: number, options: {
	immediate: boolean;
	afterMounted: boolean;
}): number | null {
	if (Number.isNaN(interval)) return null;

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

	onUnmounted(() => {
		if (intervalId) window.clearInterval(intervalId);
	});

	return intervalId;
}
