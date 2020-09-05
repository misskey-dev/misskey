// popupはmodalと統合

<template>
<div class="mk-popup" v-hotkey.global="keymap">
	<transition :name="$store.state.device.animation ? 'bg-fade' : ''" appear>
		<div class="bg _modalBg" ref="bg" @click="close()" v-if="show"></div>
	</transition>
	<transition :name="$store.state.device.animation ? 'popup' : ''" appear @after-leave="() => { $emit('closed'); destroyDom(); }">
		<div class="content" :class="{ fixed }" ref="content" v-if="show" :style="{ width: width ? width + 'px' : 'auto' }"><slot></slot></div>
	</transition>
</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
	props: {
		source: {
			required: true
		},
		noCenter: {
			type: Boolean,
			required: false
		},
		fixed: {
			type: Boolean,
			required: false
		},
		width: {
			type: Number,
			required: false
		}
	},
	data() {
		return {
			show: true,
		};
	},
	computed: {
		keymap(): any {
			return {
				'esc': this.close,
			};
		},
	},
	mounted() {
		this.$nextTick(() => {
			const popover = this.$refs.content as any;

			const rect = this.source.getBoundingClientRect();
			const width = popover.offsetWidth;
			const height = popover.offsetHeight;

			let left;
			let top;

			if (this.$root.isMobile && !this.noCenter) {
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
	methods: {
		close() {
			this.show = false;
			if (this.$refs.bg) (this.$refs.bg as any).style.pointerEvents = 'none';
			if (this.$refs.content) (this.$refs.content as any).style.pointerEvents = 'none';
		}
	}
});
</script>

<style lang="scss" scoped>
.popup-enter-active, .popup-leave-active {
	transition: opacity 0.3s, transform 0.3s !important;
}
.popup-enter, .popup-leave-to {
	opacity: 0;
	transform: scale(0.9);
}

.bg-fade-enter-active, .bg-fade-leave-active {
	transition: opacity 0.3s !important;
}
.bg-fade-enter, .bg-fade-leave-to {
	opacity: 0;
}

.mk-popup {
	> .bg {
		z-index: 10000;
	}

	> .content {
		position: absolute;
		z-index: 10001;
		background: var(--panel);
		border-radius: 8px;
		box-shadow: 0 3px 12px rgba(27, 31, 35, 0.15);
		overflow: hidden;
		transform-origin: center top;

		&.fixed {
			position: fixed;
		}
	}
}
</style>
