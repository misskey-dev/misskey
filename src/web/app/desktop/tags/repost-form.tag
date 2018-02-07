<mk-repost-form>
	<mk-post-preview post={ opts.post }/>
	<virtual if={ !quote }>
		<footer>
			<a class="quote" if={ !quote } @click="onquote">%i18n:desktop.tags.mk-repost-form.quote%</a>
			<button class="cancel" @click="cancel">%i18n:desktop.tags.mk-repost-form.cancel%</button>
			<button class="ok" @click="ok" disabled={ wait }>{ wait ? '%i18n:desktop.tags.mk-repost-form.reposting%' : '%i18n:desktop.tags.mk-repost-form.repost%' }</button>
		</footer>
	</virtual>
	<virtual if={ quote }>
		<mk-post-form ref="form" repost={ opts.post }/>
	</virtual>
	<style lang="stylus" scoped>
		:scope

			> mk-post-preview
				margin 16px 22px

			> div
				padding 16px

			> footer
				height 72px
				background lighten($theme-color, 95%)

				> .quote
					position absolute
					bottom 16px
					left 28px
					line-height 40px

				button
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

				> .ok
					right 16px
					font-weight bold
					color $theme-color-foreground
					background linear-gradient(to bottom, lighten($theme-color, 25%) 0%, lighten($theme-color, 10%) 100%)
					border solid 1px lighten($theme-color, 15%)

					&:hover
						background linear-gradient(to bottom, lighten($theme-color, 8%) 0%, darken($theme-color, 8%) 100%)
						border-color $theme-color

					&:active
						background $theme-color
						border-color $theme-color

	</style>
	<script>
		import notify from '../scripts/notify';

		this.mixin('api');

		this.wait = false;
		this.quote = false;

		this.cancel = () => {
			this.trigger('cancel');
		};

		this.ok = () => {
			this.wait = true;
			this.api('posts/create', {
				repost_id: this.opts.post.id
			}).then(data => {
				this.trigger('posted');
				notify('%i18n:desktop.tags.mk-repost-form.success%');
			}).catch(err => {
				notify('%i18n:desktop.tags.mk-repost-form.failure%');
			}).then(() => {
				this.update({
					wait: false
				});
			});
		};

		this.onquote = () => {
			this.update({
				quote: true
			});

			this.$refs.form.on('post', () => {
				this.trigger('posted');
			});

			this.$refs.form.focus();
		};
	</script>
</mk-repost-form>
