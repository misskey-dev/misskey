<mk-drive-browser-window>
	<mk-window ref="window" is-modal={ false } width={ '800px' } height={ '500px' } popout={ popout }>
		<yield to="header">
			<p class="info" v-if="parent.usage"><b>{ parent.usage.toFixed(1) }%</b> %i18n:desktop.tags.mk-drive-browser-window.used%</p>
			%fa:cloud%%i18n:desktop.tags.mk-drive-browser-window.drive%
		</yield>
		<yield to="content">
			<mk-drive-browser multiple={ true } folder={ parent.folder } ref="browser"/>
		</yield>
	</mk-window>
	<style lang="stylus" scoped>
		:scope
			> mk-window
				[data-yield='header']
					> .info
						position absolute
						top 0
						left 16px
						margin 0
						font-size 80%

					> [data-fa]
						margin-right 4px

				[data-yield='content']
					> mk-drive-browser
						height 100%

	</style>
	<script lang="typescript">
		this.mixin('api');

		this.folder = this.opts.folder ? this.opts.folder : null;

		this.popout = () => {
			const folder = this.$refs.window.refs.browser.folder;
			if (folder) {
				return `${_URL_}/i/drive/folder/${folder.id}`;
			} else {
				return `${_URL_}/i/drive`;
			}
		};

		this.on('mount', () => {
			this.$refs.window.on('closed', () => {
				this.$destroy();
			});

			this.$root.$data.os.api('drive').then(info => {
				this.update({
					usage: info.usage / info.capacity * 100
				});
			});
		});

		this.close = () => {
			this.$refs.window.close();
		};
	</script>
</mk-drive-browser-window>
