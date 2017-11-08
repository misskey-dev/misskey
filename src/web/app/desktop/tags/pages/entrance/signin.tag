<mk-entrance-signin><a class="help" href={ CONFIG.aboutUrl + '/help' } title="お困りですか？"><i class="fa fa-question"></i></a>
	<div class="form">
		<h1><img if={ user } src={ user.avatar_url + '?thumbnail&size=32' }/>
			<p>{ user ? user.name : 'アカウント' }</p>
		</h1>
		<mk-signin ref="signin"/>
	</div>
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

				> i
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

				&:after
					content ""
					display block
					position absolute
					top 50%
					width 100%
					height 1px
					border-top solid 1px rgba(0, 0, 0, 0.1)

				> *
					z-index 1
					padding 0 8px
					color rgba(0, 0, 0, 0.5)
					background #f7f7f7

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
