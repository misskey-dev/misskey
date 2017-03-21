<mk-ui-notification>
	<p>{ opts.message }</p>
	<style>
		:scope
			display block
			position fixed
			z-index 10000
			top 0
			left 0
			right 0
			margin 0 auto
			width 500px
			color rgba(#000, 0.6)
			background rgba(#fff, 0.9)
			border-radius 0 0 8px 8px
			box-shadow 0 2px 4px rgba(#000, 0.2)
			transform translateY(-64px)
			opacity 0

			> p
				margin 0
				line-height 64px
				text-align center

	</style>
	<script>
		import anime from 'animejs';

		this.on('mount', () => {
			anime({
				targets: this.root,
				opacity: 1,
				translateY: [-64, 0],
				duration: 500,
				easing: 'easeOutQuad'
			});

			setTimeout(() => {
				anime({
					targets: this.root,
					opacity: 0,
					translateY: -64,
					duration: 500,
					easing: 'easeOutQuad',
					complete: () => this.unmount()
				});
			}, 6000);
		});
	</script>
</mk-ui-notification>
