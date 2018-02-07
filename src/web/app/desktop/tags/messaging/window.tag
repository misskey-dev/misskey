<mk-messaging-window>
	<mk-window ref="window" is-modal={ false } width={ '500px' } height={ '560px' }>
		<yield to="header">%fa:comments%メッセージ</yield>
		<yield to="content">
			<mk-messaging ref="index"/>
		</yield>
	</mk-window>
	<style lang="stylus" scoped>
		:scope
			> mk-window
				[data-yield='header']
					> [data-fa]
						margin-right 4px

				[data-yield='content']
					> mk-messaging
						height 100%
						overflow auto

	</style>
	<script lang="typescript">
		this.on('mount', () => {
			this.$refs.window.on('closed', () => {
				this.$destroy();
			});

			this.$refs.window.refs.index.on('navigate-user', user => {
				riot.mount(document.body.appendChild(document.createElement('mk-messaging-room-window')), {
					user: user
				});
			});
		});
	</script>
</mk-messaging-window>
