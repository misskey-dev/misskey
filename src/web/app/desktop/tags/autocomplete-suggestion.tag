<mk-autocomplete-suggestion>
	<ol class="users" ref="users" if={ users.length > 0 }>
		<li each={ users } onclick={ parent.onClick } onkeydown={ parent.onKeydown } tabindex="-1">
			<img class="avatar" src={ avatar_url + '?thumbnail&size=32' } alt=""/>
			<span class="name">{ name }</span>
			<span class="username">@{ username }</span>
		</li>
	</ol>
	<style>
		:scope
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

	</style>
	<script>
		this.mixin('api');

		this.q = this.opts.q
		this.textarea = this.opts.textarea
		this.loading = true
		this.users = []
		this.select = -1

		this.on('mount', () => {
			@textarea.addEventListener 'keydown' this.on-keydown

			all = document.query-selector-all 'body *'
			Array.prototype.forEach.call all, (el) =>
				el.addEventListener 'mousedown' @mousedown

			this.api 'users/search_by_username' do
				query: @q
				limit: 30users
			.then (users) =>
				this.users = users
				this.loading = false
				this.update();
			.catch (err) =>
				console.error err

		this.on('unmount', () => {
			@textarea.removeEventListener 'keydown' this.on-keydown

			all = document.query-selector-all 'body *'
			Array.prototype.forEach.call all, (el) =>
				el.removeEventListener 'mousedown' @mousedown

		this.mousedown = (e) => {
			if (!contains this.root, e.target) and (this.root != e.target)
				@close!

		this.on-click = (e) => {
			@complete e.item

		this.on-keydown = (e) => {
			key = e.which
			switch (key)
				| 10, 13 => // Key[ENTER]
					if @select != -1
						e.preventDefault();
						e.stopPropagation();
						@complete this.users[@select]
					else
						@close!
				| 27 => // Key[ESC]
					e.preventDefault();
					e.stopPropagation();
					@close!
				| 38 => // Key[↑]
					if @select != -1
						e.preventDefault();
						e.stopPropagation();
						@select-prev!
					else
						@close!
				| 9, 40 => // Key[TAB] or Key[↓]
					e.preventDefault();
					e.stopPropagation();
					@select-next!
				| _ =>
					@close!

		this.select-next = () => {
			@select++

			if @select >= this.users.length
				this.select = 0

			@apply-select!

		this.select-prev = () => {
			@select--

			if @select < 0
				this.select = this.users.length - 1

			@apply-select!

		this.apply-select = () => {
			this.refs.users.children.forEach (el) =>
				el.remove-attribute 'data-selected' 

			this.refs.users.children[@select].setAttribute 'data-selected' \true
			this.refs.users.children[@select].focus();

		this.complete = (user) => {
			this.opts.complete user

		this.close = () => {
			this.opts.close!

		function contains(parent, child)
			node = child.parentNode
			while node?
				if node == parent
					return true
				node = node.parentNode
			return false
	</script>
</mk-autocomplete-suggestion>
