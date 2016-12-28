mk-user-friends-graph
	canvas@canv(width='750', height='250')

style.
	display block
	width 750px
	height 250px

script.
	@mixin \api
	@mixin \is-promise

	@user = null
	@user-promise = if @is-promise @opts.user then @opts.user else Promise.resolve @opts.user

	@on \mount ~>
		user <~ @user-promise.then
		@user = user
		@update!

		@api \aggregation/users/followers do
			user_id: @user.id
			limit: 30days
		.then (followers) ~>
			followers = followers.reverse!

			@api \aggregation/users/following do
				user_id: @user.id
				limit: 30days
			.then (following) ~>
				following = following.reverse!

				new Chart @refs.canv, do
					type: \line
					data:
						labels: following.map (x, i) ~> if i % 3 == 2 then x.date.day + '日' else ''
						datasets: [
							{
								label: \フォロー
								data: following.map (x) ~> x.count
								line-tension: 0
								border-width: 2
								fill: true
								background-color: 'rgba(127, 221, 64, 0.2)'
								point-background-color: \#fff
								point-radius: 4
								point-border-width: 2
								border-color: \#7fdd40
							},
							{
								label: \フォロワー
								data: followers.map (x) ~> x.count
								line-tension: 0
								border-width: 2
								fill: true
								background-color: 'rgba(255, 99, 132, 0.2)'
								point-background-color: \#fff
								point-radius: 4
								point-border-width: 2
								border-color: \#FF6384
							}
						]
					options:
						responsive: false
