<template>
<div class="nvlagfpb">
	<MkMenu :items="items" @close="$emit('closed')" class="_popup _shadow"/>
</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import contains from '@/scripts/contains';
import MkMenu from './menu.vue';

export default defineComponent({
	components: {
		MkMenu,
	},
	props: {
		items: {
			type: Array,
			required: true
		},
		ev: {
			required: true
		},
		viaKeyboard: {
			type: Boolean,
			required: false
		},
	},
	emits: ['closed'],
	computed: {
		keymap(): any {
			return {
				'esc': () => this.$emit('closed'),
			};
		},
	},
	mounted() {
		this.$el.style.top = this.ev.pageY + 'px';
		this.$el.style.left = this.ev.pageX + 'px';

		for (const el of Array.from(document.querySelectorAll('body *'))) {
			el.addEventListener('mousedown', this.onMousedown);
		}
	},
	beforeUnmount() {
		for (const el of Array.from(document.querySelectorAll('body *'))) {
			el.removeEventListener('mousedown', this.onMousedown);
		}
	},
	methods: {
		onMousedown(e) {
			if (!contains(this.$el, e.target) && (this.$el != e.target)) this.$emit('closed');
		},
	}
});
</script>

<style lang="scss" scoped>
.nvlagfpb {
	position: absolute;
	z-index: 65535;
}
</style>
