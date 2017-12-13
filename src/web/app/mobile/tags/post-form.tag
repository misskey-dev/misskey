<mk-post-form>
	<header>
		<button class="cancel" onclick={ cancel }>%fa:times%</button>
		<div>
			<span if={ refs.text } class="text-count { over: refs.text.value.length > 1000 }">{ 1000 - refs.text.value.length }</span>
			<button class="submit" onclick={ post }>%i18n:mobile.tags.mk-post-form.submit%</button>
		</div>
	</header>
	<div class="form">
		<mk-post-preview if={ opts.reply } post={ opts.reply }/>
		<textarea ref="text" disabled={ wait } oninput={ update } onkeydown={ onkeydown } onpaste={ onpaste } placeholder={ opts.reply ? '%i18n:mobile.tags.mk-post-form.reply-placeholder%' : '%i18n:mobile.tags.mk-post-form.post-placeholder%' }></textarea>
		<div class="attaches" show={ files.length != 0 }>
			<ul class="files" ref="attaches">
				<li class="file" each={ files } data-id={ id }>
					<div class="img" style="background-image: url({ url + '?thumbnail&size=128' })" onclick={ removeFile }></div>
				</li>
			</ul>
		</div>
		<mk-poll-editor if={ poll } ref="poll" ondestroy={ onPollDestroyed }/>
		<mk-uploader ref="uploader"/>
		<button ref="upload" onclick={ selectFile }>%fa:upload%</button>
		<button ref="drive" onclick={ selectFileFromDrive }>%fa:cloud%</button>
		<button class="kao" onclick={ kao }>%fa:R smile%</button>
		<button class="poll" onclick={ addPoll }>%fa:chart-pie%</button>
		<input ref="file" type="file" accept="image/*" multiple="multiple" onchange={ changeFile }/>
	</div>
	<style>
		:scope
			display block
			max-width 500px
			width calc(100% - 16px)
			margin 8px auto
			background #fff
			border-radius 8px
			box-shadow 0 0 0 1px rgba(0, 0, 0, 0.2)

			@media (min-width 500px)
				margin 16px auto
				width calc(100% - 32px)

			> header
				z-index 1
				height 50px
				box-shadow 0 1px 0 0 rgba(0, 0, 0, 0.1)

				> .cancel
					width 50px
					line-height 50px
					font-size 24px
					color #555

				> div
					position absolute
					top 0
					right 0

					> .text-count
						line-height 50px
						color #657786

					> .submit
						margin 8px
						padding 0 16px
						line-height 34px
						color $theme-color-foreground
						background $theme-color
						border-radius 4px

						&:disabled
							opacity 0.7

			> .form
				max-width 500px
				margin 0 auto

				> mk-post-preview
					padding 16px

				> .attaches

					> .files
						display block
						margin 0
						padding 4px
						list-style none

						&:after
							content ""
							display block
							clear both

						> .file
							display block
							float left
							margin 0
							padding 0
							border solid 4px transparent

							> .img
								width 64px
								height 64px
								background-size cover
								background-position center center

				> mk-uploader
					margin 8px 0 0 0
					padding 8px

				> [ref='file']
					display none

				> [ref='text']
					display block
					padding 12px
					margin 0
					width 100%
					max-width 100%
					min-width 100%
					min-height 80px
					font-size 16px
					color #333
					border none
					border-bottom solid 1px #ddd
					border-radius 0

					&:disabled
						opacity 0.5

				> [ref='upload']
				> [ref='drive']
				.kao
				.poll
					display inline-block
					padding 0
					margin 0
					width 48px
					height 48px
					font-size 20px
					color #657786
					background transparent
					outline none
					border none
					border-radius 0
					box-shadow none

	</style>
	<script>
		import Sortable from 'sortablejs';
		import getKao from '../../common/scripts/get-kao';

		this.mixin('api');

		this.wait = false;
		this.uploadings = [];
		this.files = [];
		this.poll = false;

		this.on('mount', () => {
			this.refs.uploader.on('uploaded', file => {
				this.addFile(file);
			});

			this.refs.uploader.on('change-uploads', uploads => {
				this.trigger('change-uploading-files', uploads);
			});

			this.refs.text.focus();

			new Sortable(this.refs.attaches, {
				animation: 150
			});
		});

		this.onkeydown = e => {
			if ((e.which == 10 || e.which == 13) && (e.ctrlKey || e.metaKey)) this.post();
		};

		this.onpaste = e => {
			Array.from(e.clipboardData.items).forEach(item => {
				if (item.kind == 'file') {
					this.upload(item.getAsFile());
				}
			});
		};

		this.selectFile = () => {
			this.refs.file.click();
		};

		this.selectFileFromDrive = () => {
			const i = riot.mount(document.body.appendChild(document.createElement('mk-drive-selector')), {
				multiple: true
			})[0];
			i.one('selected', files => {
				files.forEach(this.addFile);
			});
		};

		this.changeFile = () => {
			Array.from(this.refs.file.files).forEach(this.upload);
		};

		this.upload = file => {
			this.refs.uploader.upload(file);
		};

		this.addFile = file => {
			file._remove = () => {
				this.files = this.files.filter(x => x.id != file.id);
				this.trigger('change-files', this.files);
				this.update();
			};

			this.files.push(file);
			this.trigger('change-files', this.files);
			this.update();
		};

		this.removeFile = e => {
			const file = e.item;
			this.files = this.files.filter(x => x.id != file.id);
			this.trigger('change-files', this.files);
			this.update();
		};

		this.addPoll = () => {
			this.poll = true;
		};

		this.onPollDestroyed = () => {
			this.update({
				poll: false
			});
		};

		this.post = () => {
			this.update({
				wait: true
			});

			const files = [];

			if (this.files.length > 0) {
				Array.from(this.refs.attaches.children).forEach(el => {
					const id = el.getAttribute('data-id');
					const file = this.files.find(f => f.id == id);
					files.push(file);
				});
			}

			this.api('posts/create', {
				text: this.refs.text.value == '' ? undefined : this.refs.text.value,
				media_ids: this.files.length > 0 ? files.map(f => f.id) : undefined,
				reply_id: opts.reply ? opts.reply.id : undefined,
				poll: this.poll ? this.refs.poll.get() : undefined
			}).then(data => {
				this.trigger('post');
				this.unmount();
			}).catch(err => {
				this.update({
					wait: false
				});
			});
		};

		this.cancel = () => {
			this.trigger('cancel');
			this.unmount();
		};

		this.kao = () => {
			this.refs.text.value += getKao();
		};
	</script>
</mk-post-form>
