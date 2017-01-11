<mk-crop-window>
	<mk-window ref="window" is-modal={ true } width={ '800px' }><yield to="header"><i class="fa fa-crop"></i>{ parent.title }</yield>
<yield to="content">
		<div class="body"><img ref="img" src={ parent.image.url + '?thumbnail&amp;quality=80' } alt=""/></div>
		<div class="action">
			<button class="skip" onclick={ parent.skip }>クロップをスキップ</button>
			<button class="cancel" onclick={ parent.cancel }>キャンセル</button>
			<button class="ok" onclick={ parent.ok }>決定</button>
		</div></yield>
	</mk-window>
	<style type="stylus">
		:scope
			display block

			> mk-window
				[data-yield='header']
					> i
						margin-right 4px

				[data-yield='content']

					> .body
						> img
							width 100%
							max-height 400px

					.cropper-modal {
						opacity: 0.8;
					}

					.cropper-view-box {
						outline-color: $theme-color;
					}

					.cropper-line, .cropper-point {
						background-color: $theme-color;
					}

					.cropper-bg {
						animation: cropper-bg 0.5s linear infinite;
					}

					@-webkit-keyframes cropper-bg {
						0% {
							background-position: 0 0;
						}

						100% {
							background-position: -8px -8px;
						}
					}

					@-moz-keyframes cropper-bg {
						0% {
							background-position: 0 0;
						}

						100% {
							background-position: -8px -8px;
						}
					}

					@-ms-keyframes cropper-bg {
						0% {
							background-position: 0 0;
						}

						100% {
							background-position: -8px -8px;
						}
					}

					@keyframes cropper-bg {
						0% {
							background-position: 0 0;
						}

						100% {
							background-position: -8px -8px;
						}
					}

					> .action
						height 72px
						background lighten($theme-color, 95%)

						.ok
						.cancel
						.skip
							display block
							position absolute
							bottom 16px
							cursor pointer
							padding 0
							margin 0
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
						.cancel
							width 120px

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
						.skip
							color #888
							background linear-gradient(to bottom, #ffffff 0%, #f5f5f5 100%)
							border solid 1px #e2e2e2

							&:hover
								background linear-gradient(to bottom, #f9f9f9 0%, #ececec 100%)
								border-color #dcdcdc

							&:active
								background #ececec
								border-color #dcdcdc

						.cancel
							right 148px

						.skip
							left 16px
							width 150px

	</style>
	<script>
		@mixin \cropper

		@image = @opts.file
		@title = @opts.title
		@aspect-ratio = @opts.aspect-ratio
		@cropper = null

		@on \mount ~>
			@img = @refs.window.refs.img
			@cropper = new @Cropper @img, do
				aspect-ratio: @aspect-ratio
				highlight: no
				view-mode: 1

		@ok = ~>
			@cropper.get-cropped-canvas!.to-blob (blob) ~>
				@trigger \cropped blob
				@refs.window.close!

		@skip = ~>
			@trigger \skiped
			@refs.window.close!

		@cancel = ~>
			@trigger \canceled
			@refs.window.close!
	</script>
</mk-crop-window>
