mk-notifications-home-widget
	p.title
		i.fa.fa-bell-o
		| 通知
	button(onclick={ settings }, title='通知の設定'): i.fa.fa-cog
	mk-notifications

style.
	display block
	background #fff

	> .title
		z-index 1
		margin 0
		padding 0 16px
		line-height 42px
		font-size 0.9em
		font-weight bold
		color #888
		box-shadow 0 1px rgba(0, 0, 0, 0.07)

		> i
			margin-right 4px

	> button
		position absolute
		z-index 2
		top 0
		right 0
		padding 0
		width 42px
		font-size 0.9em
		line-height 42px
		color #ccc

		&:hover
			color #aaa

		&:active
			color #999

	> mk-notifications
		max-height 300px
		overflow auto

script.
	@settings = ~>
		w = riot.mount document.body.append-child document.create-element \mk-settings-window .0
		w.switch \notification
