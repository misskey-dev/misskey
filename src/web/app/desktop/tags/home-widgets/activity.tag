<mk-activity-home-widget>
	<p class="title"><i class="fa fa-bar-chart"></i>%i18n:desktop.tags.mk-activity-home-widget.title%</p>
	<button onclick={ toggle } title="%i18n:desktop.tags.mk-activity-home-widget.toggle%"><i class="fa fa-sort"></i></button>
	<p class="initializing" if={ initializing }><i class="fa fa-spinner fa-pulse fa-fw"></i>%i18n:common.loading%<mk-ellipsis/></p>
	<svg if={ !initializing && view == 0 } class="calender" viewBox="0 0 21 7" preserveAspectRatio="none">
		<rect each={ data }
			width="1" height="1"
			riot-x={ x } riot-y={ date.weekday }
			rx="1" ry="1"
			fill={ color }
			style="transform: scale({ v });"/>
		<rect class="today"
			width="1" height="1"
			riot-x={ data[data.length - 1].x } riot-y={ data[data.length - 1].date.weekday }
			rx="1" ry="1"
			fill="none"
			stroke-width="0.1"
			stroke="#f73520"/>
	</svg>
	<svg if={ !initializing && view == 1 } class="chart" viewBox="0 0 140 60" preserveAspectRatio="none">
		<polyline
			riot-points={ chartPointsPost }
			fill="none"
			stroke-width="1"
			stroke="#41ddde"/>
		<polyline
			riot-points={ chartPointsReply }
			fill="none"
			stroke-width="1"
			stroke="#f7796c"/>
		<polyline
			riot-points={ chartPointsRepost }
			fill="none"
			stroke-width="1"
			stroke="#a1de41"/>
		<polyline
			riot-points={ chartPointsTotal }
			fill="none"
			stroke-width="1"
			stroke="#555"/>
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

			> button
				position absolute
				z-index 2
				top 0
				right 0
				padding 0
				width 42px
				font-size 0.9em
				line-height 42px
				color #ccc

				&:hover
					color #aaa

				&:active
					color #999

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

				&.calender
					> rect
						transform-origin center

	</style>
	<script>
		this.mixin('i');
		this.mixin('api');

		this.initializing = true;
		this.view = 0;

		this.on('mount', () => {
			this.api('aggregation/users/activity', {
				user_id: this.I.id,
				limit: 20 * 7
			}).then(data => {
				data.forEach(d => d.total = d.posts + d.replies + d.reposts);
				const peak = Math.max.apply(null, data.map(d => d.total));
				let x = 0;
				data.reverse().forEach(d => {
					d.x = x;
					d.v = d.total / (peak / 2);
					if (d.v > 1) d.v = 1;
					d.color = `hsl(170, ${d.v * 100}%, ${15 + ((1 - d.v) * 80)}%)`;
					d.date.weekday = (new Date(d.date.year, d.date.month - 1, d.date.day)).getDay();
					if (d.date.weekday == 6) x++;
				});

				this.update({
					initializing: false,
					data,
					chartPointsPost: data.map((d, i) => `${i},${(1 - (d.posts / peak)) * 60}`).join(' '),
					chartPointsReply: data.map((d, i) => `${i},${(1 - (d.replies / peak)) * 60}`).join(' '),
					chartPointsRepost: data.map((d, i) => `${i},${(1 - (d.reposts / peak)) * 60}`).join(' '),
					chartPointsTotal: data.map((d, i) => `${i},${(1 - (d.total / peak)) * 60}`).join(' ')
				});
			});
		});

		this.toggle = () => {
			this.view++;
			if (this.view == 2) this.view = 0;
		};
	</script>
</mk-activity-home-widget>
