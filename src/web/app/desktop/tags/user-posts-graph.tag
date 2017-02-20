<mk-user-posts-graph>
	<canvas ref="canv" width="750" height="250"></canvas>
	<style>
		:scope
			display block
			width 750px
			height 250px

	</style>
	<script>
		this.mixin('api');
		this.mixin('is-promise');

		this.user = null
		this.user-promise = if @is-promise this.opts.user then this.opts.user else Promise.resolve this.opts.user

		this.on('mount', () => {
			user <~ this.user-promise.then
			this.user = user
			this.update();

			this.api('aggregation/users/post', {
				user_id: this.user.id
				limit: 30days
			}).then((data) => {
				data = data.reverse!
				new Chart this.refs.canv, do
					type: 'line' 
					data:
						labels: data.map (x, i) => if i % 3 == 2 then x.date.day + '日' else ''
						datasets: [
							{
								label: '投稿' 
								data: data.map (x) => x.posts
								line-tension: 0
								point-radius: 0
								background-color: '#555' 
								border-color: 'transparent' 
							},
							{
								label: 'Repost' 
								data: data.map (x) => x.reposts
								line-tension: 0
								point-radius: 0
								background-color: '#a2d61e' 
								border-color: 'transparent' 
							},
							{
								label: '返信' 
								data: data.map (x) => x.replies
								line-tension: 0
								point-radius: 0
								background-color: '#F7796C' 
								border-color: 'transparent' 
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
	</script>
</mk-user-posts-graph>
