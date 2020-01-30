<template>
<transition-group
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
		}
	},
	methods: {
		beforeEnter(el) {
			el.style.opacity = 0;
			el.style.transform = this.direction === 'down' ? 'translateY(-64px)' : 'translateY(64px)';
		},
		enter(el, done) {
			el.style.transition = [getComputedStyle(el).transition, 'transform 0.7s cubic-bezier(0.23, 1, 0.32, 1)', 'opacity 0.7s cubic-bezier(0.23, 1, 0.32, 1)'].filter(x => x != '').join(',');
			setTimeout(() => {
				el.style.opacity = 1;
				el.style.transform = 'translateY(0px)';
				setTimeout(done, 700);
			}, this.delay * el.dataset.index)
		},
		leave(el, done) {
			setTimeout(() => {
				el.style.opacity = 0;
				el.style.transform = this.direction === 'down' ? 'translateY(64px)' : 'translateY(-64px)';
				setTimeout(done, 700);
			}, this.delay * el.dataset.index)
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
