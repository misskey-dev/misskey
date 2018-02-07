<mk-selectdrive-page>
	<header>
		<h1>%i18n:mobile.tags.mk-selectdrive-page.select-file%<span class="count" if={ files.length > 0 }>({ files.length })</span></h1>
		<button class="upload" @click="upload">%fa:upload%</button>
		<button if={ multiple } class="ok" @click="ok">%fa:check%</button>
	</header>
	<mk-drive ref="browser" select-file={ true } multiple={ multiple } is-naked={ true } top={ 42 }/>

	<style>
		:scope
			display block
			width 100%
			height 100%
			background #fff

			> header
				position fixed
				top 0
				left 0
				width 100%
				z-index 1000
				background #fff
				box-shadow 0 1px rgba(0, 0, 0, 0.1)

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
				top 42px

	</style>
	<script>
		const q = (new URL(location)).searchParams;
		this.multiple = q.get('multiple') == 'true' ? true : false;

		this.on('mount', () => {
			document.documentElement.style.background = '#fff';

			this.$refs.browser.on('selected', file => {
				this.files = [file];
				this.ok();
			});

			this.$refs.browser.on('change-selection', files => {
				this.update({
					files: files
				});
			});
		});

		this.upload = () => {
			this.$refs.browser.selectLocalFile();
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
