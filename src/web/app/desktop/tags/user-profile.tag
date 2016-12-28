mk-user-profile
	div.friend-form(if={ SIGNIN && I.id != user.id })
		mk-big-follow-button(user={ user })
		p.followed(if={ user.is_followed }) フォローされています
	div.bio(if={ user.bio != '' }) { user.bio }
	div.friends
		p.following
			i.fa.fa-angle-right
			a(onclick={ show-following }) { user.following_count }
			| 人を
			b フォロー
		p.followers
			i.fa.fa-angle-right
			a(onclick={ show-followers }) { user.followers_count }
			| 人の
			b フォロワー

style.
	display block
	background #fff

	> *:first-child
		border-top none !important

	> .friend-form
		padding 16px
		border-top solid 1px #eee

		> mk-big-follow-button
			width 100%

		> .followed
			margin 12px 0 0 0
			padding 0
			text-align center
			line-height 24px
			font-size 0.8em
			color #71afc7
			background #eefaff
			border-radius 4px

	> .bio
		padding 16px
		color #555
		border-top solid 1px #eee

	> .friends
		padding 16px
		color #555
		border-top solid 1px #eee

		> p
			margin 8px 0

			> i
				margin-left 8px
				margin-right 8px

script.
	@mixin \i

	@user = @opts.user

	@show-following = ~>
		window = document.body.append-child document.create-element \mk-user-following-window
		riot.mount window, do
			user: @user

	@show-followers = ~>
		window = document.body.append-child document.create-element \mk-user-followers-window
		riot.mount window, do
			user: @user
