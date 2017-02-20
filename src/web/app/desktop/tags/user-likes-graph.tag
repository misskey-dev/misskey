<mk-user-likes-graph>
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

			this.api 'aggregation/users/like' do
				user_id: this.user.id
				limit: 30days
			.then (likes) =>
				likes = likes.reverse!

				new Chart this.refs.canv, do
					type: 'bar' 
					data:
						labels: likes.map (x, i) => if i % 3 == 2 then x.date.day + '日' else ''
						datasets: [
							{
								label: 'いいねした数' 
								data: likes.map (x) => x.count
								background-color: '#F7796C' 
							}
						]
					options:
						responsive: false
	</script>
</mk-user-likes-graph>
