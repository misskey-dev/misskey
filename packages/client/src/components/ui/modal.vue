<template>
<transition :name="$store.state.animation ? (type === 'drawer') ? 'modal-drawer' : (type === 'popup') ? 'modal-popup' : 'modal' : ''" :duration="$store.state.animation ? 200 : 0" appear @after-leave="$emit('closed')" @enter="$emit('opening')" @after-enter="childRendered">
	<div v-show="manualShowing != null ? manualShowing : showing" v-hotkey.global="keymap" class="qzhlnise" :class="{ drawer: type === 'drawer', dialog: type === 'dialog' || type === 'dialog:top', popup: type === 'popup' }" :style="{ zIndex, pointerEvents: (manualShowing != null ? manualShowing : showing) ? 'auto' : 'none', '--transformOrigin': transformOrigin }">
		<div class="bg _modalBg" :class="{ transparent: transparentBg && (type === 'popup') }" :style="{ zIndex }" @click="onBgClick" @contextmenu.prevent.stop="() => {}"></div>
		<div ref="content" class="content" :class="{ fixed, top: type === 'dialog:top' }" :style="{ zIndex }" @click.self="onBgClick">
			<slot :max-height="maxHeight" :type="type"></slot>
		</div>
	</div>
</transition>
</template>

<script lang="ts">
import { defineComponent, nextTick, onMounted, computed, PropType, ref, watch } from 'vue';
import * as os from '@/os';
import { isTouchUsing } from '@/scripts/touch';

function getFixedContainer(el: Element | null): Element | null {
	if (el == null || el.tagName === 'BODY') return null;
	const position = window.getComputedStyle(el).getPropertyValue('position');
	if (position === 'fixed') {
		return el;
	} else {
		return getFixedContainer(el.parentElement);
	}
}

export default defineComponent({
	provide: {
		modal: true
	},

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
			default: null,
		},
		preferType: {
			required: false,
			type: String,
			default: 'auto',
		},
		zPriority: {
			type: String as PropType<'low' | 'middle' | 'high'>,
			required: false,
			default: 'low',
		},
		noOverlap: {
			type: Boolean,
			required: false,
			default: true,
		},
		transparentBg: {
			type: Boolean,
			required: false,
			default: false,
		},
	},

	emits: ['opening', 'click', 'esc', 'close', 'closed'],

	setup(props, context) {
		const maxHeight = ref<number>();
		const fixed = ref(false);
		const transformOrigin = ref('center');
		const showing = ref(true);
		const content = ref<HTMLElement>();
		const zIndex = os.claimZIndex(props.zPriority);
		const type = computed(() => {
			if (props.preferType === 'auto') {
				if (isTouchUsing && window.innerWidth < 500 && window.innerHeight < 1000) {
					return 'drawer';
				} else {
					return props.src != null ? 'popup' : 'dialog';
				}
			} else {
				return props.preferType;
			}
		});
		
		let contentClicking = false;

		const close = () => {
			// eslint-disable-next-line vue/no-mutating-props
			if (props.src) props.src.style.pointerEvents = 'auto';
			showing.value = false;
			context.emit('close');
		};

		const onBgClick = () => {
			if (contentClicking) return;
			context.emit('click');
		};

		if (type.value === 'drawer') {
			maxHeight.value = window.innerHeight / 2;
		}

		const keymap = {
			'esc': () => context.emit('esc'),
		};

		const MARGIN = 16;

		const align = () => {
			if (props.src == null) return;
			if (type.value === 'drawer') return;

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

		const childRendered = () => {
			// モーダルコンテンツにマウスボタンが押され、コンテンツ外でマウスボタンが離されたときにモーダルバックグラウンドクリックと判定させないためにマウスイベントを監視しフラグ管理する
			const el = content.value!.children[0];
			el.addEventListener('mousedown', e => {
				contentClicking = true;
				window.addEventListener('mouseup', e => {
					// click イベントより先に mouseup イベントが発生するかもしれないのでちょっと待つ
					setTimeout(() => {
						contentClicking = false;
					}, 100);
				}, { passive: true, once: true });
			}, { passive: true });
		};

		onMounted(() => {
			watch(() => props.src, async () => {
				if (props.src) {
					// eslint-disable-next-line vue/no-mutating-props
					props.src.style.pointerEvents = 'none';
				}
				fixed.value = (type.value === 'drawer') || (getFixedContainer(props.src) != null);

				await nextTick()
				
				align();
			}, { immediate: true, });

			nextTick(() => {
				const popover = content.value;
				new ResizeObserver((entries, observer) => {
					align();
				}).observe(popover!);
			});
		});

		return {
			showing,
			type,
			fixed,
			content,
			transformOrigin,
			maxHeight,
			close,
			zIndex,
			keymap,
			onBgClick,
			childRendered,
		};
	},
});
</script>

