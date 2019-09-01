<template>
<div class="mk-ui-notification" @click="clicked">
	<p>{{ message }}</p>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import anime from 'animejs';

export default Vue.extend({
	props: ['message'],
	data() {
		return {
			timeout: null,
		}
	},
	methods: {
		leave(duration: number) {
			anime({
					targets: this.$el,
					opacity: 0,
					translateY: -64,
					duration,
					easing: 'easeInBack',
					complete: () => this.destroyDom()
				});
		},
		clicked() {
			clearTimeout(this.timeout);
			this.leave(250);
		}
	},
	mounted() {
		this.$nextTick(() => {
			anime({
				targets: this.$el,
				opacity: 1,
				translateY: [-64, 0],
				easing: 'easeOutBack',
				duration: 500
			});

			this.timeout = setTimeout(() => this.leave(500), 5000);
		});
	}
});
</script>

<style lang="stylus" scoped>
.mk-ui-notification
	display block
	position fixed
	z-index 10000
	top -128px
	left 0
	right 0
	margin 0 auto
	padding 128px 0 0 0
	width 500px
	color var(--desktopNotificationFg)
	background var(--desktopNotificationBg)
	border-radius 0 0 8px 8px
	box-shadow 0 2px 4px var(--desktopNotificationShadow)
	transform translateY(-64px)
	opacity 0
	cursor pointer

	> p
		margin 0
		line-height 64px
		text-align center
		user-select: none;

</style>
