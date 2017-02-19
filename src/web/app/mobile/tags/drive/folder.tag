<mk-drive-folder onclick={ onclick }>
	<div class="container">
		<p class="name"><i class="fa fa-folder"></i>{ folder.name }</p><i class="fa fa-angle-right"></i>
	</div>
	<style>
		:scope
			display block
			color #777

			&, *
				user-select none

			*
				pointer-events none

			> .container
				max-width 500px
				margin 0 auto
				padding 16px

				> .name
					display block
					margin 0
					padding 0

					> i
						margin-right 6px

				> i
					position absolute
					top 0
					bottom 0
					right 8px
					margin auto 0 auto 0
					width 1em
					height 1em

	</style>
	<script>
		@browser = @parent
		@folder = @opts.folder

		@onclick = ~>
			@browser.move @folder
	</script>
</mk-drive-folder>
