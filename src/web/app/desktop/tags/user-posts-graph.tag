mk-user-posts-graph
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

		@api \aggregation/users/post do
			user_id: @user.id
			limit: 30days
		.then (data) ~>
			data = data.reverse!
			new Chart @refs.canv, do
				type: \line
				data:
					labels: data.map (x, i) ~> if i % 3 == 2 then x.date.day + '日' else ''
					datasets: [
						{
							label: \投稿
							data: data.map (x) ~> x.posts
							line-tension: 0
							point-radius: 0
							background-color: \#555
							border-color: \transparent
						},
						{
							label: \Repost
							data: data.map (x) ~> x.reposts
							line-tension: 0
							point-radius: 0
							background-color: \#a2d61e
							border-color: \transparent
						},
						{
							label: \返信
							data: data.map (x) ~> x.replies
							line-tension: 0
							point-radius: 0
							background-color: \#F7796C
							border-color: \transparent
						}
					]
				options:
					responsive: false
					scales:
						x-axes: [
							{
								stacked: true
							}
						]
						y-axes: [
							{
								stacked: true
							}
						]
