<template>
<div class="mk-modal" v-hotkey.global="keymap" :style="{ pointerEvents: showing ? 'auto' : 'none' }">
	<transition :name="$store.state.device.animation ? 'bg-fade' : ''" appear>
		<div class="bg _modalBg" v-if="showing" @click="$emit('click')"></div>
	</transition>
	<div class="content" @click.self="$emit('click')">
		<transition :name="$store.state.device.animation ? 'modal' : ''" appear @after-leave="$emit('closed')">
			<slot v-if="showing"></slot>
		</transition>
	</div>
</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

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
	},
	computed: {
		keymap(): any {
			return {
				'esc': () => this.$emit('esc'),
			};
		},
	},
});
</script>

<style lang="scss" scoped>
.modal-enter-active, .modal-leave-active {
	transition: opacity 0.3s, transform 0.3s !important;
}
.modal-enter-from, .modal-leave-to {
	pointer-events: none;
	opacity: 0;
	transform: scale(0.9);
}

.bg-fade-enter-active, .bg-fade-leave-active {
	transition: opacity 0.3s !important;
}
.bg-fade-enter-from, .bg-fade-leave-to {
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
		display: flex;
		justify-content: center;
		align-items: center;
	}
}
</style>
