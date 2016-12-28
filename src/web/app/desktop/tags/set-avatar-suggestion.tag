mk-set-avatar-suggestion(onclick={ set })
	p
		b アバターを設定
		| してみませんか？
		button(onclick={ close }): i.fa.fa-times

style.
	display block
	cursor pointer
	color #fff
	background #a8cad0

	&:hover
		background #70abb5

	> p
		display block
		margin 0 auto
		padding 8px
		max-width 1024px

		> a
			font-weight bold
			color #fff

		> button
			position absolute
			top 0
			right 0
			padding 8px
			color #fff

script.
	@mixin \i
	@mixin \update-avatar

	@set = ~>
		@update-avatar @I, (i) ~>
			@update-i i

	@close = (e) ~>
		e.prevent-default!
		e.stop-propagation!
		@unmount!
