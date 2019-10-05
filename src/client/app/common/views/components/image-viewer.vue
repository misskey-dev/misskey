<template>
<div class="dkjvrdxtkvqrwmhfickhndpmnncsgacq">
	<div class="bg" @click="close"></div>
	<img :src="image.url" :alt="image.name" :title="image.name" @click="close"/>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import anime from 'animejs';

export default Vue.extend({
	props: ['image'],
	data() {
		return { closing: false }
	},
	mounted() {
		window.history.pushState(null, '', null);
		window.addEventListener('popstate', this.onPopState);
		anime({
			targets: this.$el,
			opacity: 1,
			duration: 100,
			easing: 'linear'
		});
	},
	beforeDestroy() {
		window.removeEventListener('popstate', this.onPopState);
	},
	methods: {
		onPopState(e: PopStateEvent) {
			this.destroyDom();
		},
		close() {
			if (this.closing) return;
			this.closing = true;
			anime({
				targets: this.$el,
				opacity: 0,
				duration: 100,
				easing: 'linear',
				complete: () => window.history.back()
			});
		}
	}
});
</script>

<style lang="stylus" scoped>
.dkjvrdxtkvqrwmhfickhndpmnncsgacq
	display block
	position fixed
	z-index 2048
	top 0
	left 0
	width 100%
	height 100%
	opacity 0

	> .bg
		display block
		position fixed
		z-index 1
		top 0
		left 0
		width 100%
		height 100%
		background rgba(#000, 0.7)

	> img
		position fixed
		z-index 2
		top 0
		right 0
		bottom 0
		left 0
		max-width 100%
		max-height 100%
		margin auto
		cursor zoom-out
		image-orientation from-image

</style>
