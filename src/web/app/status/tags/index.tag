<mk-index>
	<h1>Misskey<i>Status</i></h1>
	<p>%fa:info-circle%%i18n:status.all-systems-maybe-operational%</p>
	<main>
		<mk-cpu-usage connection={ connection }/>
		<mk-mem-usage connection={ connection }/>
	</main>
	<footer><a href={ _URL_ }>{ _HOST_ }</a></footer>
	<style lang="stylus" scoped>
		:scope
			display block
			margin 0 auto
			padding 0 16px
			max-width 700px

			> h1
				margin 0
				padding 24px 0 16px 0
				font-size 24px
				font-weight normal

				> [data-fa]
					font-style normal
					color #f43b16

			> p
				display block
				margin 0
				padding 12px 16px
				background #eaf4ef
				//border solid 1px #99ccb2
				border-radius 4px

				> [data-fa]
					margin-right 5px

			> main
				> *
					margin 24px 0

					> h2
						margin 0 0 12px 0
						font-size 18px
						font-weight normal

			> footer
				margin 24px 0
				text-align center

				> a
					color #546567
	</style>
	<script lang="typescript">
		import Connection from '../../common/scripts/streaming/server-stream';

		this.mixin('api');

		this.initializing = true;
		this.connection = new Connection();

		this.on('mount', () => {
			this.$root.$data.os.api('meta').then(meta => {
				this.update({
					initializing: false,
					meta
				});
			});
		});

		this.on('unmount', () => {
			this.connection.close();
		});

	</script>
</mk-index>

<mk-cpu-usage>
	<h2>CPU <b>{ percentage }%</b></h2>
	<mk-line-chart ref="chart"/>
	<style lang="stylus" scoped>
		:scope
			display block
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
			this.$refs.chart.addData(1 - stats.cpu_usage);

			const percentage = (stats.cpu_usage * 100).toFixed(0);

			this.update({
				percentage
			});
		};
	</script>
</mk-cpu-usage>

<mk-mem-usage>
	<h2>MEM <b>{ percentage }%</b></h2>
	<mk-line-chart ref="chart"/>
	<style lang="stylus" scoped>
		:scope
			display block
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
			stats.mem.used = stats.mem.total - stats.mem.free;
			this.$refs.chart.addData(1 - (stats.mem.used / stats.mem.total));

			const percentage = (stats.mem.used / stats.mem.total * 100).toFixed(0);

			this.update({
				percentage
			});
		};
	</script>
</mk-mem-usage>

<mk-line-chart>
	<svg riot-viewBox="0 0 { viewBoxX } { viewBoxY }" preserveAspectRatio="none">
		<defs>
			<linearGradient id={ gradientId } x1="0" x2="0" y1="1" y2="0">
				<stop offset="0%" stop-color="rgba(244, 59, 22, 0)"></stop>
				<stop offset="100%" stop-color="#f43b16"></stop>
			</linearGradient>
			<mask id={ maskId } x="0" y="0" riot-width={ viewBoxX } riot-height={ viewBoxY }>
				<polygon
					riot-points={ polygonPoints }
					fill="#fff"
					fill-opacity="0.5"/>
			</mask>
		</defs>
		<line x1="0" y1="0" riot-x2={ viewBoxX } y2="0" stroke="rgba(255, 255, 255, 0.1)" stroke-width="0.25" stroke-dasharray="1"/>
		<line x1="0" y1="25%" riot-x2={ viewBoxX } y2="25%" stroke="rgba(255, 255, 255, 0.1)" stroke-width="0.25" stroke-dasharray="1"/>
		<line x1="0" y1="50%" riot-x2={ viewBoxX } y2="50%" stroke="rgba(255, 255, 255, 0.1)" stroke-width="0.25" stroke-dasharray="1"/>
		<line x1="0" y1="75%" riot-x2={ viewBoxX } y2="75%" stroke="rgba(255, 255, 255, 0.1)" stroke-width="0.25" stroke-dasharray="1"/>
		<line x1="0" y1="100%" riot-x2={ viewBoxX } y2="100%" stroke="rgba(255, 255, 255, 0.1)" stroke-width="0.25" stroke-dasharray="1"/>
		<rect
			x="-1" y="-1"
			riot-width={ viewBoxX + 2 } riot-height={ viewBoxY + 2 }
			style="stroke: none; fill: url(#{ gradientId }); mask: url(#{ maskId })"/>
		<polyline
			riot-points={ polylinePoints }
			fill="none"
			stroke="#f43b16"
			stroke-width="0.5"/>
	</svg>
	<style lang="stylus" scoped>
		:scope
			display block
			padding 16px
			border-radius 8px
			background #1c2531

			> svg
				display block
				padding 1px
				width 100%
	</style>
	<script lang="typescript">
		import uuid from 'uuid';

		this.viewBoxX = 100;
		this.viewBoxY = 30;
		this.data = [];
		this.gradientId = uuid();
		this.maskId = uuid();

		this.addData = data => {
			this.data.push(data);
			if (this.data.length > 100) this.data.shift();

			const polylinePoints = this.data.map((d, i) => `${this.viewBoxX - ((this.data.length - 1) - i)},${d * this.viewBoxY}`).join(' ');
			const polygonPoints = `${this.viewBoxX - (this.data.length - 1)},${ this.viewBoxY } ${ polylinePoints } ${ this.viewBoxX },${ this.viewBoxY }`;

			this.update({
				polylinePoints,
				polygonPoints
			});
		};
	</script>
</mk-line-chart>
