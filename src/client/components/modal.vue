<template>
<div class="mk-modal" v-hotkey.global="keymap">
	<transition :name="$store.state.device.animation ? 'bg-fade' : ''" appear>
		<div class="bg _modalBg" ref="bg" v-if="show" @click="canClose ? close() : () => {}"></div>
	</transition>
	<transition :name="$store.state.device.animation ? 'modal' : ''" appear @after-leave="() => { $emit('closed'); destroyDom(); }">
		<div class="content" ref="content" v-if="show" @click.self="canClose ? close() : () => {}"><slot></slot></div>
	</transition>
</div>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
	props: {
		canClose: {
			type: Boolean,
			required: false,
			default: true,
		},
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
	methods: {
		close() {
			this.show = false;
			(this.$refs.bg as any).style.pointerEvents = 'none';
			(this.$refs.content as any).style.pointerEvents = 'none';
		}
	}
});
</script>

<style lang="scss" scoped>
.modal-enter-active, .modal-leave-active {
	transition: opacity 0.3s, transform 0.3s !important;
}
.modal-enter, .modal-leave-to {
	opacity: 0;
	transform: scale(0.9);
}

.bg-fade-enter-active, .bg-fade-leave-active {
	transition: opacity 0.3s !important;
}
.bg-fade-enter, .bg-fade-leave-to {
	opacity: 0;
}

.mk-modal {
	> .bg {
		z-index: 10000;
	}

	> .content {
		position: fixed;
		z-index: 10000;
		top: 0;
		bottom: 0;
		left: 0;
		right: 0;
		max-width: calc(100% - 16px);
		max-height: calc(100% - 16px);
		overflow: auto;
		margin: auto;

		::v-deep > * {
			position: absolute;
			top: 0;
			bottom: 0;
			left: 0;
			right: 0;
			margin: auto;
			max-height: 100%;
			max-width: 100%;
		}
	}
}
</style>
