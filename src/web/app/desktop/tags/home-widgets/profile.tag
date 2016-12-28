mk-profile-home-widget
	div.banner(style={ I.banner_url ? 'background-image: url(' + I.banner_url + '?thumbnail&size=256)' : '' }, onclick={ set-banner })
	img.avatar(src={ I.avatar_url + '?thumbnail&size=64' }, onclick={ set-avatar }, alt='avatar', data-user-preview={ I.id })
	a.name(href={ CONFIG.url + '/' + I.username }) { I.name }
	p.username @{ I.username }

style.
	display block
	background #fff

	> .banner
		height 100px
		background-color #f5f5f5
		background-size cover
		background-position center

	> .avatar
		display block
		position absolute
		top 76px
		left 16px
		width 58px
		height 58px
		margin 0
		border solid 3px #fff
		border-radius 8px
		vertical-align bottom

	> .name
		display block
		margin 10px 0 0 92px
		line-height 16px
		font-weight bold
		color #555

	> .username
		display block
		margin 4px 0 8px 92px
		line-height 16px
		font-size 0.9em
		color #999

script.
	@mixin \i
	@mixin \user-preview
	@mixin \update-avatar
	@mixin \update-banner

	@set-avatar = ~>
		@update-avatar @I, (i) ~>
			@update-i i

	@set-banner = ~>
		@update-banner @I, (i) ~>
			@update-i i
