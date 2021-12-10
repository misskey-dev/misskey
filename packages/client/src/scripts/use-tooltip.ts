import { Ref, ref, watch } from 'vue';

export function useTooltip(
	elRef: Ref<HTMLElement | { $el: HTMLElement } | null | undefined>,
	onShow: (showing: Ref<boolean>) => void,
): void {
	let isHovering = false;

	// iOS(Androidも？)では、要素をタップした直後に(おせっかいで)mouseoverイベントを発火させたりするため、それを無視するためのフラグ
	// 無視しないと、画面に触れてないのにツールチップが出たりし、ユーザビリティが損なわれる
	// TODO: 一度でもタップすると二度とマウスでツールチップ出せなくなるのをどうにかする 定期的にfalseに戻すとか...？
	let shouldIgnoreMouseover = false;

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
		if (shouldIgnoreMouseover) return;
		isHovering = true;
		timeoutId = window.setTimeout(open, 300);
	};

	const onMouseleave = () => {
		if (!isHovering) return;
		isHovering = false;
		window.clearTimeout(timeoutId);
		close();
	};

	const onTouchstart = () => {
		shouldIgnoreMouseover = true;
		if (isHovering) return;
		isHovering = true;
		timeoutId = window.setTimeout(open, 300);
	};

	const onTouchend = () => {
		if (!isHovering) return;
		isHovering = false;
		window.clearTimeout(timeoutId);
		close();
	};

	const stop = watch(elRef, () => {
		if (elRef.value) {
			stop();
			const el = elRef.value instanceof Element ? elRef.value : elRef.value.$el;
			el.addEventListener('mouseover', onMouseover, { passive: true });
			el.addEventListener('mouseleave', onMouseleave, { passive: true });
			el.addEventListener('touchstart', onTouchstart, { passive: true });
			el.addEventListener('touchend', onTouchend, { passive: true });
		}
	}, {
		immediate: true,
		flush: 'post',
	});
}
