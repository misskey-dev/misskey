<mk-drive-file data-is-selected={ isSelected }>
	<a onclick={ onclick } href="/i/drive/file/{ file.id }">
		<div class="container">
			<div class="thumbnail" style={ thumbnail }></div>
			<div class="body">
				<p class="name"><span>{ file.name.lastIndexOf('.') != -1 ? file.name.substr(0, file.name.lastIndexOf('.')) : file.name }</span><span class="ext" if={ file.name.lastIndexOf('.') != -1 }>{ file.name.substr(file.name.lastIndexOf('.')) }</span></p>
				<!--
				if file.tags.length > 0
					ul.tags
						each tag in file.tags
							li.tag(style={background: tag.color, color: contrast(tag.color)})= tag.name
				-->
				<footer>
					<p class="type"><mk-file-type-icon type={ file.type }/>{ file.type }</p>
					<p class="separator"></p>
					<p class="data-size">{ bytesToSize(file.datasize) }</p>
					<p class="separator"></p>
					<p class="created-at">
						%fa:R clock%<mk-time time={ file.created_at }/>
					</p>
				</footer>
			</div>
		</div>
	</a>
	<style>
		:scope
			display block

			> a
				display block
				text-decoration none !important

				*
					user-select none
					pointer-events none

				> .container
					max-width 500px
					margin 0 auto
					padding 16px

					&:after
						content ""
						display block
						clear both

					> .thumbnail
						display block
						float left
						width 64px
						height 64px
						background-size cover
						background-position center center

					> .body
						display block
						float left
						width calc(100% - 74px)
						margin-left 10px

						> .name
							display block
							margin 0
							padding 0
							font-size 0.9em
							font-weight bold
							color #555
							text-overflow ellipsis
							overflow-wrap break-word

							> .ext
								opacity 0.5

						> .tags
							display block
							margin 4px 0 0 0
							padding 0
							list-style none
							font-size 0.5em

							> .tag
								display inline-block
								margin 0 5px 0 0
								padding 1px 5px
								border-radius 2px

						> footer
							display block
							margin 4px 0 0 0
							font-size 0.7em

							> .separator
								display inline
								margin 0
								padding 0 4px
								color #CDCDCD

							> .type
								display inline
								margin 0
								padding 0
								color #9D9D9D

								> mk-file-type-icon
									margin-right 4px

							> .data-size
								display inline
								margin 0
								padding 0
								color #9D9D9D

							> .created-at
								display inline
								margin 0
								padding 0
								color #BDBDBD

								> [data-fa]
									margin-right 2px

			&[data-is-selected]
				background $theme-color

				&, *
					color #fff !important

	</style>
	<script>
		import bytesToSize from '../../../common/scripts/bytes-to-size';
		this.bytesToSize = bytesToSize;

		this.browser = this.parent;
		this.file = this.opts.file;
		this.thumbnail = {
			'background-color': this.file.properties.average_color ? `rgb(${this.file.properties.average_color.join(',')})` : 'transparent',
			'background-image': `url(${this.file.url}?thumbnail&size=128)`
		};
		this.isSelected = this.browser.selectedFiles.some(f => f.id == this.file.id);

		this.browser.on('change-selection', selections => {
			this.isSelected = selections.some(f => f.id == this.file.id);
		});

		this.onclick = ev => {
			ev.preventDefault();
			this.browser.chooseFile(this.file);
			return false;
		};
	</script>
</mk-drive-file>
