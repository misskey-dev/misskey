import { Ref, ref } from 'vue';

export function useTooltip(onShow: (showing: Ref<boolean>) => void) {
	let isHovering = false;
	let timeoutId: number;

	let changeShowingState: (() => void) | null;

	const open = () => {
		close();
		if (!isHovering) return;

		const showing = ref(true);
		onShow(showing);
		changeShowingState = () => {
			showing.value = false;
		};
	};

	const close = () => {
		if (changeShowingState != null) {
			changeShowingState();
			changeShowingState = null;
		}
	};

	const onMouseover = () => {
		if (isHovering) return;
		isHovering = true;
		timeoutId = window.setTimeout(open, 300);
	};

	const onMouseleave = () => {
		if (!isHovering) return;
		isHovering = false;
		window.clearTimeout(timeoutId);
		close();
	};

	return {
		onMouseover,
		onMouseleave,
	};
}
