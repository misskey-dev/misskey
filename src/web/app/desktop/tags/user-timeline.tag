<mk-user-timeline>
	<header><span data-is-active="{ mode == 'default' }" onclick="{ setMode.bind(this, 'default') }">投稿</span><span data-is-active="{ mode == 'with-replies' }" onclick="{ setMode.bind(this, 'with-replies') }">投稿と返信</span></header>
	<div class="loading" if="{ isLoading }">
		<mk-ellipsis-icon></mk-ellipsis-icon>
	</div>
	<p class="empty" if="{ isEmpty }"><i class="fa fa-comments-o"></i>このユーザーはまだ何も投稿していないようです。</p>
	<mk-timeline ref="timeline"><yield to="footer"><i class="fa fa-moon-o" if="{ !parent.moreLoading }"></i><i class="fa fa-spinner fa-pulse fa-fw" if="{ parent.moreLoading }"></i></yield></mk-timeline>
	<style type="stylus">
		:scope
			display block
			background #fff

			> header
				padding 8px 16px
				border-bottom solid 1px #eee

				> span
					margin-right 16px
					line-height 27px
					font-size 18px
					color #555

					&:not([data-is-active])
						color $theme-color
						cursor pointer

						&:hover
							text-decoration underline

			> .loading
				padding 64px 0

			> .empty
				display block
				margin 0 auto
				padding 32px
				max-width 400px
				text-align center
				color #999

				> i
					display block
					margin-bottom 16px
					font-size 3em
					color #ccc

	</style>
	<script>
		@mixin \api
		@mixin \is-promise
		@mixin \get-post-summary

		@user = null
		@user-promise = if @is-promise @opts.user then @opts.user else Promise.resolve @opts.user
		@is-loading = true
		@is-empty = false
		@more-loading = false
		@unread-count = 0
		@mode = \default

		@on \mount ~>
			document.add-event-listener \visibilitychange @window-on-visibilitychange, false
			document.add-event-listener \keydown @on-document-keydown
			window.add-event-listener \scroll @on-scroll

			@user-promise.then (user) ~>
				@user = user
				@update!

				@fetch ~>
					@trigger \loaded

		@on \unmount ~>
			document.remove-event-listener \visibilitychange @window-on-visibilitychange
			document.remove-event-listener \keydown @on-document-keydown
			window.remove-event-listener \scroll @on-scroll

		@on-document-keydown = (e) ~>
			tag = e.target.tag-name.to-lower-case!
			if tag != \input and tag != \textarea
				if e.which == 84 # t
					@refs.timeline.focus!

		@fetch = (cb) ~>
			@api \users/posts do
				user_id: @user.id
				with_replies: @mode == \with-replies
			.then (posts) ~>
				@is-loading = false
				@is-empty = posts.length == 0
				@update!
				@refs.timeline.set-posts posts
				if cb? then cb!
			.catch (err) ~>
				console.error err
				if cb? then cb!

		@more = ~>
			if @more-loading or @is-loading or @refs.timeline.posts.length == 0
				return
			@more-loading = true
			@update!
			@api \users/posts do
				user_id: @user.id
				with_replies: @mode == \with-replies
				max_id: @refs.timeline.tail!.id
			.then (posts) ~>
				@more-loading = false
				@update!
				@refs.timeline.prepend-posts posts
			.catch (err) ~>
				console.error err

		@on-stream-post = (post) ~>
			@is-empty = false
			@update!
			@refs.timeline.add-post post

			if document.hidden
				@unread-count++
				document.title = '(' + @unread-count + ') ' + @get-post-summary post

		@window-on-visibilitychange = ~>
			if !document.hidden
				@unread-count = 0
				document.title = 'Misskey'

		@on-scroll = ~>
			current = window.scroll-y + window.inner-height
			if current > document.body.offset-height - 16 # 遊び
				@more!

		@set-mode = (mode) ~>
			@update do
				mode: mode
			@fetch!
	</script>
</mk-user-timeline>
