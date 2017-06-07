<mk-activity-table>
	<svg if={ data } ref="canvas" viewBox="0 0 53 7" preserveAspectRatio="none">
		<rect each={ data } width="1" height="1"
			riot-x={ x } riot-y={ date.weekday }
			fill={ color }></rect>
	</svg>
	<style>
		:scope
			display block
			max-width 600px
			margin 0 auto
			background #fff

			> svg
				display block

				> rect
					transform-origin center
					transform scale(0.9)

	</style>
	<script>
		this.mixin('api');

		this.user = this.opts.user;

		this.on('mount', () => {
			this.api('aggregation/users/activity', {
				user_id: this.user.id
			}).then(data => {
				data.forEach(d => d.total = d.posts + d.replies + d.reposts);
				this.peak = Math.max.apply(null, data.map(d => d.total)) / 2;
				let x = 0;
				data.reverse().forEach(d => {
					d.x = x;
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
					d.date.weekday = (new Date(d.date.year, d.date.month - 1, d.date.day)).getDay();
					if (d.date.weekday == 6) x++;
				});
				this.update({ data });
			});
		});
	</script>
</mk-activity-table>
