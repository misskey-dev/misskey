<mk-ui-nav>
	<div class="body">
		<div class="content"><a class="me" if={ SIGNIN } href={ CONFIG.url + '/' + I.username }><img class="avatar" src={ I.avatar_url + '?thumbnail&size=128' } alt="avatar"/>
				<p class="name">{ I.name }</p></a>
			<div class="links">
				<ul>
					<li class="post"><a href="/i/post"><i class="icon fa fa-pencil-square-o"></i>新規投稿<i class="angle fa fa-angle-right"></i></a></li>
				</ul>
				<ul>
					<li class="home"><a href="/"><i class="icon fa fa-home"></i>ホーム<i class="angle fa fa-angle-right"></i></a></li>
					<li class="mentions"><a href="/i/mentions"><i class="icon fa fa-at"></i>あなた宛て<i class="angle fa fa-angle-right"></i></a></li>
					<li class="notifications"><a href="/i/notifications"><i class="icon fa fa-bell-o"></i>通知<i class="angle fa fa-angle-right"></i></a></li>
					<li class="messaging"><a><i class="icon fa fa-comments-o"></i>メッセージ<i class="angle fa fa-angle-right"></i></a></li>
				</ul>
				<ul>
					<li class="settings"><a onclick={ search }><i class="icon fa fa-search"></i>検索<i class="angle fa fa-angle-right"></i></a></li>
				</ul>
				<ul>
					<li class="settings"><a href="/i/drive"><i class="icon fa fa-cloud"></i>ドライブ<i class="angle fa fa-angle-right"></i></a></li>
					<li class="settings"><a href="/i/upload"><i class="icon fa fa-upload"></i>アップロード<i class="angle fa fa-angle-right"></i></a></li>
				</ul>
				<ul>
					<li class="settings"><a href="/i/settings"><i class="icon fa fa-cog"></i>設定<i class="angle fa fa-angle-right"></i></a></li>
				</ul>
			</div>
			<p class="about"><a>Misskeyについて</a></p>
		</div>
	</div>
	<style type="stylus">
		:scope
			display block
			position fixed
			top 0
			left 0
			z-index -1
			width 240px
			color #fff
			background #313538
			visibility hidden

			.body
				height 100%
				overflow hidden

			.content
				min-height 100%

			.me
				display block
				margin 0
				padding 16px

				.avatar
					display inline
					max-width 64px
					border-radius 32px
					vertical-align middle

				.name
					display block
					margin 0 16px
					position absolute
					top 0
					left 80px
					padding 0
					width calc(100% - 112px)
					color #fff
					line-height 96px
					overflow hidden
					text-overflow ellipsis
					white-space nowrap

			ul
				display block
				margin 16px 0
				padding 0
				list-style none

				&:first-child
					margin-top 0

				li
					display block
					font-size 1em
					line-height 1em
					border-top solid 1px rgba(0, 0, 0, 0.2)
					background #353A3E
					background-clip content-box

					&:last-child
						border-bottom solid 1px rgba(0, 0, 0, 0.2)

					a
						display block
						padding 0 20px
						line-height 3rem
						line-height calc(1rem + 30px)
						color #eee
						text-decoration none

						> .icon
							margin-right 0.5em

						> .angle
							position absolute
							top 0
							right 0
							padding 0 20px
							font-size 1.2em
							line-height calc(1rem + 30px)
							color #ccc

						> .unread-count
							position absolute
							height calc(0.9em + 10px)
							line-height calc(0.9em + 10px)
							top 0
							bottom 0
							right 38px
							margin auto 0
							padding 0px 8px
							min-width 2em
							font-size 0.9em
							text-align center
							color #fff
							background rgba(255, 255, 255, 0.1)
							border-radius 1em

			.about
				margin 1em 1em 2em 1em
				text-align center
				font-size 0.6em
				opacity 0.3

				a
					color #fff

	</style>
	<script>
		@mixin \i
		@mixin \page

		@on \mount ~>
			@opts.ready!

		@search = ~>
			query = window.prompt \検索
			if query? and query != ''
				@page '/search:' + query
	</script>
</mk-ui-nav>
