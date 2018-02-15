<mk-activity-table>
	<svg v-if="data" ref="canvas" viewBox="0 0 53 7" preserveAspectRatio="none">
		<rect each={ data } width="1" height="1"
			riot-x={ x } riot-y={ date.weekday }
			rx="1" ry="1"
			fill={ color }
			style="transform: scale({ v });"/>
		<rect class="today" width="1" height="1"
			riot-x={ data[data.length - 1].x } riot-y={ data[data.length - 1].date.weekday }
			rx="1" ry="1"
			fill="none"
			stroke-width="0.1"
			stroke="#f73520"/>
	</svg>
	<style lang="stylus" scoped>
		:scope
			display block
			max-width 600px
			margin 0 auto

			> svg
				display block

				> rect
					transform-origin center

	</style>
	<script lang="typescript">
		this.mixin('api');

		this.user = this.opts.user;

		this.on('mount', () => {
			this.$root.$data.os.api('aggregation/users/activity', {
				user_id: this.user.id
			}).then(data => {
				data.forEach(d => d.total = d.posts + d.replies + d.reposts);
				this.peak = Math.max.apply(null, data.map(d => d.total)) / 2;
				let x = 0;
				data.reverse().forEach(d => {
					d.x = x;
					d.date.weekday = (new Date(d.date.year, d.date.month - 1, d.date.day)).getDay();

					d.v = d.total / this.peak;
					if (d.v > 1) d.v = 1;
					const ch = d.date.weekday == 0 || d.date.weekday == 6 ? 275 : 170;
					const cs = d.v * 100;
					const cl = 15 + ((1 - d.v) * 80);
					d.color = `hsl(${ch}, ${cs}%, ${cl}%)`;

					if (d.date.weekday == 6) x++;
				});
				this.update({ data });
			});
		});
	</script>
</mk-activity-table>
