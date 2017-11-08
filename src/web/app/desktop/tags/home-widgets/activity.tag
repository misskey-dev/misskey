<mk-activity-home-widget>
	<p class="title"><i class="fa fa-bar-chart"></i>%i18n:desktop.tags.mk-activity-home-widget.title%</p>
	<button onclick={ toggle } title="%i18n:desktop.tags.mk-activity-home-widget.toggle%"><i class="fa fa-sort"></i></button>
	<p class="initializing" if={ initializing }><i class="fa fa-spinner fa-pulse fa-fw"></i>%i18n:common.loading%<mk-ellipsis/></p>
	<mk-activity-home-widget-calender if={ !initializing && view == 0 } data={ [].concat(data) }/>
	<mk-activity-home-widget-chart if={ !initializing && view == 1 } data={ [].concat(data) }/>
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

	</style>
	<script>
		this.mixin('i');
		this.mixin('api');

		this.initializing = true;
		this.view = this.opts.data.hasOwnProperty('view') ? this.opts.data.view : 0;

		this.on('mount', () => {
			this.api('aggregation/users/activity', {
				user_id: this.I.id,
				limit: 20 * 7
			}).then(data => {
				this.update({
					initializing: false,
					data
				});
			});
		});

		this.toggle = () => {
			this.view++;
			if (this.view == 2) this.view = 0;

			// Save view state
			this.I.client_settings.home.filter(w => w.id == this.opts.id)[0].data.view = this.view;
			this.api('i/update_home', {
				home: this.I.client_settings.home
			}).then(() => {
				this.I.update();
			});
		};
	</script>
</mk-activity-home-widget>

<mk-activity-home-widget-calender>
	<svg viewBox="0 0 21 7" preserveAspectRatio="none">
		<rect each={ data } class="day"
			width="1" height="1"
			riot-x={ x } riot-y={ date.weekday }
			rx="1" ry="1"
			fill="transparent">
			<title>{ date.year }/{ date.month }/{ date.day }<br/>Post: { posts }, Reply: { replies }, Repost: { reposts }</title>
		</rect>
		<rect each={ data }
			width="1" height="1"
			riot-x={ x } riot-y={ date.weekday }
			rx="1" ry="1"
			fill={ color }
			style="pointer-events: none; transform: scale({ v });"/>
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
</mk-activity-home-widget-calender>

<mk-activity-home-widget-chart>
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
</mk-activity-home-widget-chart>