<style lang="scss" scoped>
.modal-enter-active, .modal-leave-active {
	> .bg {
		transition: opacity 0.2s !important;
	}

	> .content {
		transform-origin: var(--transformOrigin);
		transition: opacity 0.2s, transform 0.2s !important;
	}
}
.modal-enter-from, .modal-leave-to {
	> .bg {
		opacity: 0;
	}

	> .content {
		pointer-events: none;
		opacity: 0;
		transform-origin: var(--transformOrigin);
		transform: scale(0.9);
	}
}

.modal-popup-enter-active, .modal-popup-leave-active {
	> .bg {
		transition: opacity 0.2s !important;
	}

	> .content {
		transform-origin: var(--transformOrigin);
		transition: opacity 0.2s cubic-bezier(0, 0, 0.2, 1), transform 0.2s cubic-bezier(0, 0, 0.2, 1) !important;
	}
}
.modal-popup-enter-from, .modal-popup-leave-to {
	> .bg {
		opacity: 0;
	}

	> .content {
		pointer-events: none;
		opacity: 0;
		transform-origin: var(--transformOrigin);
		transform: scale(0.9);
	}
}

.modal-drawer-enter-active {
	> .bg {
		transition: opacity 0.2s !important;
	}

	> .content {
		transition: transform 0.2s cubic-bezier(0,.5,0,1) !important;
	}
}
.modal-drawer-leave-active {
	> .bg {
		transition: opacity 0.2s !important;
	}

	> .content {
		transition: transform 0.2s cubic-bezier(0,.5,0,1) !important;
	}
}
.modal-drawer-enter-from, .modal-drawer-leave-to {
	> .bg {
		opacity: 0;
	}

	> .content {
		pointer-events: none;
		transform: translateY(100%);
	}
}

.qzhlnise {
	> .bg {
		&.transparent {
			background: transparent;
			-webkit-backdrop-filter: none;
			backdrop-filter: none;
		}
	}

	&.dialog {
		> .content {
			position: fixed;
			top: 0;
			bottom: 0;
			left: 0;
			right: 0;
			margin: auto;
			padding: 32px;
			// TODO: mask-imageはiOSだとやたら重い。なんとかしたい
			-webkit-mask-image: linear-gradient(0deg, rgba(0,0,0,0) 0%, rgba(0,0,0,1) 32px, rgba(0,0,0,1) calc(100% - 32px), rgba(0,0,0,0) 100%);
			mask-image: linear-gradient(0deg, rgba(0,0,0,0) 0%, rgba(0,0,0,1) 32px, rgba(0,0,0,1) calc(100% - 32px), rgba(0,0,0,0) 100%);
			overflow: auto;
			display: flex;

			@media (max-width: 500px) {
				padding: 16px;
				-webkit-mask-image: linear-gradient(0deg, rgba(0,0,0,0) 0%, rgba(0,0,0,1) 16px, rgba(0,0,0,1) calc(100% - 16px), rgba(0,0,0,0) 100%);
				mask-image: linear-gradient(0deg, rgba(0,0,0,0) 0%, rgba(0,0,0,1) 16px, rgba(0,0,0,1) calc(100% - 16px), rgba(0,0,0,0) 100%);
			}

			> ::v-deep(*) {
				margin: auto;
			}

			&.top {
				> ::v-deep(*) {
					margin-top: 0;
				}
			}
		}
	}

	&.popup {
		> .content {
			position: absolute;

			&.fixed {
				position: fixed;
			}
		}
	}

	&.drawer {
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		overflow: clip;

		> .content {
			position: fixed;
			bottom: 0;
			left: 0;
			right: 0;
			margin: auto;

			> ::v-deep(*) {
				margin: auto;
			}
		}
	}

}
</style>
