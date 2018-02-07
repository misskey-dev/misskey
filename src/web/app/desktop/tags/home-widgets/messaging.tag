<mk-messaging-home-widget>
	<virtual if={ data.design == 0 }>
		<p class="title">%fa:comments%%i18n:desktop.tags.mk-messaging-home-widget.title%</p>
	</virtual>
	<mk-messaging ref="index" compact={ true }/>
	<style>
		:scope
			display block
			overflow hidden
			background #fff
			border solid 1px rgba(0, 0, 0, 0.075)
			border-radius 6px

			> .title
				z-index 2
				margin 0
				padding 0 16px
				line-height 42px
				font-size 0.9em
				font-weight bold
				color #888
				box-shadow 0 1px rgba(0, 0, 0, 0.07)

				> [data-fa]
					margin-right 4px

			> mk-messaging
				max-height 250px
				overflow auto

	</style>
	<script>
		this.data = {
			design: 0
		};

		this.mixin('widget');

		this.on('mount', () => {
			this.$refs.index.on('navigate-user', user => {
				riot.mount(document.body.appendChild(document.createElement('mk-messaging-room-window')), {
					user: user
				});
			});
		});

		this.func = () => {
			if (++this.data.design == 2) this.data.design = 0;
			this.save();
		};
	</script>
</mk-messaging-home-widget>
