<mk-input-dialog>
	<mk-window ref="window" is-modal={ true } width={ '500px' }>
		<yield to="header">
			%fa:i-cursor%{ parent.title }
		</yield>
		<yield to="content">
			<div class="body">
				<input ref="text" type={ parent.type } oninput={ parent.onInput } onkeydown={ parent.onKeydown } placeholder={ parent.placeholder }/>
			</div>
			<div class="action">
				<button class="cancel" @click="parent.cancel">キャンセル</button>
				<button class="ok" disabled={ !parent.allowEmpty && refs.text.value.length == 0 } @click="parent.ok">決定</button>
			</div>
		</yield>
	</mk-window>
	<style lang="stylus" scoped>
		:scope
			display block

			> mk-window
				[data-yield='header']
					> [data-fa]
						margin-right 4px

				[data-yield='content']
					> .body
						padding 16px

						> input
							display block
							padding 8px
							margin 0
							width 100%
							max-width 100%
							min-width 100%
							font-size 1em
							color #333
							background #fff
							outline none
							border solid 1px rgba($theme-color, 0.1)
							border-radius 4px
							transition border-color .3s ease

							&:hover
								border-color rgba($theme-color, 0.2)
								transition border-color .1s ease

							&:focus
								color $theme-color
								border-color rgba($theme-color, 0.5)
								transition border-color 0s ease

							&::-webkit-input-placeholder
								color rgba($theme-color, 0.3)

					> .action
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
	<script lang="typescript">
		this.done = false;

		this.title = this.opts.title;
		this.placeholder = this.opts.placeholder;
		this.default = this.opts.default;
		this.allowEmpty = this.opts.allowEmpty != null ? this.opts.allowEmpty : true;
		this.type = this.opts.type ? this.opts.type : 'text';

		this.on('mount', () => {
			this.text = this.$refs.window.refs.text;
			if (this.default) this.text.value = this.default;
			this.text.focus();

			this.$refs.window.on('closing', () => {
				if (this.done) {
					this.opts.onOk(this.text.value);
				} else {
					if (this.opts.onCancel) this.opts.onCancel();
				}
			});

			this.$refs.window.on('closed', () => {
				this.$destroy();
			});
		});

		this.cancel = () => {
			this.done = false;
			this.$refs.window.close();
		};

		this.ok = () => {
			if (!this.allowEmpty && this.text.value == '') return;
			this.done = true;
			this.$refs.window.close();
		};

		this.onInput = () => {
			this.update();
		};

		this.onKeydown = e => {
			if (e.which == 13) { // Enter
				e.preventDefault();
				e.stopPropagation();
				this.ok();
			}
		};
	</script>
</mk-input-dialog>
