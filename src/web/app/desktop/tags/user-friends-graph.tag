<mk-user-friends-graph>
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

			this.api('aggregation/users/followers', {
				user_id: this.user.id
				limit: 30days
			}).then((followers) => {
				followers = followers.reverse!

				this.api('aggregation/users/following', {
					user_id: this.user.id
					limit: 30days
				}).then((following) => {
					following = following.reverse!

					new Chart this.refs.canv, do
						type: 'line' 
						data:
							labels: following.map (x, i) => if i % 3 == 2 then x.date.day + '日' else ''
							datasets: [
								{
									label: 'フォロー' 
									data: following.map (x) => x.count
									line-tension: 0
									border-width: 2
									fill: true
									background-color: 'rgba(127, 221, 64, 0.2)'
									point-background-color: '#fff' 
									point-radius: 4
									point-border-width: 2
									border-color: '#7fdd40' 
								},
								{
									label: 'フォロワー' 
									data: followers.map (x) => x.count
									line-tension: 0
									border-width: 2
									fill: true
									background-color: 'rgba(255, 99, 132, 0.2)'
									point-background-color: '#fff' 
									point-radius: 4
									point-border-width: 2
									border-color: '#FF6384' 
								}
							]
						options:
							responsive: false
	</script>
</mk-user-friends-graph>
