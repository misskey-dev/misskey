<mk-index>
	<h1>Misskey Status</h1>
	<main>
		<mk-cpu-usage connection={ connection }/>
	</main>
	<style>
		:scope
			display block

			> h1
				padding 16px

			> *
				margin 0 auto
				max-width 700px

			> main
				> *
					padding 16px
					border-top solid 2px #456267

					> h2
						margin 0
	</style>
	<script>
		import Connection from '../../common/scripts/server-stream';

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

	</script>
</mk-index>

<mk-cpu-usage>
	<h2>CPU <b>{ percentage }%</b></h2>
	<mk-line-chart ref="chart"/>
	<style>
		:scope
			display block
	</style>
	<script>
		this.connection = this.opts.connection;

		this.on('mount', () => {
			this.connection.on('stats', this.onStats);
		});

		this.on('unmount', () => {
			this.connection.off('stats', this.onStats);
		});

		this.onStats = stats => {
			this.refs.chart.addData(1 - stats.cpu_usage);

			const percentage = (stats.cpu_usage * 100).toFixed(0);

			this.update({
				percentage
			});
		};
	</script>
</mk-cpu-usage>

<mk-line-chart>
	<svg riot-viewBox="0 0 { viewBoxX } { viewBoxY }" preserveAspectRatio="none">
		<defs>
			<linearGradient id={ gradientId } x1="0" x2="0" y1="1" y2="0">
				<stop offset="0%" stop-color="transparent"></stop>
				<stop offset="100%" stop-color="#456267"></stop>
			</linearGradient>
			<mask id={ maskId } x="0" y="0" riot-width={ viewBoxX } riot-height={ viewBoxY }>
				<polygon
					riot-points={ polygonPoints }
					fill="#fff"
					fill-opacity="0.5"/>
			</mask>
		</defs>
		<line x1="0" y1="0" riot-x2={ viewBoxX } y2="0" stroke="#eee" stroke-width="0.5"/>
		<line x1="0" y1="25%" riot-x2={ viewBoxX } y2="25%" stroke="#eee" stroke-width="0.25"/>
		<line x1="0" y1="50%" riot-x2={ viewBoxX } y2="50%" stroke="#eee" stroke-width="0.25"/>
		<line x1="0" y1="75%" riot-x2={ viewBoxX } y2="75%" stroke="#eee" stroke-width="0.25"/>
		<line x1="0" y1="100%" riot-x2={ viewBoxX } y2="100%" stroke="#eee" stroke-width="0.5"/>
		<rect
			x="-1" y="-1"
			riot-width={ viewBoxX + 2 } riot-height={ viewBoxY + 2 }
			style="stroke: none; fill: url(#{ gradientId }); mask: url(#{ maskId })"/>
		<polyline
			riot-points={ polylinePoints }
			fill="none"
			stroke="#456267"
			stroke-width="0.5"/>
	</svg>
	<style>
		:scope
			display block

			> svg
				display block
				width 100%
	</style>
	<script>
		import uuid from '../../common/scripts/uuid';

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
