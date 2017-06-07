<mk-activity-home-widget>
	<p class="title"><i class="fa fa-bar-chart"></i>%i18n:desktop.tags.mk-activity-home-widget.title%</p>
	<p class="initializing" if={ initializing }><i class="fa fa-spinner fa-pulse fa-fw"></i>%i18n:common.loading%<mk-ellipsis/></p>
	<svg if={ !initializing } ref="canvas" viewBox="0 0 21 7" preserveAspectRatio="none">
		<rect each={ data } width="1" height="1"
			riot-x={ x } riot-y={ date.weekday }
			fill={ color }></rect>
	</svg>
	<style>
		:scope
			display block
			background #fff

			> .title
				z-index 1
				margin 0
				padding 0 16px
				line-height 42px
				font-size 0.9em
				font-weight bold
				color #888
				box-shadow 0 1px rgba(0, 0, 0, 0.07)

				> i
					margin-right 4px

			> .initializing
				margin 0
				padding 16px
				text-align center
				color #aaa

				> i
					margin-right 4px

			> svg
				display block
				padding 10px
				width 100%

				> rect
					transform-origin center
					transform scale(0.8)

	</style>
	<script>
		this.mixin('i');
		this.mixin('api');

		this.initializing = true;

		this.on('mount', () => {
			this.api('aggregation/users/activity', {
				user_id: this.I.id,
				limit: 20 * 7
			}).then(data => {
				data.forEach(d => d.total = d.posts + d.replies + d.reposts);
				this.peak = Math.max.apply(null, data.map(d => d.total)) / 2;
				let x = 0;
				data.reverse().forEach(d => {
					d.x = x;
					let v = d.total / this.peak;
					if (v > 1) v = 1;
					d.color = `hsl(180, ${v * 100}%, ${15 + ((1 - v) * 80)}%)`;
					d.date.weekday = (new Date(d.date.year, d.date.month - 1, d.date.day)).getDay();
					if (d.date.weekday == 6) x++;
				});

				this.update({
					initializing: false,
					data
				});
			});
		});
	</script>
</mk-activity-home-widget>
