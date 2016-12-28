mk-entrance-signup
	mk-signup
	button.cancel(type='button', onclick={ parent.signin }, title='キャンセル'): i.fa.fa-times

style.
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

		> i
			padding 14px
