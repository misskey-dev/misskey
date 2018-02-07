<mk-activity-widget data-melt={ design == 2 }>
	<virtual if={ design == 0 }>
		<p class="title">%fa:chart-bar%%i18n:desktop.tags.mk-activity-widget.title%</p>
		<button @click="toggle" title="%i18n:desktop.tags.mk-activity-widget.toggle%">%fa:sort%</button>
	</virtual>
	<p class="initializing" if={ initializing }>%fa:spinner .pulse .fw%%i18n:common.loading%<mk-ellipsis/></p>
	<mk-activity-widget-calender if={ !initializing && view == 0 } data={ [].concat(activity) }/>
	<mk-activity-widget-chart if={ !initializing && view == 1 } data={ [].concat(activity) }/>
	<style>
		:scope
			display block
			background #fff
			border solid 1px rgba(0, 0, 0, 0.075)
			border-radius 6px

			&[data-melt]
				background transparent !important
				border none !important

			> .title
				z-index 1
				margin 0
				padding 0 16px
				line-height 42px
				font-size 0.9em
				font-weight bold
				color #888
				box-shadow 0 1px rgba(0, 0, 0, 0.07)

				> [data-fa]
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

				> [data-fa]
					margin-right 4px

	</style>
	<script>
		this.mixin('api');

		this.design = this.opts.design || 0;
		this.view = this.opts.view || 0;

		this.user = this.opts.user;
		this.initializing = true;

		this.on('mount', () => {
			this.api('aggregation/users/activity', {
				user_id: this.user.id,
				limit: 20 * 7
			}).then(activity => {
				this.update({
					initializing: false,
					activity
				});
			});
		});

		this.toggle = () => {
			this.view++;
			if (this.view == 2) this.view = 0;
			this.update();
			this.trigger('view-changed', this.view);
		};
	</script>
</mk-activity-widget>

<mk-activity-widget-calender>
	<svg viewBox="0 0 21 7" preserveAspectRatio="none">
		<rect each={ data } class="day"
			width="1" height="1"
			riot-x={ x } riot-y={ date.weekday }
			rx="1" ry="1"
			fill="transparent">
			<title>{ date.year }/{ date.month }/{ date.day }<br/>Post: { posts }, Reply: { replies }, Repost: { reposts }</title>
		</rect>
		<rect each={ data }
			riot-width={ v } riot-height={ v }
			riot-x={ x + ((1 - v) / 2) } riot-y={ date.weekday + ((1 - v) / 2) }
			rx="1" ry="1"
			fill={ color }
			style="pointer-events: none;"/>
		<rect class="today"
			width="1" height="1"
			riot-x={ data[data.length - 1].x } riot-y={ data[data.length - 1].date.weekday }
			rx="1" ry="1"
			fill="none"
			stroke-width="0.1"
			stroke="#f73520"/>
	</svg>
	<style>
		:scope
			display block

			> svg
				display block
				padding 10px
				width 100%

				> rect
					transform-origin center

					&.day
						&:hover
							fill rgba(0, 0, 0, 0.05)

	</style>
	<script>
		this.data = this.opts.data;
		this.data.forEach(d => d.total = d.posts + d.replies + d.reposts);
		const peak = Math.max.apply(null, this.data.map(d => d.total));

		let x = 0;
		this.data.reverse().forEach(d => {
			d.x = x;
			d.date.weekday = (new Date(d.date.year, d.date.month - 1, d.date.day)).getDay();

			d.v = d.total / (peak / 2);
			if (d.v > 1) d.v = 1;
			const ch = d.date.weekday == 0 || d.date.weekday == 6 ? 275 : 170;
			const cs = d.v * 100;
			const cl = 15 + ((1 - d.v) * 80);
			d.color = `hsl(${ch}, ${cs}%, ${cl}%)`;

			if (d.date.weekday == 6) x++;
		});
	</script>
</mk-activity-widget-calender>

<mk-activity-widget-chart>
	<svg riot-viewBox="0 0 { viewBoxX } { viewBoxY }" preserveAspectRatio="none" onmousedown={ onMousedown }>
		<title>Black ... Total<br/>Blue ... Posts<br/>Red ... Replies<br/>Green ... Reposts</title>
		<polyline
			riot-points={ pointsPost }
			fill="none"
			stroke-width="1"
			stroke="#41ddde"/>
		<polyline
			riot-points={ pointsReply }
			fill="none"
			stroke-width="1"
			stroke="#f7796c"/>
		<polyline
			riot-points={ pointsRepost }
			fill="none"
			stroke-width="1"
			stroke="#a1de41"/>
		<polyline
			riot-points={ pointsTotal }
			fill="none"
			stroke-width="1"
			stroke="#555"
			stroke-dasharray="2 2"/>
	</svg>
	<style>
		:scope
			display block

			> svg
				display block
				padding 10px
				width 100%
				cursor all-scroll
	</style>
	<script>
		this.viewBoxX = 140;
		this.viewBoxY = 60;
		this.zoom = 1;
		this.pos = 0;

		this.data = this.opts.data.reverse();
		this.data.forEach(d => d.total = d.posts + d.replies + d.reposts);
		const peak = Math.max.apply(null, this.data.map(d => d.total));

		this.on('mount', () => {
			this.render();
		});

		this.render = () => {
			this.update({
				pointsPost: this.data.map((d, i) => `${(i * this.zoom) + this.pos},${(1 - (d.posts / peak)) * this.viewBoxY}`).join(' '),
				pointsReply: this.data.map((d, i) => `${(i * this.zoom) + this.pos},${(1 - (d.replies / peak)) * this.viewBoxY}`).join(' '),
				pointsRepost: this.data.map((d, i) => `${(i * this.zoom) + this.pos},${(1 - (d.reposts / peak)) * this.viewBoxY}`).join(' '),
				pointsTotal: this.data.map((d, i) => `${(i * this.zoom) + this.pos},${(1 - (d.total / peak)) * this.viewBoxY}`).join(' ')
			});
		};

		this.onMousedown = e => {
			e.preventDefault();

			const clickX = e.clientX;
			const clickY = e.clientY;
			const baseZoom = this.zoom;
			const basePos = this.pos;

			// 動かした時
			dragListen(me => {
				let moveLeft = me.clientX - clickX;
				let moveTop = me.clientY - clickY;

				this.zoom = baseZoom + (-moveTop / 20);
				this.pos = basePos + moveLeft;
				if (this.zoom < 1) this.zoom = 1;
				if (this.pos > 0) this.pos = 0;
				if (this.pos < -(((this.data.length - 1) * this.zoom) - this.viewBoxX)) this.pos = -(((this.data.length - 1) * this.zoom) - this.viewBoxX);

				this.render();
			});
		};

		function dragListen(fn) {
			window.addEventListener('mousemove',  fn);
			window.addEventListener('mouseleave', dragClear.bind(null, fn));
			window.addEventListener('mouseup',    dragClear.bind(null, fn));
		}

		function dragClear(fn) {
			window.removeEventListener('mousemove',  fn);
			window.removeEventListener('mouseleave', dragClear);
			window.removeEventListener('mouseup',    dragClear);
		}
	</script>
</mk-activity-widget-chart>

