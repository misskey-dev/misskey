<mk-home>
	<div class="main">
		<div class="left" ref="left"></div>
		<main>
			<mk-timeline-home-widget ref="tl" if={ mode == 'timeline' }></mk-timeline-home-widget>
			<mk-mentions-home-widget ref="tl" if={ mode == 'mentions' }></mk-mentions-home-widget>
		</main>
		<div class="right" ref="right"></div>
	</div>
	<style type="stylus">
		:scope
			display block

			> .main
				margin 0 auto
				max-width 1200px

				&:after
					content ""
					display block
					clear both

				> *
					float left

					> *
						display block
						//border solid 1px #eaeaea
						border solid 1px rgba(0, 0, 0, 0.075)
						border-radius 6px
						//box-shadow 0px 2px 16px rgba(0, 0, 0, 0.2)

						&:not(:last-child)
							margin-bottom 16px

				> main
					padding 16px
					width calc(100% - 275px * 2)

				> *:not(main)
					width 275px

				> .left
					padding 16px 0 16px 16px

				> .right
					padding 16px 16px 16px 0

				@media (max-width 1100px)
					> *:not(main)
						display none

					> main
						float none
						width 100%
						max-width 700px
						margin 0 auto

	</style>
	<script>
		@mixin \i
		@mode = @opts.mode || \timeline

		# https://github.com/riot/riot/issues/2080
		if @mode == '' then @mode = \timeline

		@home = []

		@on \mount ~>
			@refs.tl.on \loaded ~>
				@trigger \loaded

			@I.data.home.for-each (widget) ~>
				try
					el = document.create-element \mk- + widget.name + \-home-widget
					switch widget.place
						| \left => @refs.left.append-child el
						| \right => @refs.right.append-child el
					@home.push (riot.mount el, do
						id: widget.id
						data: widget.data
					.0)
				catch e
					# noop

		@on \unmount ~>
			@home.for-each (widget) ~>
				widget.unmount!
	</script>
</mk-home>
