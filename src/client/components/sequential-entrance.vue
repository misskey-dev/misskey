<template>
<transition-group v-if="$store.state.device.animation"
	name="staggered-fade"
	tag="div"
	:css="false"
	@before-enter="beforeEnter"
	@enter="enter"
	@leave="leave"
	mode="out-in"
	appear
>
	<slot></slot>
</transition-group>
<div v-else>
	<slot></slot>
</div>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
	props: {
		delay: {
			type: Number,
			required: false,
			default: 40
		},
		direction: {
			type: String,
			required: false,
			default: 'down'
		},
		reversed: {
			type: Boolean,
			required: false,
			default: false
		}
	},
	i: 0,
	methods: {
		beforeEnter(el) {
			if (document.hidden) return;

			el.style.opacity = 0;
			el.style.transform = this.direction === 'down' ? 'translateY(-64px)' : 'translateY(64px)';
			const delay = this.delay * this.$options.i;
			el.style.transition = [getComputedStyle(el).transition, `transform 0.7s cubic-bezier(0.23, 1, 0.32, 1) ${delay}ms`, `opacity 0.7s cubic-bezier(0.23, 1, 0.32, 1) ${delay}ms`].filter(x => x != '').join(',');
			this.$options.i++;

			setTimeout(() => {
				el.style.transition = null;
				el.style.transform = null;
				el.style.opacity = null;
				this.$options.i--;
			}, delay + 710);
		},
		enter(el) {
			if (document.hidden) {
				el.style.opacity = 1;
				el.style.transform = 'translateY(0px)';
			} else {
				setTimeout(() => { // 必要
					el.style.opacity = 1;
					el.style.transform = 'translateY(0px)';
				});
			}
		},
		leave(el) {
			el.style.opacity = 0;
			el.style.transform = this.direction === 'down' ? 'translateY(64px)' : 'translateY(-64px)';
		},
		focus() {
			this.$slots.default[0].elm.focus();
		}
	}
});
</script>

<style lang="scss">
.staggered-fade-move {
	transition: transform 0.7s !important;
}
</style>
