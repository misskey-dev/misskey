<mk-server-home-widget data-melt={ data.design == 2 }>
	<virtual v-if="data.design == 0">
		<p class="title">%fa:server%%i18n:desktop.tags.mk-server-home-widget.title%</p>
		<button @click="toggle" title="%i18n:desktop.tags.mk-server-home-widget.toggle%">%fa:sort%</button>
	</virtual>
	<p class="initializing" v-if="initializing">%fa:spinner .pulse .fw%%i18n:common.loading%<mk-ellipsis/></p>
	<mk-server-home-widget-cpu-and-memory-usage v-if="!initializing" show={ data.view == 0 } connection={ connection }/>
	<mk-server-home-widget-cpu v-if="!initializing" show={ data.view == 1 } connection={ connection } meta={ meta }/>
	<mk-server-home-widget-memory v-if="!initializing" show={ data.view == 2 } connection={ connection }/>
	<mk-server-home-widget-disk v-if="!initializing" show={ data.view == 3 } connection={ connection }/>
	<mk-server-home-widget-uptimes v-if="!initializing" show={ data.view == 4 } connection={ connection }/>
	<mk-server-home-widget-info v-if="!initializing" show={ data.view == 5 } connection={ connection } meta={ meta }/>
	<style lang="stylus" scoped>
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
	<script lang="typescript">
		this.mixin('os');

		this.data = {
			view: 0,
			design: 0
		};

		this.mixin('widget');

		this.mixin('server-stream');
		this.connection = this.serverStream.getConnection();
		this.connectionId = this.serverStream.use();

		this.initializing = true;

		this.on('mount', () => {
			this.mios.getMeta().then(meta => {
				this.update({
					initializing: false,
					meta
				});
			});
		});

		this.on('unmount', () => {
			this.serverStream.dispose(this.connectionId);
		});

		this.toggle = () => {
			this.data.view++;
			if (this.data.view == 6) this.data.view = 0;

			// Save widget state
			this.save();
		};

		this.func = () => {
			if (++this.data.design == 3) this.data.design = 0;
			this.save();
		};
	</script>
</mk-server-home-widget>

<mk-server-home-widget-cpu-and-memory-usage>
	<svg riot-viewBox="0 0 { viewBoxX } { viewBoxY }" preserveAspectRatio="none">
		<defs>
			<linearGradient id={ cpuGradientId } x1="0" x2="0" y1="1" y2="0">
				<stop offset="0%" stop-color="hsl(180, 80%, 70%)"></stop>
				<stop offset="33%" stop-color="hsl(120, 80%, 70%)"></stop>
				<stop offset="66%" stop-color="hsl(60, 80%, 70%)"></stop>
				<stop offset="100%" stop-color="hsl(0, 80%, 70%)"></stop>
			</linearGradient>
			<mask id={ cpuMaskId } x="0" y="0" riot-width={ viewBoxX } riot-height={ viewBoxY }>
				<polygon
					riot-points={ cpuPolygonPoints }
					fill="#fff"
					fill-opacity="0.5"/>
				<polyline
					riot-points={ cpuPolylinePoints }
					fill="none"
					stroke="#fff"
					stroke-width="1"/>
			</mask>
		</defs>
		<rect
			x="-1" y="-1"
			riot-width={ viewBoxX + 2 } riot-height={ viewBoxY + 2 }
			style="stroke: none; fill: url(#{ cpuGradientId }); mask: url(#{ cpuMaskId })"/>
		<text x="1" y="5">CPU <tspan>{ cpuP }%</tspan></text>
	</svg>
	<svg riot-viewBox="0 0 { viewBoxX } { viewBoxY }" preserveAspectRatio="none">
		<defs>
			<linearGradient id={ memGradientId } x1="0" x2="0" y1="1" y2="0">
				<stop offset="0%" stop-color="hsl(180, 80%, 70%)"></stop>
				<stop offset="33%" stop-color="hsl(120, 80%, 70%)"></stop>
				<stop offset="66%" stop-color="hsl(60, 80%, 70%)"></stop>
				<stop offset="100%" stop-color="hsl(0, 80%, 70%)"></stop>
			</linearGradient>
			<mask id={ memMaskId } x="0" y="0" riot-width={ viewBoxX } riot-height={ viewBoxY }>
				<polygon
					riot-points={ memPolygonPoints }
					fill="#fff"
					fill-opacity="0.5"/>
				<polyline
					riot-points={ memPolylinePoints }
					fill="none"
					stroke="#fff"
					stroke-width="1"/>
			</mask>
		</defs>
		<rect
			x="-1" y="-1"
			riot-width={ viewBoxX + 2 } riot-height={ viewBoxY + 2 }
			style="stroke: none; fill: url(#{ memGradientId }); mask: url(#{ memMaskId })"/>
		<text x="1" y="5">MEM <tspan>{ memP }%</tspan></text>
	</svg>
	<style lang="stylus" scoped>
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
	<script lang="typescript">
		import uuid from 'uuid';

		this.viewBoxX = 50;
		this.viewBoxY = 30;
		this.stats = [];
		this.connection = this.opts.connection;
		this.cpuGradientId = uuid();
		this.cpuMaskId = uuid();
		this.memGradientId = uuid();
		this.memMaskId = uuid();

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

			const cpuP = (stats.cpu_usage * 100).toFixed(0);
			const memP = (stats.mem.used / stats.mem.total * 100).toFixed(0);

			this.update({
				cpuPolylinePoints,
				memPolylinePoints,
				cpuPolygonPoints,
				memPolygonPoints,
				cpuP,
				memP
			});
		};
	</script>
</mk-server-home-widget-cpu-and-memory-usage>

