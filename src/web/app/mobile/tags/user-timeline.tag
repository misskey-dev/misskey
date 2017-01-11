<mk-user-timeline>
	<mk-timeline ref="timeline" init={ init } more={ more } empty={ withMedia ? 'メディア付き投稿はありません。' : 'このユーザーはまだ投稿していないようです。' }></mk-timeline>
	<style type="stylus">
		:scope
			display block
			max-width 600px
			margin 0 auto
			background #fff

	</style>
	<script>
		@mixin \api

		@user = @opts.user
		@with-media = @opts.with-media

		@init = new Promise (res, rej) ~>
			@api \users/posts do
				user_id: @user.id
				with_media: @with-media
			.then (posts) ~>
				res posts
				@trigger \loaded

		@more = ~>
			@api \users/posts do
				user_id: @user.id
				with_media: @with-media
				max_id: @refs.timeline.tail!.id
	</script>
</mk-user-timeline>
