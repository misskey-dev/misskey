<mk-entrance-signin>
	<mk-signin/>
	<a href={ _API_URL_ + '/signin/twitter' }>Twitterでサインイン</a>
	<div class="divider"><span>or</span></div>
	<button class="signup" @click="parent.signup">%i18n:mobile.tags.mk-entrance-signin.signup%</button><a class="introduction" @click="parent.introduction">%i18n:mobile.tags.mk-entrance-signin.about%</a>
	<style>
		:scope
			display block
			margin 0 auto
			padding 0 8px
			max-width 350px
			text-align center

			> .signup
				padding 16px
				width 100%
				font-size 1em
				color #fff
				background $theme-color
				border-radius 3px

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
					background #fdfdfd

			> .introduction
				display inline-block
				margin-top 16px
				font-size 12px
				color #666





	</style>
</mk-entrance-signin>
