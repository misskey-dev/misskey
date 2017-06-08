<mk-server-home-widget>
	<p class="title"><i class="fa fa-server"></i>%i18n:desktop.tags.mk-server-home-widget.title%</p>
	<button onclick={ toggle } title="%i18n:desktop.tags.mk-server-home-widget.toggle%"><i class="fa fa-sort"></i></button>
	<p class="initializing" if={ initializing }><i class="fa fa-spinner fa-pulse fa-fw"></i>%i18n:common.loading%<mk-ellipsis/></p>
	<mk-server-home-widget-stats if={ !initializing && view == 0 }/>
	<mk-server-home-widget-info if={ !initializing && view == 1 } meta={ meta }/>
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
		this.mixin('api');

		this.initializing = true;
		this.view = 0;

		this.on('mount', () => {
			this.api('meta').then(meta => {
				this.update({
					initializing: false,
					meta
				});
			});
		});

		this.toggle = () => {
			this.view++;
			if (this.view == 2) this.view = 0;
		};
	</script>
</mk-server-home-widget>

<mk-server-home-widget-stats>
	<svg riot-viewBox="0 0 { viewBoxX } { viewBoxY }" preserveAspectRatio="none">
		<text dx="1" dy="5">CPU</text>
		<polygon
			riot-points={ cpuPolygonPoints }
			riot-fill={ cpuColor }
			fill-opacity="0.5"/>
		<polyline
			riot-points={ cpuPolylinePoints }
			fill="none"
			stroke-width="1"
			riot-stroke={ cpuColor }/>
	</svg>
	<svg riot-viewBox="0 0 { viewBoxX } { viewBoxY }" preserveAspectRatio="none">
		<text dx="1" dy="5">MEM</text>
		<polygon
			riot-points={ memPolygonPoints }
			riot-fill={ memColor }
			fill-opacity="0.5"/>
		<polyline
			riot-points={ memPolylinePoints }
			fill="none"
			stroke-width="1"
			riot-stroke={ memColor }/>
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
					fill #7b7b7b

			&:after
				content ""
				display block
				clear both
	</style>
	<script>
		import Connection from '../../../common/scripts/server-stream';

		this.viewBoxX = 50;
		this.viewBoxY = 30;
		this.stats = [];
		this.connection = new Connection();

		this.on('mount', () => {
			this.connection.on('stats', this.onStats);
		});

		this.on('unmount', () => {
			this.connection.off('stats', this.onStats);
			this.connection.close();
		});

		this.onStats = stats => {
			this.stats.push(stats);
			if (this.stats.length > 50) this.stats.shift();

			const cpuPolylinePoints = this.stats.map((s, i) => `${this.viewBoxX - ((this.stats.length - 1) - i)},${(1 - s.cpu_usage) * this.viewBoxY}`).join(' ');
			const memPolylinePoints = this.stats.map((s, i) => `${this.viewBoxX - ((this.stats.length - 1) - i)},${(s.mem.free / s.mem.total) * this.viewBoxY}`).join(' ');

			const cpuPolygonPoints = `${this.viewBoxX - (this.stats.length - 1)},${ this.viewBoxY } ${ cpuPolylinePoints } ${ this.viewBoxX },${ this.viewBoxY }`;
			const memPolygonPoints = `${this.viewBoxX - (this.stats.length - 1)},${ this.viewBoxY } ${ memPolylinePoints } ${ this.viewBoxX },${ this.viewBoxY }`;

			const cpuColor = `hsl(${180 - (stats.cpu_usage * 180)}, 80%, 70%)`;
			const memColor = `hsl(${180 - (stats.mem.free / stats.mem.total * 180)}, 80%, 70%)`;

			this.update({
				cpuPolylinePoints,
				memPolylinePoints,
				cpuPolygonPoints,
				memPolygonPoints,
				cpuColor,
				memColor
			});
		};
	</script>
</mk-server-home-widget-stats>

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

