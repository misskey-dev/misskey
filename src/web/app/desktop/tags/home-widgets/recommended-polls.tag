<mk-recommended-polls-home-widget>
	<virtual if={ !data.compact }>
		<p class="title">%fa:chart-pie%%i18n:desktop.tags.mk-recommended-polls-home-widget.title%</p>
		<button @click="fetch" title="%i18n:desktop.tags.mk-recommended-polls-home-widget.refresh%">%fa:sync%</button>
	</virtual>
	<div class="poll" if={ !loading && poll != null }>
		<p if={ poll.text }><a href="/{ poll.user.username }/{ poll.id }">{ poll.text }</a></p>
		<p if={ !poll.text }><a href="/{ poll.user.username }/{ poll.id }">%fa:link%</a></p>
		<mk-poll post={ poll }/>
	</div>
	<p class="empty" if={ !loading && poll == null }>%i18n:desktop.tags.mk-recommended-polls-home-widget.nothing%</p>
	<p class="loading" if={ loading }>%fa:spinner .pulse .fw%%i18n:common.loading%<mk-ellipsis/></p>
	<style lang="stylus" scoped>
		:scope
			display block
			background #fff
			border solid 1px rgba(0, 0, 0, 0.075)
			border-radius 6px

			> .title
				margin 0
				padding 0 16px
				line-height 42px
				font-size 0.9em
				font-weight bold
				color #888
				border-bottom solid 1px #eee

				> [data-fa]
					margin-right 4px

			> button
				position absolute
				z-index 2
				top 0
				right 0
				padding 0
				width 42px
				font-size 0.9em
				line-height 42px
				color #ccc

				&:hover
					color #aaa

				&:active
					color #999

			> .poll
				padding 16px
				font-size 12px
				color #555

				> p
					margin 0 0 8px 0

					> a
						color inherit

			> .empty
				margin 0
				padding 16px
				text-align center
				color #aaa

			> .loading
				margin 0
				padding 16px
				text-align center
				color #aaa

				> [data-fa]
					margin-right 4px

	</style>
	<script>
		this.data = {
			compact: false
		};

		this.mixin('widget');

		this.poll = null;
		this.loading = true;

		this.offset = 0;

		this.on('mount', () => {
			this.fetch();
		});

		this.fetch = () => {
			this.update({
				loading: true,
				poll: null
			});
			this.api('posts/polls/recommendation', {
				limit: 1,
				offset: this.offset
			}).then(posts => {
				const poll = posts ? posts[0] : null;
				if (poll == null) {
					this.offset = 0;
				} else {
					this.offset++;
				}
				this.update({
					loading: false,
					poll: poll
				});
			});
		};

		this.func = () => {
			this.data.compact = !this.data.compact;
			this.save();
		};
	</script>
</mk-recommended-polls-home-widget>
