<mk-activity-table>
	<svg if={ data } ref="canvas" viewBox="0 0 53 6.85">
		<rect each={ d, i in data } width="0.8" height="0.8"
			x={ 52 - (i / 7) } y={ d.date.weekday }
			fill={ d.color }></rect>
	</svg>
	<style>
		:scope
			display block
			max-width 600px
			margin 0 auto
			background #fff

			> svg
				display block

	</style>
	<script>
		this.mixin('api');

		this.user = this.opts.user;

		this.on('mount', () => {
			this.api('aggregation/users/activity', {
				user_id: this.user.id
			}).then(data => {
				data.forEach(d => d.total = d.posts + d.replies + d.reposts);
				this.peak = Math.max.apply(null, data.map(d => d.total));
				data.forEach(d => {
					d.v = d.total / this.peak;
					d.color = d.v > 0.75
						? '#196127'
						: d.v > 0.5
							? '#239a3b'
							: d.v > 0.25
								? '#7bc96f'
								: d.v > 0
									? '#c6e48b'
									: '#eee';
					d.date.weekday = (new Date(d.date.year + '-' + d.date.month + '-' + d.date.day)).getDay();
				});
				this.update({ data });
			});
		});
	</script>
</mk-activity-table>
