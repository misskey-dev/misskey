<template>
<div class="dkjvrdxtkvqrwmhfickhndpmnncsgacq" v-hotkey.global="keymap">
	<div class="bg" @click="close"></div>
	<img :src="image.url" :alt="image.name" :title="image.name" @click="close"/>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import anime from 'animejs';

export default Vue.extend({
	props: ['image'],
	mounted() {
		anime({
			targets: this.$el,
			opacity: 1,
			duration: 100,
			easing: 'linear'
		});
	},
	computed: {
		keymap(): any {
			return {
				'esc': this.close,
			};
		}
	},
	methods: {
		close() {
			anime({
				targets: this.$el,
				opacity: 0,
				duration: 100,
				easing: 'linear',
				complete: () => this.destroyDom()
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
