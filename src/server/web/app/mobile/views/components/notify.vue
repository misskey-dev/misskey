<template>
<div class="mk-notify">
	<mk-notification-preview :notification="notification"/>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import * as anime from 'animejs';

export default Vue.extend({
	props: ['notification'],
	mounted() {
		this.$nextTick(() => {
			anime({
				targets: this.$el,
				bottom: '0px',
				duration: 500,
				easing: 'easeOutQuad'
			});

			setTimeout(() => {
				anime({
					targets: this.$el,
					bottom: '-64px',
					duration: 500,
					easing: 'easeOutQuad',
					complete: () => this.$destroy()
				});
			}, 6000);
		});
	}
});
</script>

<style lang="stylus" scoped>
.mk-notify
	position fixed
	z-index 1024
	bottom -64px
	left 0
	width 100%
	height 64px
	pointer-events none
	-webkit-backdrop-filter blur(2px)
	backdrop-filter blur(2px)
	background-color rgba(#000, 0.5)

</style>
