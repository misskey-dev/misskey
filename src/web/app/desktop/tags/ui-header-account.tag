<mk-ui-header-account>
	<button class="header" data-active={ isOpen.toString() } onclick={ toggle }><span class="username">{ I.username }<i class="fa fa-angle-down" if={ !isOpen }></i><i class="fa fa-angle-up" if={ isOpen }></i></span><img class="avatar" src={ I.avatar_url + '?thumbnail&size=64' } alt="avatar"/></button>
	<div class="menu" if={ isOpen }>
		<ul>
			<li><a href={ '/' + I.username }><i class="fa fa-user"></i>プロフィール<i class="fa fa-angle-right"></i></a></li>
			<li onclick={ drive }>
				<p><i class="fa fa-cloud"></i>ドライブ<i class="fa fa-angle-right"></i></p>
			</li>
			<li><a href="/i>mentions"><i class="fa fa-at"></i>あなた宛て<i class="fa fa-angle-right"></i></a></li>
		</ul>
		<ul>
			<li onclick={ settings }>
				<p><i class="fa fa-cog"></i>設定<i class="fa fa-angle-right"></i></p>
			</li>
		</ul>
		<ul>
			<li onclick={ signout }>
				<p><i class="fa fa-power-off"></i>サインアウト<i class="fa fa-angle-right"></i></p>
			</li>
		</ul>
	</div>
	<style>
		:scope
			display block
			float left

			> .header
				display block
				margin 0
				padding 0
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

					> .avatar
						$saturate = 150%
						filter saturate($saturate)
						-webkit-filter saturate($saturate)
						-moz-filter saturate($saturate)
						-ms-filter saturate($saturate)

				> .username
					display block
					float left
					margin 0 12px 0 16px
					max-width 16em
					line-height 48px
					font-weight bold
					font-family Meiryo, sans-serif
					text-decoration none

					i
						margin-left 8px

				> .avatar
					display block
					float left
					min-width 32px
					max-width 32px
					min-height 32px
					max-height 32px
					margin 8px 8px 8px 0
					border-radius 4px
					transition filter 100ms ease

			> .menu
				display block
				position absolute
				top 56px
				right -2px
				width 230px
				font-size 0.8em
				background #fff
				border-radius 4px
				box-shadow 0 1px 4px rgba(0, 0, 0, 0.25)

				&:before
					content ""
					pointer-events none
					display block
					position absolute
					top -28px
					right 12px
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
					right 12px
					border-top solid 14px transparent
					border-right solid 14px transparent
					border-bottom solid 14px #fff
					border-left solid 14px transparent

				ul
					display block
					margin 10px 0
					padding 0
					list-style none

					& + ul
						padding-top 10px
						border-top solid 1px #eee

					> li
						display block
						margin 0
						padding 0

						> a
						> p
							display block
							z-index 1
							padding 0 28px
							margin 0
							line-height 40px
							color #868C8C
							cursor pointer

							*
								pointer-events none

							> i:first-of-type
								margin-right 6px

							> i:last-of-type
								display block
								position absolute
								top 0
								right 8px
								z-index 1
								padding 0 20px
								font-size 1.2em
								line-height 40px

							&:hover, &:active
								text-decoration none
								background $theme-color
								color $theme-color-foreground

	</style>
	<script>
		this.mixin('i');
		this.mixin('signout');

		this.is-open = false

		this.on('before-unmount', () => {
			@close!

		toggle() {
			if @is-open
				@close!
			else
				@open!

		open() {
			this.is-open = true
			this.update();
			all = document.query-selector-all 'body *'
			Array.prototype.for-each.call all, (el) =>
				el.add-event-listener 'mousedown' @mousedown

		close() {
			this.is-open = false
			this.update();
			all = document.query-selector-all 'body *'
			Array.prototype.for-each.call all, (el) =>
				el.remove-event-listener 'mousedown' @mousedown

		mousedown(e) {
			e.preventDefault();
			if (!contains this.root, e.target) and (this.root != e.target)
				@close!
			return false

		drive() {
			@close!
			riot.mount document.body.appendChild document.createElement 'mk-drive-browser-window' 

		settings() {
			@close!
			riot.mount document.body.appendChild document.createElement 'mk-settings-window' 

		function contains(parent, child)
			node = child.parentNode
			while node?
				if node == parent
					return true
				node = node.parentNode
			return false
	</script>
</mk-ui-header-account>
