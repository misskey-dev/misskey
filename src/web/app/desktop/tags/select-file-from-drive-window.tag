<mk-select-file-from-drive-window>
	<mk-window ref="window" is-modal={ true } width={ '800px' } height={ '500px' }>
		<yield to="header">
			<mk-raw content={ parent.title }/>
			<span class="count" if={ parent.multiple && parent.files.length > 0 }>({ parent.files.length }ファイル選択中)</span>
		</yield>
		<yield to="content">
			<mk-drive-browser ref="browser" multiple={ parent.multiple }/>
			<div>
				<button class="upload" title="PCからドライブにファイルをアップロード" @click="parent.upload">%fa:upload%</button>
				<button class="cancel" @click="parent.close">キャンセル</button>
				<button class="ok" disabled={ parent.multiple && parent.files.length == 0 } @click="parent.ok">決定</button>
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

					.count
						margin-left 8px
						opacity 0.7

				[data-yield='content']
					> mk-drive-browser
						height calc(100% - 72px)

					> div
						height 72px
						background lighten($theme-color, 95%)

						> .upload
							display inline-block
							position absolute
							top 8px
							left 16px
							cursor pointer
							padding 0
							margin 8px 4px 0 0
							width 40px
							height 40px
							font-size 1em
							color rgba($theme-color, 0.5)
							background transparent
							outline none
							border solid 1px transparent
							border-radius 4px

							&:hover
								background transparent
								border-color rgba($theme-color, 0.3)

							&:active
								color rgba($theme-color, 0.6)
								background transparent
								border-color rgba($theme-color, 0.5)
								box-shadow 0 2px 4px rgba(darken($theme-color, 50%), 0.15) inset

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

						> .ok
						> .cancel
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

						> .ok
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

						> .cancel
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

		this.multiple = this.opts.multiple != null ? this.opts.multiple : false;
		this.title = this.opts.title || '%fa:R file%ファイルを選択';

		this.on('mount', () => {
			this.$refs.window.refs.browser.on('selected', file => {
				this.files = [file];
				this.ok();
			});

			this.$refs.window.refs.browser.on('change-selection', files => {
				this.update({
					files: files
				});
			});

			this.$refs.window.on('closed', () => {
				this.$destroy();
			});
		});

		this.close = () => {
			this.$refs.window.close();
		};

		this.upload = () => {
			this.$refs.window.refs.browser.selectLocalFile();
		};

		this.ok = () => {
			this.trigger('selected', this.multiple ? this.files : this.files[0]);
			this.$refs.window.close();
		};
	</script>
</mk-select-file-from-drive-window>
