mk-autocomplete-suggestion
	ol.users@users(if={ users.length > 0 })
		li(each={ users }, onclick={ parent.on-click }, onkeydown={ parent.on-keydown }, tabindex='-1')
			img.avatar(src={ avatar_url + '?thumbnail&size=32' }, alt='')
			span.name { name }
			span.username @{ username }

style.
	display block
	position absolute
	z-index 65535
	margin-top calc(1em + 8px)
	overflow hidden
	background #fff
	border solid 1px rgba(0, 0, 0, 0.1)
	border-radius 4px

	> .users
		display block
		margin 0
		padding 4px 0
		max-height 190px
		max-width 500px
		overflow auto
		list-style none

		> li
			display block
			padding 4px 12px
			white-space nowrap
			overflow hidden
			font-size 0.9em
			color rgba(0, 0, 0, 0.8)
			cursor default

			&, *
				user-select none

			&:hover
			&[data-selected='true']
				color #fff
				background $theme-color

				.name
					color #fff

				.username
					color #fff

			&:active
				color #fff
				background darken($theme-color, 10%)

				.name
					color #fff

				.username
					color #fff

			.avatar
				vertical-align middle
				min-width 28px
				min-height 28px
				max-width 28px
				max-height 28px
				margin 0 8px 0 0
				border-radius 100%

			.name
				margin 0 8px 0 0
				/*font-weight bold*/
				font-weight normal
				color rgba(0, 0, 0, 0.8)

			.username
				font-weight normal
				color rgba(0, 0, 0, 0.3)

script.
	@mixin \api

	@q = @opts.q
	@textarea = @opts.textarea
	@loading = true
	@users = []
	@select = -1

	@on \mount ~>
		@textarea.add-event-listener \keydown @on-keydown

		all = document.query-selector-all 'body *'
		Array.prototype.for-each.call all, (el) ~>
			el.add-event-listener \mousedown @mousedown

		@api \users/search_by_username do
			query: @q
			limit: 30users
		.then (users) ~>
			@users = users
			@loading = false
			@update!
		.catch (err) ~>
			console.error err

	@on \unmount ~>
		@textarea.remove-event-listener \keydown @on-keydown

		all = document.query-selector-all 'body *'
		Array.prototype.for-each.call all, (el) ~>
			el.remove-event-listener \mousedown @mousedown

	@mousedown = (e) ~>
		if (!contains @root, e.target) and (@root != e.target)
			@close!

	@on-click = (e) ~>
		@complete e.item

	@on-keydown = (e) ~>
		key = e.which
		switch (key)
			| 10, 13 => # Key[ENTER]
				if @select != -1
					e.prevent-default!
					e.stop-propagation!
					@complete @users[@select]
				else
					@close!
			| 27 => # Key[ESC]
				e.prevent-default!
				e.stop-propagation!
				@close!
			| 38 => # Key[↑]
				if @select != -1
					e.prevent-default!
					e.stop-propagation!
					@select-prev!
				else
					@close!
			| 9, 40 => # Key[TAB] or Key[↓]
				e.prevent-default!
				e.stop-propagation!
				@select-next!
			| _ =>
				@close!

	@select-next = ~>
		@select++

		if @select >= @users.length
			@select = 0

		@apply-select!

	@select-prev = ~>
		@select--

		if @select < 0
			@select = @users.length - 1

		@apply-select!

	@apply-select = ~>
		@refs.users.children.for-each (el) ~>
			el.remove-attribute \data-selected

		@refs.users.children[@select].set-attribute \data-selected \true
		@refs.users.children[@select].focus!

	@complete = (user) ~>
		@opts.complete user

	@close = ~>
		@opts.close!

	function contains(parent, child)
		node = child.parent-node
		while node?
			if node == parent
				return true
			node = node.parent-node
		return false
