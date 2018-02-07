<template>
	<div>
		<p v-if=" stream.state == 'initializing' ">
			%fa:spinner .pulse%
			<span>%i18n:common.tags.mk-stream-indicator.connecting%<mk-ellipsis/></span>
		</p>
		<p v-if=" stream.state == 'reconnecting' ">
			%fa:spinner .pulse%
			<span>%i18n:common.tags.mk-stream-indicator.reconnecting%<mk-ellipsis/></span>
		</p>
		<p v-if=" stream.state == 'connected' ">
			%fa:check%
			<span>%i18n:common.tags.mk-stream-indicator.connected%</span>
		</p>
	</div>
</template>

<script>
	import anime from 'animejs';
	import Ellipsis from './ellipsis.vue';

	export default {
		props: ['stream'],
		created: function() {
			if (this.stream.state == 'connected') {
				this.root.style.opacity = 0;
			}

			this.stream.on('_connected_', () => {
				setTimeout(() => {
					anime({
						targets: this.root,
						opacity: 0,
						easing: 'linear',
						duration: 200
					});
				}, 1000);
			});

			this.stream.on('_closed_', () => {
				anime({
					targets: this.root,
					opacity: 1,
					easing: 'linear',
					duration: 100
				});
			});
		}
	};
</script>

<style lang="stylus">
	> div
		display block
		pointer-events none
		position fixed
		z-index 16384
		bottom 8px
		right 8px
		margin 0
		padding 6px 12px
		font-size 0.9em
		color #fff
		background rgba(0, 0, 0, 0.8)
		border-radius 4px

		> p
			display block
			margin 0

			> [data-fa]
				margin-right 0.25em

</style>
