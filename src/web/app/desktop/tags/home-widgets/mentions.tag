<mk-mentions-home-widget>
	<header><span data-is-active={ mode == 'all' } onclick={ setMode.bind(this, 'all') }>すべて</span><span data-is-active={ mode == 'following' } onclick={ setMode.bind(this, 'following') }>フォロー中</span></header>
	<div class="loading" if={ isLoading }>
		<mk-ellipsis-icon></mk-ellipsis-icon>
	</div>
	<p class="empty" if={ isEmpty }><i class="fa fa-comments-o"></i><span if={ mode == 'all' }>あなた宛ての投稿はありません。</span><span if={ mode == 'following' }>あなたがフォローしているユーザーからの言及はありません。</span></p>
	<mk-timeline ref="timeline"><yield to="footer"><i class="fa fa-moon-o" if={ !parent.moreLoading }></i><i class="fa fa-spinner fa-pulse fa-fw" if={ parent.moreLoading }></i></yield></mk-timeline>
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
		@mixin \i
		@mixin \api

		@is-loading = true
		@is-empty = false
		@more-loading = false
		@mode = \all

		@on \mount ~>
			document.add-event-listener \keydown @on-document-keydown
			window.add-event-listener \scroll @on-scroll

			@fetch ~>
				@trigger \loaded

		@on \unmount ~>
			document.remove-event-listener \keydown @on-document-keydown
			window.remove-event-listener \scroll @on-scroll

		@on-document-keydown = (e) ~>
			tag = e.target.tag-name.to-lower-case!
			if tag != \input and tag != \textarea
				if e.which == 84 # t
					@refs.timeline.focus!

		@fetch = (cb) ~>
			@api \posts/mentions do
				following: @mode == \following
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
			@api \posts/mentions do
				following: @mode == \following
				max_id: @refs.timeline.tail!.id
			.then (posts) ~>
				@more-loading = false
				@update!
				@refs.timeline.prepend-posts posts
			.catch (err) ~>
				console.error err

		@on-scroll = ~>
			current = window.scroll-y + window.inner-height
			if current > document.body.offset-height - 8
				@more!

		@set-mode = (mode) ~>
			@update do
				mode: mode
			@fetch!
	</script>
</mk-mentions-home-widget>
