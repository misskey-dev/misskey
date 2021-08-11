<template>
<transition :name="$store.state.animation ? 'popup-menu' : ''" :duration="$store.state.animation ? 300 : 0" appear @after-leave="onClosed" @enter="$emit('opening')" @after-enter="childRendered">
	<div v-show="manualShowing != null ? manualShowing : showing" class="ccczpooj" :class="{ front, fixed, top: position === 'top' }" ref="content" :style="{ pointerEvents: (manualShowing != null ? manualShowing : showing) ? 'auto' : 'none', '--transformOrigin': transformOrigin }">
		<slot :point="point"></slot>
	</div>
</transition>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';

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
		}
	},

	emits: ['opening', 'click', 'esc', 'close', 'closed'],

	data() {
		return {
			showing: true,
			fixed: false,
			transformOrigin: 'center',
			contentClicking: false,
			point: null,
		};
	},

	mounted() {
		this.$watch('src', () => {
			if (this.src) {
				this.src.style.pointerEvents = 'none';
			}
			this.fixed = getFixedContainer(this.src) != null;
			this.$nextTick(() => {
				this.align();
			});
		}, { immediate: true });

		this.$nextTick(() => {
			const popover = this.$refs.content as any;
			new ResizeObserver((entries, observer) => {
				this.align();
			}).observe(popover);
		});

		document.addEventListener('mousedown', this.onDocumentClick, { passive: true });
	},

	beforeUnmount() {
		document.removeEventListener('mousedown', this.onDocumentClick);
	},

	methods: {
		align() {
			if (this.src == null) return;

			const popover = this.$refs.content as any;

			if (popover == null) return;

			const rect = this.src.getBoundingClientRect();
			
			const width = popover.offsetWidth;
			const height = popover.offsetHeight;

			let left;
			let top;

			if (this.srcCenter) {
				const x = rect.left + (this.fixed ? 0 : window.pageXOffset) + (this.src.offsetWidth / 2);
				const y = rect.top + (this.fixed ? 0 : window.pageYOffset) + (this.src.offsetHeight / 2);
				left = (x - (width / 2));
				top = (y - (height / 2));
			} else {
				const x = rect.left + (this.fixed ? 0 : window.pageXOffset) + (this.src.offsetWidth / 2);
				const y = rect.top + (this.fixed ? 0 : window.pageYOffset) + this.src.offsetHeight;
				left = (x - (width / 2));
				top = y;
			}

			if (this.fixed) {
				if (left + width > window.innerWidth) {
					left = window.innerWidth - width;
				}

				if (top + height > window.innerHeight) {
					top = window.innerHeight - height;
				}
			} else {
				if (left + width - window.pageXOffset > window.innerWidth) {
					left = window.innerWidth - width + window.pageXOffset - 1;
				}

				if (top + height - window.pageYOffset > window.innerHeight) {
					top = window.innerHeight - height + window.pageYOffset - 1;
				}
			}

			if (top < 0) {
				top = 0;
			}

			if (left < 0) {
				left = 0;
			}

			if (top > rect.top + (this.fixed ? 0 : window.pageYOffset)) {
				this.point = 'top';
				this.transformOrigin = 'center top';
			} else {
				this.point = null;
				this.transformOrigin = 'center';
			}

			popover.style.left = left + 'px';
			popover.style.top = top + 'px';
		},

		childRendered() {
			// モーダルコンテンツにマウスボタンが押され、コンテンツ外でマウスボタンが離されたときにモーダルバックグラウンドクリックと判定させないためにマウスイベントを監視しフラグ管理する
			const content = this.$refs.content.children[0];
			content.addEventListener('mousedown', e => {
				this.contentClicking = true;
				window.addEventListener('mouseup', e => {
					// click イベントより先に mouseup イベントが発生するかもしれないのでちょっと待つ
					setTimeout(() => {
						this.contentClicking = false;
					}, 100);
				}, { passive: true, once: true });
			}, { passive: true });
		},

		close() {
			if (this.src) this.src.style.pointerEvents = 'auto';
			this.showing = false;
			this.$emit('close');
		},

		onClosed() {
			this.$emit('closed');
		},

		onDocumentClick(ev) {
			const flyoutElement = this.$refs.content;
			let targetElement = ev.target;
			do {
				if (targetElement === flyoutElement) {
					return;
				}
				targetElement = targetElement.parentNode;
			} while (targetElement);
			this.close();
		}
	}
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
