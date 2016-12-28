mk-user-likes-graph
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

		@api \aggregation/users/like do
			user_id: @user.id
			limit: 30days
		.then (likes) ~>
			likes = likes.reverse!

			new Chart @refs.canv, do
				type: \bar
				data:
					labels: likes.map (x, i) ~> if i % 3 == 2 then x.date.day + '日' else ''
					datasets: [
						{
							label: \いいねした数
							data: likes.map (x) ~> x.count
							background-color: \#F7796C
						}
					]
				options:
					responsive: false
