<mk-post-status-graph>
	<canvas ref="canv" width={ opts.width } height={ opts.height }></canvas>
	<style>
		:scope
			display block

			> canvas
				margin 0 auto

	</style>
	<script>
		this.mixin('api');
		this.mixin('is-promise');

		this.post = null
		this.post-promise = if @is-promise this.opts.post then this.opts.post else Promise.resolve this.opts.post

		this.on('mount', () => {
			post <~ this.post-promise.then
			this.post = post
			this.update();

			this.api('aggregation/posts/like', {
				post_id: this.post.id
				limit: 30days
			}).then((likes) => {
				likes = likes.reverse!

				this.api('aggregation/posts/repost', {
					post_id: this.post.id
					limit: 30days
				}).then((repost) => {
					repost = repost.reverse!

					this.api('aggregation/posts/reply', {
						post_id: this.post.id
						limit: 30days
					}).then((replies) => {
						replies = replies.reverse!

						new Chart this.refs.canv, do
							type: 'bar' 
							data:
								labels: likes.map (x, i) => if i % 3 == 2 then x.date.day + '日' else ''
								datasets: [
									{
										label: 'いいね' 
										type: 'line' 
										data: likes.map (x) => x.count
										line-tension: 0
										border-width: 2
										fill: true
										background-color: 'rgba(247, 121, 108, 0.2)'
										point-background-color: '#fff' 
										point-radius: 4
										point-border-width: 2
										border-color: '#F7796C' 
									},
									{
										label: '返信' 
										type: 'bar' 
										data: replies.map (x) => x.count
										background-color: '#555' 
									},
									{
										label: 'Repost' 
										type: 'bar' 
										data: repost.map (x) => x.count
										background-color: '#a2d61e' 
									}
								]
							options:
								responsive: false
	</script>
</mk-post-status-graph>
