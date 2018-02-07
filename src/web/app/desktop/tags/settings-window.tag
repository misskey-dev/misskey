<mk-settings-window>
	<mk-window ref="window" is-modal={ true } width={ '700px' } height={ '550px' }>
		<yield to="header">%fa:cog%設定</yield>
		<yield to="content">
			<mk-settings/>
		</yield>
	</mk-window>
	<style lang="stylus" scoped>
		:scope
			> mk-window
				[data-yield='header']
					> [data-fa]
						margin-right 4px

				[data-yield='content']
					overflow hidden

	</style>
	<script>
		this.on('mount', () => {
			this.$refs.window.on('closed', () => {
				this.$destroy();
			});
		});

		this.close = () => {
			this.$refs.window.close();
		};
	</script>
</mk-settings-window>
