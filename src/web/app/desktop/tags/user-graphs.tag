<mk-user-graphs>
	<section>
		<h1>投稿</h1>
		<mk-user-posts-graph user="{ opts.user }"></mk-user-posts-graph>
	</section>
	<section>
		<h1>フォロー/フォロワー</h1>
		<mk-user-friends-graph user="{ opts.user }"></mk-user-friends-graph>
	</section>
	<section>
		<h1>いいね</h1>
		<mk-user-likes-graph user="{ opts.user }"></mk-user-likes-graph>
	</section>
	<style type="stylus">
		:scope
			display block

			> section
				margin 16px 0
				background #fff
				border solid 1px rgba(0, 0, 0, 0.1)
				border-radius 4px

				> h1
					margin 0 0 8px 0
					padding 0 16px
					line-height 40px
					font-size 1em
					color #666
					border-bottom solid 1px #eee

				> *:not(h1)
					margin 0 auto 16px auto

	</style>
	<script>
		@on \mount ~>
			@trigger \loaded
	</script>
</mk-user-graphs>