<mk-server-home-widget-cpu>
	<mk-server-home-widget-pie ref="pie"/>
	<div>
		<p>%fa:microchip%CPU</p>
		<p>{ cores } Cores</p>
		<p>{ model }</p>
	</div>
	<style lang="stylus" scoped>
		:scope
			display block

			> mk-server-home-widget-pie
				padding 10px
				height 100px
				float left

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

						> [data-fa]
							margin-right 4px

			&:after
				content ""
				display block
				clear both

	</style>
	<script lang="typescript">
		this.cores = this.opts.meta.cpu.cores;
		this.model = this.opts.meta.cpu.model;
		this.connection = this.opts.connection;

		this.on('mount', () => {
			this.connection.on('stats', this.onStats);
		});

		this.on('unmount', () => {
			this.connection.off('stats', this.onStats);
		});

		this.onStats = stats => {
			this.$refs.pie.render(stats.cpu_usage);
		};
	</script>
</mk-server-home-widget-cpu>

<mk-server-home-widget-memory>
	<mk-server-home-widget-pie ref="pie"/>
	<div>
		<p>%fa:flask%Memory</p>
		<p>Total: { bytesToSize(total, 1) }</p>
		<p>Used: { bytesToSize(used, 1) }</p>
		<p>Free: { bytesToSize(free, 1) }</p>
	</div>
	<style lang="stylus" scoped>
		:scope
			display block

			> mk-server-home-widget-pie
				padding 10px
				height 100px
				float left

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

						> [data-fa]
							margin-right 4px

			&:after
				content ""
				display block
				clear both

	</style>
	<script lang="typescript">
		import bytesToSize from '../../../common/scripts/bytes-to-size';

		this.connection = this.opts.connection;
		this.bytesToSize = bytesToSize;

		this.on('mount', () => {
			this.connection.on('stats', this.onStats);
		});

		this.on('unmount', () => {
			this.connection.off('stats', this.onStats);
		});

		this.onStats = stats => {
			stats.mem.used = stats.mem.total - stats.mem.free;
			this.$refs.pie.render(stats.mem.used / stats.mem.total);

			this.update({
				total: stats.mem.total,
				used: stats.mem.used,
				free: stats.mem.free
			});
		};
	</script>
</mk-server-home-widget-memory>

<mk-server-home-widget-disk>
	<mk-server-home-widget-pie ref="pie"/>
	<div>
		<p>%fa:R hdd%Storage</p>
		<p>Total: { bytesToSize(total, 1) }</p>
		<p>Available: { bytesToSize(available, 1) }</p>
		<p>Used: { bytesToSize(used, 1) }</p>
	</div>
	<style lang="stylus" scoped>
		:scope
			display block

			> mk-server-home-widget-pie
				padding 10px
				height 100px
				float left

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

						> [data-fa]
							margin-right 4px

			&:after
				content ""
				display block
				clear both

	</style>
	<script lang="typescript">
		import bytesToSize from '../../../common/scripts/bytes-to-size';

		this.connection = this.opts.connection;
		this.bytesToSize = bytesToSize;

		this.on('mount', () => {
			this.connection.on('stats', this.onStats);
		});

		this.on('unmount', () => {
			this.connection.off('stats', this.onStats);
		});

		this.onStats = stats => {
			stats.disk.used = stats.disk.total - stats.disk.free;

			this.$refs.pie.render(stats.disk.used / stats.disk.total);

			this.update({
				total: stats.disk.total,
				used: stats.disk.used,
				available: stats.disk.available
			});
		};
	</script>
</mk-server-home-widget-disk>

<mk-server-home-widget-uptimes>
	<p>Uptimes</p>
	<p>Process: { process ? process.toFixed(0) : '---' }s</p>
	<p>OS: { os ? os.toFixed(0) : '---' }s</p>
	<style lang="stylus" scoped>
		:scope
			display block
			padding 10px 14px

			> p
				margin 0
				font-size 12px
				color #505050

				&:first-child
					font-weight bold

	</style>
	<script lang="typescript">
		this.connection = this.opts.connection;

		this.on('mount', () => {
			this.connection.on('stats', this.onStats);
		});

		this.on('unmount', () => {
			this.connection.off('stats', this.onStats);
		});

		this.onStats = stats => {
			this.update({
				process: stats.process_uptime,
				os: stats.os_uptime
			});
		};
	</script>
</mk-server-home-widget-uptimes>

<mk-server-home-widget-info>
	<p>Maintainer: <b>{ meta.maintainer }</b></p>
	<p>Machine: { meta.machine }</p>
	<p>Node: { meta.node }</p>
	<style lang="stylus" scoped>
		:scope
			display block
			padding 10px 14px

			> p
				margin 0
				font-size 12px
				color #505050

	</style>
	<script lang="typescript">
		this.meta = this.opts.meta;
	</script>
</mk-server-home-widget-info>

<mk-server-home-widget-pie>
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
		<text x="50%" y="50%" dy="0.05" text-anchor="middle">{ (p * 100).toFixed(0) }%</text>
	</svg>
	<style lang="stylus" scoped>
		:scope
			display block

			> svg
				display block
				height 100%

				> circle
					transform-origin center
					transform rotate(-90deg)
					transition stroke-dashoffset 0.5s ease

				> text
					font-size 0.15px
					fill rgba(0, 0, 0, 0.6)

	</style>
	<script lang="typescript">
		this.r = 0.4;

		this.render = p => {
			const color = `hsl(${180 - (p * 180)}, 80%, 70%)`;
			const strokeDashoffset = (1 - p) * (Math.PI * (this.r * 2));

			this.update({
				p,
				color,
				strokeDashoffset
			});
		};
	</script>
</mk-server-home-widget-pie>
