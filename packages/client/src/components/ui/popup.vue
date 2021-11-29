<template>
<transition :name="$store.state.animation ? 'popup-menu' : ''" appear @after-leave="$emit('closed')" @enter="$emit('opening')">
	<div v-show="manualShowing != null ? manualShowing : showing" ref="content" class="ccczpooj" :class="{ front, fixed, top: position === 'top' }" :style="{ pointerEvents: (manualShowing != null ? manualShowing : showing) ? 'auto' : 'none', '--transformOrigin': transformOrigin }">
		<slot :max-height="maxHeight" :close="close"></slot>
	</div>
</transition>
</template>

<script lang="ts">
import { defineComponent, nextTick, onMounted, onUnmounted, PropType, ref, watch } from 'vue';

function getFixedContainer(el: Element | null | undefined): Element | null {
	if (el == null || el.tagName === 'BODY') return null;
	const position = window.getComputedStyle(el).getPropertyValue('position');
	if (position === 'fixed') {
		return el;
	} else {
		return getFixedContainer(el.parentElement);
	}
}

export default defineComponent({
	props: {
		manualShowing: {
			type: Boolean,
			required: false,
			default: null,
		},
		srcCenter: {
			type: Boolean,
			required: false
		},
		src: {
			type: Object as PropType<HTMLElement>,
			required: false,
		},
		position: {
			required: false
		},
		front: {
			type: Boolean,
			required: false,
			default: false,
		},
		noOverlap: {
			type: Boolean,
			required: false,
			default: true,
		},
	},

	emits: ['opening', 'click', 'esc', 'close', 'closed'],

	setup(props, context) {
		const maxHeight = ref<number>();
		const fixed = ref(false);
		const transformOrigin = ref('center');
		const showing = ref(true);
		const content = ref<HTMLElement>();

		const close = () => {
			// eslint-disable-next-line vue/no-mutating-props
			if (props.src) props.src.style.pointerEvents = 'auto';
			showing.value = false;
			context.emit('close');
		};

		const MARGIN = 16;

		const align = () => {
			if (props.src == null) return;

			const popover = content.value!;

			if (popover == null) return;

			const rect = props.src.getBoundingClientRect();
			
			const width = popover.offsetWidth;
			const height = popover.offsetHeight;

			let left;
			let top;

			if (props.srcCenter) {
				const x = rect.left + (fixed.value ? 0 : window.pageXOffset) + (props.src.offsetWidth / 2);
				const y = rect.top + (fixed.value ? 0 : window.pageYOffset) + (props.src.offsetHeight / 2);
				left = (x - (width / 2));
				top = (y - (height / 2));
			} else {
				const x = rect.left + (fixed.value ? 0 : window.pageXOffset) + (props.src.offsetWidth / 2);
				const y = rect.top + (fixed.value ? 0 : window.pageYOffset) + props.src.offsetHeight;
				left = (x - (width / 2));
				top = y;
			}

			if (fixed.value) {
				// 画面から横にはみ出る場合
				if (left + width > window.innerWidth) {
					left = window.innerWidth - width;
				}

				// 画面から縦にはみ出る場合
				if (top + height > (window.innerHeight - MARGIN)) {
					if (props.noOverlap) {
						const underSpace = (window.innerHeight - MARGIN) - top;
						const upperSpace = (rect.top - MARGIN);
						if (underSpace >= (upperSpace / 3)) {
							maxHeight.value =  underSpace;
						} else {
							maxHeight.value =  upperSpace;
							top = (upperSpace + MARGIN) - height;
						}
					} else {
						top = (window.innerHeight - MARGIN) - height;
					}
				}
			} else {
				// 画面から横にはみ出る場合
				if (left + width - window.pageXOffset > window.innerWidth) {
					left = window.innerWidth - width + window.pageXOffset - 1;
				}

				// 画面から縦にはみ出る場合
				if (top + height - window.pageYOffset > (window.innerHeight - MARGIN)) {
					if (props.noOverlap) {
						const underSpace = (window.innerHeight - MARGIN) - (top - window.pageYOffset);
						const upperSpace = (rect.top - MARGIN);
						if (underSpace >= (upperSpace / 3)) {
							maxHeight.value =  underSpace;
						} else {
							maxHeight.value =  upperSpace;
							top = window.pageYOffset + ((upperSpace + MARGIN) - height);
						}
					} else {
						top = (window.innerHeight - MARGIN) - height + window.pageYOffset - 1;
					}
				}
			}

			if (top < 0) {
				top = MARGIN;
			}

			if (left < 0) {
				left = 0;
			}

			if (top > rect.top + (fixed.value ? 0 : window.pageYOffset)) {
				transformOrigin.value = 'center top';
			} else if ((top + height) <= rect.top + (fixed.value ? 0 : window.pageYOffset)) {
				transformOrigin.value = 'center bottom';
			} else {
				transformOrigin.value = 'center';
			}

			popover.style.left = left + 'px';
			popover.style.top = top + 'px';
		};

		const onDocumentClick = (ev: MouseEvent) => {
			const flyoutElement = content.value;
			let targetElement = ev.target;
			do {
				if (targetElement === flyoutElement) {
					return;
				}
				targetElement = targetElement.parentNode;
			} while (targetElement);
			close();
		};

		onMounted(() => {
			watch(() => props.src, async () => {
				if (props.src) {
					// eslint-disable-next-line vue/no-mutating-props
					props.src.style.pointerEvents = 'none';
				}
				fixed.value = getFixedContainer(props.src) != null;

				await nextTick()
				
				align();
			}, { immediate: true, });

			nextTick(() => {
				const popover = content.value;
				new ResizeObserver((entries, observer) => {
					align();
				}).observe(popover!);
			});

			document.addEventListener('mousedown', onDocumentClick, { passive: true });

			onUnmounted(() => {
				document.removeEventListener('mousedown', onDocumentClick);
			});
		});

		return {
			showing,
			fixed,
			content,
			transformOrigin,
			maxHeight,
			close,
		};
	},
});
</script>

<style lang="scss" scoped>
.popup-menu-enter-active {
	transform-origin: var(--transformOrigin);
	transition: opacity 0.2s cubic-bezier(0, 0, 0.2, 1), transform 0.2s cubic-bezier(0, 0, 0.2, 1) !important;
}
.popup-menu-leave-active {
	transform-origin: var(--transformOrigin);
	transition: opacity 0.2s cubic-bezier(0.4, 0, 1, 1), transform 0.2s cubic-bezier(0.4, 0, 1, 1) !important;
}
.popup-menu-enter-from, .popup-menu-leave-to {
	pointer-events: none;
	opacity: 0;
	transform: scale(0.9);
}

.ccczpooj {
	position: absolute;
	z-index: 10000;

	&.fixed {
		position: fixed;
	}

	&.front {
		z-index: 20000;
	}
}
</style>
