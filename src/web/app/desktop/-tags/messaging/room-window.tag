<mk-messaging-room-window>
	<mk-window ref="window" is-modal={ false } width={ '500px' } height={ '560px' } popout={ popout }>
		<yield to="header">%fa:comments%メッセージ: { parent.user.name }</yield>
		<yield to="content">
			<mk-messaging-room user={ parent.user }/>
		</yield>
	</mk-window>
	<style lang="stylus" scoped>
		:scope
			> mk-window
				[data-yield='header']
					> [data-fa]
						margin-right 4px

				[data-yield='content']
					> mk-messaging-room
						height 100%
						overflow auto

	</style>
	<script lang="typescript">
		this.user = this.opts.user;

		this.popout = `${_URL_}/i/messaging/${this.user.username}`;

		this.on('mount', () => {
			this.$refs.window.on('closed', () => {
				this.$destroy();
			});
		});
	</script>
</mk-messaging-room-window>
