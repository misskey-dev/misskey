<mk-select-folder-from-drive-window>
	<mk-window ref="window" is-modal={ true } width={ '800px' } height={ '500px' }>
		<yield to="header">
			<mk-raw content={ parent.title }/>
		</yield>
		<yield to="content">
			<mk-drive-browser ref="browser"/>
			<div>
				<button class="cancel" @click="parent.close">キャンセル</button>
				<button class="ok" @click="parent.ok">決定</button>
			</div>
		</yield>
	</mk-window>
	<style>
		:scope
			> mk-window
				[data-yield='header']
					> mk-raw
						> [data-fa]
							margin-right 4px

				[data-yield='content']
					> mk-drive-browser
						height calc(100% - 72px)

					> div
						height 72px
						background lighten($theme-color, 95%)

						.ok
						.cancel
							display block
							position absolute
							bottom 16px
							cursor pointer
							padding 0
							margin 0
							width 120px
							height 40px
							font-size 1em
							outline none
							border-radius 4px

							&:focus
								&:after
									content ""
									pointer-events none
									position absolute
									top -5px
									right -5px
									bottom -5px
									left -5px
									border 2px solid rgba($theme-color, 0.3)
									border-radius 8px

							&:disabled
								opacity 0.7
								cursor default

						.ok
							right 16px
							color $theme-color-foreground
							background linear-gradient(to bottom, lighten($theme-color, 25%) 0%, lighten($theme-color, 10%) 100%)
							border solid 1px lighten($theme-color, 15%)

							&:not(:disabled)
								font-weight bold

							&:hover:not(:disabled)
								background linear-gradient(to bottom, lighten($theme-color, 8%) 0%, darken($theme-color, 8%) 100%)
								border-color $theme-color

							&:active:not(:disabled)
								background $theme-color
								border-color $theme-color

						.cancel
							right 148px
							color #888
							background linear-gradient(to bottom, #ffffff 0%, #f5f5f5 100%)
							border solid 1px #e2e2e2

							&:hover
								background linear-gradient(to bottom, #f9f9f9 0%, #ececec 100%)
								border-color #dcdcdc

							&:active
								background #ececec
								border-color #dcdcdc

	</style>
	<script>
		this.files = [];

		this.title = this.opts.title || '%fa:R folder%フォルダを選択';

		this.on('mount', () => {
			this.$refs.window.on('closed', () => {
				this.unmount();
			});
		});

		this.close = () => {
			this.$refs.window.close();
		};

		this.ok = () => {
			this.trigger('selected', this.$refs.window.refs.browser.folder);
			this.$refs.window.close();
		};
	</script>
</mk-select-folder-from-drive-window>
