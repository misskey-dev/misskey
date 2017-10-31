<mk-selectdrive-page>
	<header>
		<h1>%i18n:mobile.tags.mk-selectdrive-page.select-file%<span class="count" if={ files.length > 0 }>({ files.length })</span></h1>
		<button class="upload" onclick={ upload }><i class="fa fa-upload"></i></button>
		<button if={ multiple } class="ok" onclick={ ok }><i class="fa fa-check"></i></button>
	</header>
	<mk-drive ref="browser" select-file={ true } multiple={ multiple }/>

	<style>
		:scope
			display block
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

					> .count
						margin-left 4px
						opacity 0.5

				> .upload
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
				-webkit-overflow-scrolling touch

	</style>
	<script>
		const q = (new URL(location)).searchParams;
		this.multiple = q.get('multiple') == 'true' ? true : false;

		this.on('mount', () => {
			document.documentElement.style.background = '#fff';

			this.refs.browser.on('selected', file => {
				this.files = [file];
				this.ok();
			});

			this.refs.browser.on('change-selection', files => {
				this.update({
					files: files
				});
			});
		});

		this.upload = () => {
			this.refs.browser.selectLocalFile();
		};

		this.close = () => {
			window.close();
		};

		this.ok = () => {
			window.opener.cb(this.multiple ? this.files : this.files[0]);
			window.close();
		};
	</script>
</mk-selectdrive-page>
