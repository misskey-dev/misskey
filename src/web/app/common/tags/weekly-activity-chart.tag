<mk-weekly-activity-chart>
	<svg if={ data } ref="canvas" viewBox="0 0 7 1" preserveAspectRatio="none">
		<g each={ d, i in data.reverse() }>
			<rect width="0.8" riot-height={ d.postsH }
				riot-x={ i + 0.1 } y={ 1 - d.postsH - d.repliesH - d.repostsH }
				fill="#41ddde"/>
			<rect width="0.8" riot-height={ d.repliesH }
				riot-x={ i + 0.1 } y={ 1 - d.repliesH - d.repostsH }
				fill="#f7796c"/>
			<rect width="0.8" riot-height={ d.repostsH }
				riot-x={ i + 0.1 } y={ 1 - d.repostsH }
				fill="#a1de41"/>
			</g>
	</svg>
	<style>
		:scope
			display block
			max-width 600px
			margin 0 auto

			> svg
				display block

				> rect
					transform-origin center

	</style>
	<script>
		this.mixin('api');

		this.user = this.opts.user;

		this.on('mount', () => {
			this.api('aggregation/users/activity', {
				user_id: this.user.id,
				limit: 7
			}).then(data => {
				data.forEach(d => d.total = d.posts + d.replies + d.reposts);
				this.peak = Math.max.apply(null, data.map(d => d.total));
				data.forEach(d => {
					d.postsH = d.posts / this.peak;
					d.repliesH = d.replies / this.peak;
					d.repostsH = d.reposts / this.peak;
				});
				this.update({ data });
			});
		});
	</script>
</mk-weekly-activity-chart>
