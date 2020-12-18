<template>
<transition :name="$store.state.animation ? 'fade' : ''" appear>
	<div class="nvlagfpb" @contextmenu.prevent.stop="() => {}">
		<MkMenu :items="items" @close="$emit('closed')" class="_popup _shadow" :align="'left'"/>
	</div>
</transition>
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
		let left = this.ev.pageX + 1; // 間違って右ダブルクリックした場合に意図せずアイテムがクリックされるのを防ぐため + 1
		let top = this.ev.pageY + 1; // 間違って右ダブルクリックした場合に意図せずアイテムがクリックされるのを防ぐため + 1

		const width = this.$el.offsetWidth;
		const height = this.$el.offsetHeight;

		if (left + width - window.pageXOffset > window.innerWidth) {
			left = window.innerWidth - width + window.pageXOffset;
		}

		if (top + height - window.pageYOffset > window.innerHeight) {
			top = window.innerHeight - height + window.pageYOffset;
		}

		if (top < 0) {
			top = 0;
		}

		if (left < 0) {
			left = 0;
		}

		this.$el.style.top = top + 'px';
		this.$el.style.left = left + 'px';

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

.fade-enter-active, .fade-leave-active {
	transition: opacity 0.5s cubic-bezier(0.16, 1, 0.3, 1), transform 0.5s cubic-bezier(0.16, 1, 0.3, 1);
	transform-origin: left top;
}

.fade-enter-from, .fade-leave-to {
	opacity: 0;
	transform: scale(0.9);
}
</style>
