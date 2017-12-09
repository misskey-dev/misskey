<mk-drive-folder>
	<a onclick={ onclick } href="/i/drive/folder/{ folder.id }">
		<div class="container">
			<p class="name">%fa:folder%{ folder.name }</p>%fa:angle-right%
		</div>
	</a>
	<style>
		:scope
			display block

			> a
				display block
				color #777
				text-decoration none !important

				*
					user-select none
					pointer-events none

				> .container
					max-width 500px
					margin 0 auto
					padding 16px

					> .name
						display block
						margin 0
						padding 0

						> [data-fa]
							margin-right 6px

					> [data-fa]
						position absolute
						top 0
						bottom 0
						right 8px
						margin auto 0 auto 0
						width 1em
						height 1em

						> *
							vertical-align initial

	</style>
	<script>
		this.browser = this.parent;
		this.folder = this.opts.folder;

		this.onclick = ev => {
			ev.preventDefault();
			this.browser.cd(this.folder);
			return false;
		};
	</script>
</mk-drive-folder>
