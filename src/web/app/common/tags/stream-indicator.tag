<mk-stream-indicator>
	<p if={ connection.state == 'initializing' }>
		<i class="fa fa-spinner fa-spin"></i>
		<span>%i18n:common.tags.mk-stream-indicator.connecting%<mk-ellipsis/></span>
	</p>
	<p if={ connection.state == 'reconnecting' }>
		<i class="fa fa-spinner fa-spin"></i>
		<span>%i18n:common.tags.mk-stream-indicator.reconnecting%<mk-ellipsis/></span>
	</p>
	<p if={ connection.state == 'connected' }>
		<i class="fa fa-check"></i>
		<span>%i18n:common.tags.mk-stream-indicator.connected%</span>
	</p>
	<style>
		:scope
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

				> i
					margin-right 0.25em

	</style>
	<script>
		import anime from 'animejs';

		this.mixin('i');

		this.mixin('stream');
		this.connection = this.stream.getConnection();
		this.connectionId = this.stream.use();

		this.on('before-mount', () => {
			if (this.connection.state == 'connected') {
				this.root.style.opacity = 0;
			}

			this.connection.on('_connected_', () => {
				this.update();
				setTimeout(() => {
					anime({
						targets: this.root,
						opacity: 0,
						easing: 'linear',
						duration: 200
					});
				}, 1000);
			});

			this.connection.on('_closed_', () => {
				this.update();
				anime({
					targets: this.root,
					opacity: 1,
					easing: 'linear',
					duration: 100
				});
			});
		});

		this.on('unmount', () => {
			this.stream.dispose(this.connectionId);
		});
	</script>
</mk-stream-indicator>
