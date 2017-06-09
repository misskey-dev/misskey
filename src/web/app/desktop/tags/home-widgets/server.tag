<mk-server-home-widget>
	<p class="title"><i class="fa fa-server"></i>%i18n:desktop.tags.mk-server-home-widget.title%</p>
	<button onclick={ toggle } title="%i18n:desktop.tags.mk-server-home-widget.toggle%"><i class="fa fa-sort"></i></button>
	<p class="initializing" if={ initializing }><i class="fa fa-spinner fa-pulse fa-fw"></i>%i18n:common.loading%<mk-ellipsis/></p>
	<mk-server-home-widget-cpu-and-memory-usage if={ !initializing } show={ view == 0 } connection={ connection }/>
	<mk-server-home-widget-disk-usage if={ !initializing } show={ view == 1 } connection={ connection }/>
	<mk-server-home-widget-info if={ !initializing } show={ view == 2 } connection={ connection } meta={ meta }/>
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
		import Connection from '../../../common/scripts/server-stream';

		this.mixin('api');

		this.initializing = true;
		this.view = 0;
		this.connection = new Connection();

		this.on('mount', () => {
			this.api('meta').then(meta => {
				this.update({
					initializing: false,
					meta
				});
			});
		});

		this.on('unmount', () => {
			this.connection.close();
		});

		this.toggle = () => {
			this.view++;
			if (this.view == 3) this.view = 0;
		};
	</script>
</mk-server-home-widget>

<mk-server-home-widget-cpu-and-memory-usage>
	<svg riot-viewBox="0 0 { viewBoxX } { viewBoxY }" preserveAspectRatio="none">
		<polygon
			riot-points={ cpuPolygonPoints }
			riot-fill={ cpuColor }
			fill-opacity="0.5"/>
		<polyline
			riot-points={ cpuPolylinePoints }
			fill="none"
			stroke-width="1"
			riot-stroke={ cpuColor }/>
		<text x="1" y="5">CPU <tspan>{ cpuP }%</tspan></text>
	</svg>
	<svg riot-viewBox="0 0 { viewBoxX } { viewBoxY }" preserveAspectRatio="none">
		<polygon
			riot-points={ memPolygonPoints }
			riot-fill={ memColor }
			fill-opacity="0.5"/>
		<polyline
			riot-points={ memPolylinePoints }
			fill="none"
			stroke-width="1"
			riot-stroke={ memColor }/>
		<text x="1" y="5">MEM <tspan>{ memP }%</tspan></text>
	</svg>
	<style>
		:scope
			display block

			> svg
				display block
				padding 10px
				width 50%
				float left

				&:first-child
					padding-right 5px

				&:last-child
					padding-left 5px

				> text
					font-size 5px
					fill rgba(0, 0, 0, 0.55)

					> tspan
						opacity 0.5

			&:after
				content ""
				display block
				clear both
	</style>
	<script>
		this.viewBoxX = 50;
		this.viewBoxY = 30;
		this.stats = [];
		this.connection = this.opts.connection;

		this.on('mount', () => {
			this.connection.on('stats', this.onStats);
		});

		this.on('unmount', () => {
			this.connection.off('stats', this.onStats);
		});

		this.onStats = stats => {
			stats.mem.used = stats.mem.total - stats.mem.free;
			this.stats.push(stats);
			if (this.stats.length > 50) this.stats.shift();

			const cpuPolylinePoints = this.stats.map((s, i) => `${this.viewBoxX - ((this.stats.length - 1) - i)},${(1 - s.cpu_usage) * this.viewBoxY}`).join(' ');
			const memPolylinePoints = this.stats.map((s, i) => `${this.viewBoxX - ((this.stats.length - 1) - i)},${(1 - (s.mem.used / s.mem.total)) * this.viewBoxY}`).join(' ');

			const cpuPolygonPoints = `${this.viewBoxX - (this.stats.length - 1)},${ this.viewBoxY } ${ cpuPolylinePoints } ${ this.viewBoxX },${ this.viewBoxY }`;
			const memPolygonPoints = `${this.viewBoxX - (this.stats.length - 1)},${ this.viewBoxY } ${ memPolylinePoints } ${ this.viewBoxX },${ this.viewBoxY }`;

			const cpuColor = `hsl(${180 - (stats.cpu_usage * 180)}, 80%, 70%)`;
			const memColor = `hsl(${180 - (stats.mem.used / stats.mem.total * 180)}, 80%, 70%)`;

			const cpuP = (stats.cpu_usage * 100).toFixed(0);
			const memP = (stats.mem.used / stats.mem.total * 100).toFixed(0);

			this.update({
				cpuPolylinePoints,
				memPolylinePoints,
				cpuPolygonPoints,
				memPolygonPoints,
				cpuColor,
				memColor,
				cpuP,
				memP
			});
		};
	</script>
</mk-server-home-widget-cpu-and-memory-usage>

<mk-server-home-widget-disk-usage>
	<svg viewBox="0 0 1 1" preserveAspectRatio="none">
		<circle
			riot-r={ r }
			cx="50%" cy="50%"
			fill="none"
			stroke-width="0.1"
			stroke="rgba(0, 0, 0, 0.05)"/>
		<circle
			riot-r={ r }
			cx="50%" cy="50%"
			riot-stroke-dasharray={ Math.PI * (r * 2) }
			riot-stroke-dashoffset={ strokeDashoffset }
			fill="none"
			stroke-width="0.1"
			riot-stroke={ color }/>
		<text x="50%" y="50%" dy="0.05" text-anchor="middle">{ p }%</text>
	</svg>
	<div>
		<p>Storage</p>
		<p>Total: { bytesToSize(total) }</p>
		<p>Available: { bytesToSize(available) }</p>
		<p>Used: { bytesToSize(used) }</p>
	</div>
	<style>
		:scope
			display block

			> svg
				display block
				padding 10px
				height 100px
				float left

				> circle
					transform-origin center
					transform rotate(-90deg)

				> text
					font-size 0.15px
					fill rgba(0, 0, 0, 0.6)

			> div
				float left
				width calc(100% - 100px)
				padding 10px 10px 10px 0

				> p
					margin 0
					font-size 12px
					color #505050

					&:first-child
						font-weight bold

			&:after
				content ""
				display block
				clear both

	</style>
	<script>
		import bytesToSize from '../../../common/scripts/bytes-to-size';

		this.r = 0.4;
		this.connection = this.opts.connection;
		this.bytesToSize = bytesToSize;

		this.on('mount', () => {
			this.connection.on('stats', this.onStats);
		});

		this.on('unmount', () => {
			this.connection.off('stats', this.onStats);
		});

		this.onStats = stats => {
			stats.disk.used = stats.disk.available - stats.disk.free;

			const color = `hsl(${180 - (stats.disk.used / stats.disk.available * 180)}, 80%, 70%)`;
			const p = (stats.disk.used / stats.disk.available * 100).toFixed(0);
			const strokeDashoffset = (1 - (stats.disk.used / stats.disk.available)) * (Math.PI * (this.r * 2));

			this.update({
				color,
				p,
				strokeDashoffset,
				total: stats.disk.total,
				used: stats.disk.used,
				available: stats.disk.available
			});
		};
	</script>
</mk-server-home-widget-disk-usage>

<mk-server-home-widget-info>
	<p>Maintainer: { meta.maintainer }</p>
	<style>
		:scope
			display block
			padding 10px
	</style>
	<script>
		this.meta = this.opts.meta;
	</script>
</mk-server-home-widget-info>
