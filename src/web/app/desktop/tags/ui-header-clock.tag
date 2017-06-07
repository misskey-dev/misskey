<mk-ui-header-clock>
	<div class="header">
		<time ref="time">
			<span class="yyyymmdd">{ yyyy }/{ mm }/{ dd }</span>
			<br>
			<span class="hhnn">{ hh }<span style="visibility:{ now.getSeconds() % 2 == 0 ? 'visible' : 'hidden' }">:</span>{ nn }</span>
		</time>
	</div>
	<div class="content">
		<mk-analog-clock/>
	</div>
	<style>
		:scope
			display inline-block
			overflow visible

			> .header
				padding 0 12px
				text-align center
				font-size 10px

				&, *
					cursor: default

				&:hover
					background #899492

					& + .content
						visibility visible

					> time
						color #fff !important

						*
							color #fff !important

				&:after
					content ""
					display block
					clear both

				> time
					display table-cell
					vertical-align middle
					height 48px
					color #9eaba8

					> .yyyymmdd
						opacity 0.7

			> .content
				visibility hidden
				display block
				position absolute
				top auto
				right 0
				z-index 3
				margin 0
				padding 0
				width 256px
				background #899492

	</style>
	<script>
		this.now = new Date();

		this.draw = () => {
			const now = this.now = new Date();
			this.yyyy = now.getFullYear();
			this.mm = ('0' + (now.getMonth() + 1)).slice(-2);
			this.dd = ('0' + now.getDate()).slice(-2);
			this.hh = ('0' + now.getHours()).slice(-2);
			this.nn = ('0' + now.getMinutes()).slice(-2);
			this.update();
		};

		this.on('mount', () => {
			this.draw();
			this.clock = setInterval(this.draw, 1000);
		});

		this.on('unmount', () => {
			clearInterval(this.clock);
		});
	</script>
</mk-ui-header-clock>
