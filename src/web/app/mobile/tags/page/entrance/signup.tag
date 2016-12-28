mk-entrance-signup
	mk-signup
	button.cancel(type='button', onclick={ parent.signin }, title='キャンセル'): i.fa.fa-times

style.
	display block
	margin 0 auto
	padding 0 8px
	max-width 350px

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
		transition opacity 0.1s ease

		&:hover
			color #555

		&:active
			color #222

		> i
			padding 14px
