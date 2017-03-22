<mk-drive-folder-selector>
	<div class="body">
		<header>
			<h1>フォルダを選択</h1>
			<button class="close" onclick={ cancel }><i class="fa fa-times"></i></button>
			<button class="ok" onclick={ ok }><i class="fa fa-check"></i></button>
		</header>
		<mk-drive ref="browser" select-folder={ true }></mk-drive>
	</div>
	<style>
		:scope
			display block
			position fixed
			z-index 2048
			top 0
			left 0
			width 100%
			height 100%
			padding 8px
			background rgba(0, 0, 0, 0.2)

			> .body
				width 100%
				height 100%
				background #fff

				> header
					border-bottom solid 1px #eee

					> h1
						margin 0
						padding 0
						text-align center
						line-height 42px
						font-size 1em
						font-weight normal

					> .close
						position absolute
						top 0
						left 0
						line-height 42px
						width 42px

					> .ok
						position absolute
						top 0
						right 0
						line-height 42px
						width 42px

				> mk-drive
					height calc(100% - 42px)
					overflow scroll

	</style>
	<script>
		this.cancel = () => {
			this.trigger('canceled');
			this.unmount();
		};

		this.ok = () => {
			this.trigger('selected', this.refs.browser.folder);
			this.unmount();
		};
	</script>
</mk-drive-folder-selector>
