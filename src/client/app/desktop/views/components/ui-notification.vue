<template>
<div class="mk-ui-notification">
	<p>{{ message }}</p>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import * as anime from 'animejs';

export default Vue.extend({
	props: ['message'],
	mounted() {
		this.$nextTick(() => {
			anime({
				targets: this.$el,
				opacity: 1,
				translateY: [-64, 0],
				easing: 'easeOutElastic',
				duration: 500
			});

			setTimeout(() => {
				anime({
					targets: this.$el,
					opacity: 0,
					translateY: -64,
					duration: 500,
					easing: 'easeInElastic',
					complete: () => this.$destroy()
				});
			}, 6000);
		});
	}
});
</script>

<style lang="stylus" scoped>
root(isDark)
	display block
	position fixed
	z-index 10000
	top -128px
	left 0
	right 0
	margin 0 auto
	padding 128px 0 0 0
	width 500px
	color rgba(isDark ? #fff : #000, 0.6)
	background rgba(isDark ? #282C37 : #fff, 0.9)
	border-radius 0 0 8px 8px
	box-shadow 0 2px 4px rgba(#000, isDark ? 0.4 : 0.2)
	transform translateY(-64px)
	opacity 0

	> p
		margin 0
		line-height 64px
		text-align center

.mk-ui-notification[data-darkmode]
	root(true)

.mk-ui-notification:not([data-darkmode])
	root(false)

</style>
