<mk-ui-header-clock>
	<div class="header">
		<time ref="time"></time>
	</div>
	<div class="content">
		<mk-analog-clock></mk-analog-clock>
	</div>
	<style>
		:scope
			display inline-block
			overflow visible

			> .header
				padding 0 12px
				text-align center
				font-size 0.5em

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
		draw() {
			now = new Date!

			yyyy = now.get-full-year!
			mm = (\0 + (now.get-month! + 1)).slice -2
			dd = (\0 + now.get-date!).slice -2
			yyyymmdd = "<span class='yyyymmdd'>#yyyy/#mm/#dd</span>"

			hh = (\0 + now.get-hours!).slice -2
			mm = (\0 + now.get-minutes!).slice -2
			hhmm = "<span class='hhmm'>#hh:#mm</span>"

			if now.get-seconds! % 2 == 0
				hhmm .= replace ':' '<span style=\'visibility:visible\'>:</span>'
			else
				hhmm .= replace ':' '<span style=\'visibility:hidden\'>:</span>'

			this.refs.time.innerHTML = "#yyyymmdd<br>#hhmm"

		this.on('mount', () => {
			@draw!
			this.clock = set-interval @draw, 1000ms

		this.on('unmount', () => {
			clear-interval @clock
	</script>
</mk-ui-header-clock>
