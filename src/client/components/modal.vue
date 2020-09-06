<template>
<div class="mk-modal" v-hotkey.global="keymap" :style="{ pointerEvents: showing ? 'auto' : 'none' }">
	<transition :name="$store.state.device.animation ? 'modal-bg' : ''" appear>
		<div class="bg _modalBg" v-if="showing" @click="$emit('click')"></div>
	</transition>
	<div class="content" :class="{ popup, fixed }" @click.self="$emit('click')" ref="content">
		<transition :name="$store.state.device.animation ? popup ? 'modal-popup-content' : 'modal-content' : ''" appear @after-leave="$emit('closed')">
			<slot v-if="showing"></slot>
		</transition>
	</div>
</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import * as os from '@/os';

// memo: 旧popup.vueのfixedプロパティに相当するものはsource要素の祖先を辿るなどして自動で判定できるのでは

export default defineComponent({
	emits: ['click', 'esc', 'closed'],
	props: {
		showing: {
			type: Boolean,
			required: true,
		},
		canClose: {
			type: Boolean,
			required: false,
			default: true,
		},
		// TODO: 要る？
		noCenter: {
			type: Boolean,
			required: false
		},
		source: {
			required: false,
		}
	},
	data() {
		return {
			fixed: false,
		};
	},
	computed: {
		keymap(): any {
			return {
				'esc': () => this.$emit('esc'),
			};
		},
		popup(): boolean {
			return this.source != null;
		}
	},
	mounted() {
		this.$nextTick(() => {
			if (!this.popup) return;

			const popover = this.$refs.content as any;

			const rect = this.source.getBoundingClientRect();
			const width = popover.offsetWidth;
			const height = popover.offsetHeight;

			let left;
			let top;

			if (os.isMobile && !this.noCenter) {
				const x = rect.left + (this.fixed ? 0 : window.pageXOffset) + (this.source.offsetWidth / 2);
				const y = rect.top + (this.fixed ? 0 : window.pageYOffset) + (this.source.offsetHeight / 2);
				left = (x - (width / 2));
				top = (y - (height / 2));
				popover.style.transformOrigin = 'center';
			} else {
				const x = rect.left + (this.fixed ? 0 : window.pageXOffset) + (this.source.offsetWidth / 2);
				const y = rect.top + (this.fixed ? 0 : window.pageYOffset) + this.source.offsetHeight;
				left = (x - (width / 2));
				top = y;
			}

			if (this.fixed) {
				if (left + width > window.innerWidth) {
					left = window.innerWidth - width;
					popover.style.transformOrigin = 'center';
				}

				if (top + height > window.innerHeight) {
					top = window.innerHeight - height;
					popover.style.transformOrigin = 'center';
				}
			} else {
				if (left + width - window.pageXOffset > window.innerWidth) {
					left = window.innerWidth - width + window.pageXOffset;
					popover.style.transformOrigin = 'center';
				}

				if (top + height - window.pageYOffset > window.innerHeight) {
					top = window.innerHeight - height + window.pageYOffset;
					popover.style.transformOrigin = 'center';
				}
			}

			if (top < 0) {
				top = 0;
			}

			if (left < 0) {
				left = 0;
			}

			popover.style.left = left + 'px';
			popover.style.top = top + 'px';
		});
	},
});
</script>

<style lang="scss" scoped>
.modal-bg-enter-active, .modal-bg-leave-active {
	transition: opacity 0.3s !important;
}
.modal-bg-enter-from, .modal-bg-leave-to {
	opacity: 0;
}

.modal-content-enter-active, .modal-content-leave-active {
	transition: opacity 0.3s, transform 0.3s !important;
}
.modal-content-enter-from, .modal-content-leave-to {
	pointer-events: none;
	opacity: 0;
	transform: scale(0.9);
}

.modal-popup-content-enter-active, .modal-popup-content-leave-active {
	transform-origin: center top;
	transition: opacity 0.3s, transform 0.3s !important;
}
.modal-popup-content-enter-from, .modal-popup-content-leave-to {
	transform-origin: center top;
	pointer-events: none;
	opacity: 0;
	transform: scale(0.9);
}

.mk-modal {
	> .bg {
		z-index: 10000;
	}

	> .content:not(.popup) {
		position: fixed;
		z-index: 10000;
		top: 0;
		bottom: 0;
		left: 0;
		right: 0;
		margin: auto;
		max-width: calc(100% - 16px);
		max-height: calc(100% - 16px);
		overflow: auto;
		display: flex;
		justify-content: center;
		align-items: center;
	}

	> .content.popup {
		position: absolute;
		z-index: 10000;

		&.fixed {
			position: fixed;
		}
	}
}
</style>
