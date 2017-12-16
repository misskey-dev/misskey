<mk-entrance>
	<main>
		<div>
			<h1>どこにいても、ここにあります</h1>
			<p>ようこそ！ MisskeyはTwitter風ミニブログSNSです――思ったこと、共有したいことをシンプルに書き残せます。タイムラインを見れば、皆の反応や皆がどう思っているのかもすぐにわかります。</p>
			<p if={ stats }>これまでに{ stats.posts_count }投稿されました</p>
		</div>
		<div>
			<mk-entrance-signin if={ mode == 'signin' }/>
			<mk-entrance-signup if={ mode == 'signup' }/>
			<div class="introduction" if={ mode == 'introduction' }>
				<mk-introduction/>
				<button onclick={ signin }>わかった</button>
			</div>
		</div>
	</main>
	<mk-forkit/>
	<footer>
		<div>
			<mk-nav-links/>
			<p class="c">{ _COPYRIGHT_ }</p>
		</div>
	</footer>
	<!-- ↓ https://github.com/riot/riot/issues/2134 (将来的)-->
	<style data-disable-scope="data-disable-scope">
		#wait {
			right: auto;
			left: 15px;
		}
	</style>
	<style>
		:scope
			$width = 1000px

			display block

			&:before
				content ""
				display block
				position fixed
				width 100%
				height 100%
				background rgba(0, 0, 0, 0.3)

			> main
				display block
				max-width $width
				margin 0 auto
				padding 64px 0 0 0
				padding-bottom 16px

				&:after
					content ""
					display block
					clear both

				> div:first-child
					position absolute
					top 64px
					left 0
					width calc(100% - 500px)
					color #fff
					text-shadow 0 0 32px rgba(0, 0, 0, 0.5)
					font-weight bold

					> p:last-child
						padding 1em 0 0 0
						border-top solid 1px #fff

				> div:last-child
					float right

					> .introduction
						max-width 360px
						margin 0 auto
						color #777

						> mk-introduction
							padding 32px
							background #fff
							box-shadow 0 4px 16px rgba(0, 0, 0, 0.2)

						> button
							display block
							margin 16px auto 0 auto
							color #666

							&:hover
								text-decoration underline

			> footer
				*
					color #fff !important
					text-shadow 0 0 8px #000
					font-weight bold

				> div
					max-width $width
					margin 0 auto
					padding 16px 0
					text-align center
					border-top solid 1px #fff

					> .c
						margin 0
						line-height 64px
						font-size 10px

	</style>
	<script>
		this.mixin('api');

		this.mode = 'signin';

		this.on('mount', () => {
			document.documentElement.style.backgroundColor = '#444';

			this.api('meta').then(meta => {
				const img = meta.top_image ? meta.top_image : '/assets/desktop/index.jpg';
				document.documentElement.style.backgroundImage = `url("${ img }")`;
				document.documentElement.style.backgroundSize = 'cover';
				document.documentElement.style.backgroundPosition = 'center';
			});

			this.api('stats').then(stats => {
				this.update({
					stats
				});
			});
		});

		this.signup = () => {
			this.update({
				mode: 'signup'
			});
		};

		this.signin = () => {
			this.update({
				mode: 'signin'
			});
		};

		this.introduction = () => {
			this.update({
				mode: 'introduction'
			});
		};
	</script>
</mk-entrance>

<mk-entrance-signin>
	<a class="help" href={ _DOCS_URL_ + '/help' } title="お困りですか？">%fa:question%</a>
	<div class="form">
		<h1><img if={ user } src={ user.avatar_url + '?thumbnail&size=32' }/>
			<p>{ user ? user.name : 'アカウント' }</p>
		</h1>
		<mk-signin ref="signin"/>
	</div>
	<a href={ _API_URL_ + '/signin/twitter' }>Twitterでサインイン</a>
	<div class="divider"><span>or</span></div>
	<button class="signup" onclick={ parent.signup }>新規登録</button><a class="introduction" onclick={ introduction }>Misskeyについて</a>
	<style>
		:scope
			display block
			width 290px
			margin 0 auto
			text-align center

			&:hover
				> .help
					opacity 1

			> .help
				cursor pointer
				display block
				position absolute
				top 0
				right 0
				z-index 1
				margin 0
				padding 0
				font-size 1.2em
				color #999
				border none
				outline none
				background transparent
				opacity 0
				transition opacity 0.1s ease

				&:hover
					color #444

				&:active
					color #222

				> [data-fa]
					padding 14px

			> .form
				padding 10px 28px 16px 28px
				background #fff
				box-shadow 0px 4px 16px rgba(0, 0, 0, 0.2)

				> h1
					display block
					margin 0
					padding 0
					height 54px
					line-height 54px
					text-align center
					text-transform uppercase
					font-size 1em
					font-weight bold
					color rgba(0, 0, 0, 0.5)
					border-bottom solid 1px rgba(0, 0, 0, 0.1)

					> p
						display inline
						margin 0
						padding 0

					> img
						display inline-block
						top 10px
						width 32px
						height 32px
						margin-right 8px
						border-radius 100%

						&[src='']
							display none

			> .divider
				padding 16px 0
				text-align center

				&:before
				&:after
					content ""
					display block
					position absolute
					top 50%
					width 45%
					height 1px
					border-top solid 1px rgba(0, 0, 0, 0.1)

				&:before
					left 0

				&:after
					right 0

				> *
					z-index 1
					padding 0 8px
					color #fff
					text-shadow 0 0 8px rgba(0, 0, 0, 0.5)

			> .signup
				width 100%
				line-height 56px
				font-size 1em
				color #fff
				background $theme-color
				border-radius 64px

				&:hover
					background lighten($theme-color, 5%)

				&:active
					background darken($theme-color, 5%)

			> .introduction
				display inline-block
				margin-top 16px
				font-size 12px
				color #666

	</style>
	<script>
		this.on('mount', () => {
			this.refs.signin.on('user', user => {
				this.update({
					user: user
				});
			});
		});

		this.introduction = () => {
			this.parent.introduction();
		};
	</script>
</mk-entrance-signin>

<mk-entrance-signup>
	<mk-signup/>
	<button class="cancel" type="button" onclick={ parent.signin } title="キャンセル">%fa:times%</button>
	<style>
		:scope
			display block
			width 368px
			margin 0 auto

			&:hover
				> .cancel
					opacity 1

			> mk-signup
				padding 18px 32px 0 32px
				background #fff
				box-shadow 0px 4px 16px rgba(0, 0, 0, 0.2)

			> .cancel
				cursor pointer
				display block
				position absolute
				top 0
				right 0
				z-index 1
				margin 0
				padding 0
				font-size 1.2em
				color #999
				border none
				outline none
				box-shadow none
				background transparent
				opacity 0
				transition opacity 0.1s ease

				&:hover
					color #555

				&:active
					color #222

				> [data-fa]
					padding 14px

	</style>
</mk-entrance-signup>
