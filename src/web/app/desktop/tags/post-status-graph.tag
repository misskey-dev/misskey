mk-post-status-graph
	canvas@canv(width={ opts.width }, height={ opts.height })

style.
	display block

	> canvas
		margin 0 auto

script.
	@mixin \api
	@mixin \is-promise

	@post = null
	@post-promise = if @is-promise @opts.post then @opts.post else Promise.resolve @opts.post

	@on \mount ~>
		post <~ @post-promise.then
		@post = post
		@update!

		@api \aggregation/posts/like do
			post_id: @post.id
			limit: 30days
		.then (likes) ~>
			likes = likes.reverse!

			@api \aggregation/posts/repost do
				post_id: @post.id
				limit: 30days
			.then (repost) ~>
				repost = repost.reverse!

				@api \aggregation/posts/reply do
					post_id: @post.id
					limit: 30days
				.then (replies) ~>
					replies = replies.reverse!

					new Chart @refs.canv, do
						type: \bar
						data:
							labels: likes.map (x, i) ~> if i % 3 == 2 then x.date.day + '日' else ''
							datasets: [
								{
									label: \いいね
									type: \line
									data: likes.map (x) ~> x.count
									line-tension: 0
									border-width: 2
									fill: true
									background-color: 'rgba(247, 121, 108, 0.2)'
									point-background-color: \#fff
									point-radius: 4
									point-border-width: 2
									border-color: \#F7796C
								},
								{
									label: \返信
									type: \bar
									data: replies.map (x) ~> x.count
									background-color: \#555
								},
								{
									label: \Repost
									type: \bar
									data: repost.map (x) ~> x.count
									background-color: \#a2d61e
								}
							]
						options:
							responsive: false
