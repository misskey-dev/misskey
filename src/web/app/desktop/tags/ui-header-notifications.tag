mk-ui-header-notifications
	button.header(data-active={ is-open }, onclick={ toggle })
		i.fa.fa-bell-o
	div.notifications(if={ is-open })
		mk-notifications

style.
	display block
	float left

	> .header
		display block
		margin 0
		padding 0
		width 32px
		color #9eaba8
		border none
		background transparent
		cursor pointer

		*
			pointer-events none

		&:hover
			color darken(#9eaba8, 20%)

		&:active
			color darken(#9eaba8, 30%)

		&[data-active='true']
			color darken(#9eaba8, 20%)

		> i
			font-size 1.2em
			line-height 48px

	> .notifications
		display block
		position absolute
		top 56px
		right -72px
		width 300px
		background #fff
		border-radius 4px
		box-shadow 0 1px 4px rgba(0, 0, 0, 0.25)

		&:before
			content ""
			pointer-events none
			display block
			position absolute
			top -28px
			right 74px
			border-top solid 14px transparent
			border-right solid 14px transparent
			border-bottom solid 14px rgba(0, 0, 0, 0.1)
			border-left solid 14px transparent

		&:after
			content ""
			pointer-events none
			display block
			position absolute
			top -27px
			right 74px
			border-top solid 14px transparent
			border-right solid 14px transparent
			border-bottom solid 14px #fff
			border-left solid 14px transparent

		> mk-notifications
			max-height 350px
			font-size 1rem
			overflow auto

script.
	@is-open = false

	@toggle = ~>
		if @is-open
			@close!
		else
			@open!

	@open = ~>
		@is-open = true
		@update!
		all = document.query-selector-all 'body *'
		Array.prototype.for-each.call all, (el) ~>
			el.add-event-listener \mousedown @mousedown

	@close = ~>
		@is-open = false
		@update!
		all = document.query-selector-all 'body *'
		Array.prototype.for-each.call all, (el) ~>
			el.remove-event-listener \mousedown @mousedown

	@mousedown = (e) ~>
		e.prevent-default!
		if (!contains @root, e.target) and (@root != e.target)
			@close!
		return false

	function contains(parent, child)
		node = child.parent-node
		while node?
			if node == parent
				return true
			node = node.parent-node
		return false
