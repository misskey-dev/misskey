<mk-drive-chooser>
	<mk-drive-browser ref="browser" multiple={ parent.multiple }/>
	<div>
		<button class="upload" title="PCからドライブにファイルをアップロード" onclick={ upload }><i class="fa fa-upload"></i></button>
		<button class="cancel" onclick={ close }>キャンセル</button>
		<button class="ok" onclick={ parent.ok }>決定</button>
	</div>

	<style>
		:scope
			display block
			height 100%

	</style>
	<script>
		this.multiple = this.opts.multiple != null ? this.opts.multiple : false;

		this.on('mount', () => {
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
</mk-drive-chooser>
