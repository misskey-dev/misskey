<mk-error>
	<!--i: i.fa.fa-times-circle-->
	<img src="/assets/error.jpg" alt=""/>
	<h1>%i18n:common.tags.mk-error.title%</h1>
	<p class="text">%i18n:common.tags.mk-error.description%</p>
	<p class="thanks">%i18n:common.tags.mk-error.thanks%</p>
	<style>
		:scope
			position fixed
			z-index 100000
			top 0
			left 0
			width 100%
			height 100%
			text-align center
			background #f8f8f8

			> i
				display block
				margin-top 64px
				font-size 5em
				color #6998a0

			> img
				display block
				height 200px
				margin 64px auto 0 auto
				pointer-events none
				user-select none

			> h1
				display block
				margin 32px auto 16px auto
				font-size 1.5em
				color #555

			> .text
				display block
				margin 0 auto
				max-width 600px
				font-size 1em
				color #666

			> .thanks
				display block
				margin 32px auto 0 auto
				padding 32px 0 32px 0
				max-width 600px
				font-size 0.9em
				font-style oblique
				color #aaa
				border-top solid 1px #eee

	</style>
</mk-error>
