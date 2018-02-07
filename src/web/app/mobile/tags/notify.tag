<mk-notify>
	<mk-notification-preview notification={ opts.notification }/>
	<style>
		:scope
			display block
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
	<script>
		import anime from 'animejs';

		this.on('mount', () => {
			anime({
				targets: this.root,
				bottom: '0px',
				duration: 500,
				easing: 'easeOutQuad'
			});

			setTimeout(() => {
				anime({
					targets: this.root,
					bottom: '-64px',
					duration: 500,
					easing: 'easeOutQuad',
					complete: () => this.$destroy()
				});
			}, 6000);
		});
	</script>
</mk-notify>
