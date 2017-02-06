<mk-ui-nav>
	<div class="backdrop" onclick={ parent.toggleDrawer }></div>
	<div class="body">
		<a class="me" if={ SIGNIN } href={ CONFIG.url + '/' + I.username }>
			<img class="avatar" src={ I.avatar_url + '?thumbnail&size=128' } alt="avatar"/>
			<p class="name">{ I.name }</p>
		</a>
		<div class="links">
			<ul>
				<li class="home"><a href="/"><i class="icon fa fa-home"></i>ホーム<i class="angle fa fa-angle-right"></i></a></li>
				<li class="mentions"><a><i class="icon fa fa-at"></i>あなた宛て<i class="angle fa fa-angle-right"></i></a></li>
				<li class="notifications"><a href="/i/notifications"><i class="icon fa fa-bell-o"></i>通知<i class="angle fa fa-angle-right"></i></a></li>
				<li class="messaging"><a><i class="icon fa fa-comments-o"></i>メッセージ<i class="angle fa fa-angle-right"></i></a></li>
			</ul>
			<ul>
				<li class="settings"><a onclick={ search }><i class="icon fa fa-search"></i>検索<i class="angle fa fa-angle-right"></i></a></li>
			</ul>
			<ul>
				<li class="settings"><a href="/i/drive"><i class="icon fa fa-cloud"></i>ドライブ<i class="angle fa fa-angle-right"></i></a></li>
			</ul>
			<ul>
				<li class="settings"><a href="/i/settings"><i class="icon fa fa-cog"></i>設定<i class="angle fa fa-angle-right"></i></a></li>
			</ul>
		</div>
		<p class="about" href={ CONFIG.urls.about }><a>Misskeyについて</a></p>
	</div>
	<style type="stylus">
		:scope
			display none

			.backdrop
				position fixed
				top 0
				left 0
				z-index 1025
				width 100%
				height 100%
				background rgba(0, 0, 0, 0.2)
			
			.body
				position fixed
				top 0
				left 0
				z-index 1026
				width 240px
				height 100%
				overflow auto
				color #777
				background #fff

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
					color #777
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

					a
						display block
						padding 0 20px
						line-height 3rem
						line-height calc(1rem + 30px)
						color #777
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

			.about
				margin 1em 1em 2em 1em
				text-align center
				font-size 0.6em
				opacity 0.3

				a
					color #777

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
