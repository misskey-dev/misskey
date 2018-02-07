<mk-post-form ondragover={ ondragover } ondragenter={ ondragenter } ondragleave={ ondragleave } ondrop={ ondrop }>
	<div class="content">
		<textarea class={ with: (files.length != 0 || poll) } ref="text" disabled={ wait } oninput={ update } onkeydown={ onkeydown } onpaste={ onpaste } placeholder={ placeholder }></textarea>
		<div class="medias { with: poll }" show={ files.length != 0 }>
			<ul ref="media">
				<li each={ files } data-id={ id }>
					<div class="img" style="background-image: url({ url + '?thumbnail&size=64' })" title={ name }></div>
					<img class="remove" @click="removeFile" src="/assets/desktop/remove.png" title="%i18n:desktop.tags.mk-post-form.attach-cancel%" alt=""/>
				</li>
			</ul>
			<p class="remain">{ 4 - files.length }/4</p>
		</div>
		<mk-poll-editor if={ poll } ref="poll" ondestroy={ onPollDestroyed }/>
	</div>
	<mk-uploader ref="uploader"/>
	<button ref="upload" title="%i18n:desktop.tags.mk-post-form.attach-media-from-local%" @click="selectFile">%fa:upload%</button>
	<button ref="drive" title="%i18n:desktop.tags.mk-post-form.attach-media-from-drive%" @click="selectFileFromDrive">%fa:cloud%</button>
	<button class="kao" title="%i18n:desktop.tags.mk-post-form.insert-a-kao%" @click="kao">%fa:R smile%</button>
	<button class="poll" title="%i18n:desktop.tags.mk-post-form.create-poll%" @click="addPoll">%fa:chart-pie%</button>
	<p class="text-count { over: refs.text.value.length > 1000 }">{ '%i18n:desktop.tags.mk-post-form.text-remain%'.replace('{}', 1000 - refs.text.value.length) }</p>
	<button class={ wait: wait } ref="submit" disabled={ wait || (refs.text.value.length == 0 && files.length == 0 && !poll　&& !repost) } @click="post">
		{ wait ? '%i18n:desktop.tags.mk-post-form.posting%' : submitText }<mk-ellipsis if={ wait }/>
	</button>
	<input ref="file" type="file" accept="image/*" multiple="multiple" tabindex="-1" onchange={ changeFile }/>
	<div class="dropzone" if={ draghover }></div>
	<style>
		:scope
			display block
			padding 16px
			background lighten($theme-color, 95%)

			&:after
				content ""
				display block
				clear both

			> .content

				[ref='text']
					display block
					padding 12px
					margin 0
					width 100%
					max-width 100%
					min-width 100%
					min-height calc(16px + 12px + 12px)
					font-size 16px
					color #333
					background #fff
					outline none
					border solid 1px rgba($theme-color, 0.1)
					border-radius 4px
					transition border-color .3s ease

					&:hover
						border-color rgba($theme-color, 0.2)
						transition border-color .1s ease

						& + *
						& + * + *
							border-color rgba($theme-color, 0.2)
							transition border-color .1s ease

					&:focus
						color $theme-color
						border-color rgba($theme-color, 0.5)
						transition border-color 0s ease

						& + *
						& + * + *
							border-color rgba($theme-color, 0.5)
							transition border-color 0s ease

					&:disabled
						opacity 0.5

					&::-webkit-input-placeholder
						color rgba($theme-color, 0.3)

					&.with
						border-bottom solid 1px rgba($theme-color, 0.1) !important
						border-radius 4px 4px 0 0

				> .medias
					margin 0
					padding 0
					background lighten($theme-color, 98%)
					border solid 1px rgba($theme-color, 0.1)
					border-top none
					border-radius 0 0 4px 4px
					transition border-color .3s ease

					&.with
						border-bottom solid 1px rgba($theme-color, 0.1) !important
						border-radius 0

					> .remain
						display block
						position absolute
						top 8px
						right 8px
						margin 0
						padding 0
						color rgba($theme-color, 0.4)

					> ul
						display block
						margin 0
						padding 4px
						list-style none

						&:after
							content ""
							display block
							clear both

						> li
							display block
							float left
							margin 0
							padding 0
							border solid 4px transparent
							cursor move

							&:hover > .remove
								display block

							> .img
								width 64px
								height 64px
								background-size cover
								background-position center center

							> .remove
								display none
								position absolute
								top -6px
								right -6px
								width 16px
								height 16px
								cursor pointer

				> mk-poll-editor
					background lighten($theme-color, 98%)
					border solid 1px rgba($theme-color, 0.1)
					border-top none
					border-radius 0 0 4px 4px
					transition border-color .3s ease

			> mk-uploader
				margin 8px 0 0 0
				padding 8px
				border solid 1px rgba($theme-color, 0.2)
				border-radius 4px

			[ref='file']
				display none

			.text-count
				pointer-events none
				display block
				position absolute
				bottom 16px
				right 138px
				margin 0
				line-height 40px
				color rgba($theme-color, 0.5)

				&.over
					color #ec3828

			[ref='submit']
				display block
				position absolute
				bottom 16px
				right 16px
				cursor pointer
				padding 0
				margin 0
				width 110px
				height 40px
				font-size 1em
				color $theme-color-foreground
				background linear-gradient(to bottom, lighten($theme-color, 25%) 0%, lighten($theme-color, 10%) 100%)
				outline none
				border solid 1px lighten($theme-color, 15%)
				border-radius 4px

				&:not(:disabled)
					font-weight bold

				&:hover:not(:disabled)
					background linear-gradient(to bottom, lighten($theme-color, 8%) 0%, darken($theme-color, 8%) 100%)
					border-color $theme-color

				&:active:not(:disabled)
					background $theme-color
					border-color $theme-color

				&:focus
					&:after
						content ""
						pointer-events none
						position absolute
						top -5px
						right -5px
						bottom -5px
						left -5px
						border 2px solid rgba($theme-color, 0.3)
						border-radius 8px

				&:disabled
					opacity 0.7
					cursor default

				&.wait
					background linear-gradient(
						45deg,
						darken($theme-color, 10%) 25%,
						$theme-color              25%,
						$theme-color              50%,
						darken($theme-color, 10%) 50%,
						darken($theme-color, 10%) 75%,
						$theme-color              75%,
						$theme-color
					)
					background-size 32px 32px
					animation stripe-bg 1.5s linear infinite
					opacity 0.7
					cursor wait

					@keyframes stripe-bg
						from {background-position: 0 0;}
						to   {background-position: -64px 32px;}

			[ref='upload']
			[ref='drive']
			.kao
			.poll
				display inline-block
				cursor pointer
				padding 0
				margin 8px 4px 0 0
				width 40px
				height 40px
				font-size 1em
				color rgba($theme-color, 0.5)
				background transparent
				outline none
				border solid 1px transparent
				border-radius 4px

				&:hover
					background transparent
					border-color rgba($theme-color, 0.3)

				&:active
					color rgba($theme-color, 0.6)
					background linear-gradient(to bottom, lighten($theme-color, 80%) 0%, lighten($theme-color, 90%) 100%)
					border-color rgba($theme-color, 0.5)
					box-shadow 0 2px 4px rgba(0, 0, 0, 0.15) inset

				&:focus
					&:after
						content ""
						pointer-events none
						position absolute
						top -5px
						right -5px
						bottom -5px
						left -5px
						border 2px solid rgba($theme-color, 0.3)
						border-radius 8px

			> .dropzone
				position absolute
				left 0
				top 0
				width 100%
				height 100%
				border dashed 2px rgba($theme-color, 0.5)
				pointer-events none

	</style>
	<script>
		import Sortable from 'sortablejs';
		import getKao from '../../common/scripts/get-kao';
		import notify from '../scripts/notify';
		import Autocomplete from '../scripts/autocomplete';

		this.mixin('api');

		this.wait = false;
		this.uploadings = [];
		this.files = [];
		this.autocomplete = null;
		this.poll = false;

		this.inReplyToPost = this.opts.reply;

		this.repost = this.opts.repost;

		this.placeholder = this.repost
			? '%i18n:desktop.tags.mk-post-form.quote-placeholder%'
			: this.inReplyToPost
				? '%i18n:desktop.tags.mk-post-form.reply-placeholder%'
				: '%i18n:desktop.tags.mk-post-form.post-placeholder%';

		this.submitText = this.repost
			? '%i18n:desktop.tags.mk-post-form.repost%'
			: this.inReplyToPost
				? '%i18n:desktop.tags.mk-post-form.reply%'
				: '%i18n:desktop.tags.mk-post-form.post%';

		this.draftId = this.repost
			? 'repost:' + this.repost.id
			: this.inReplyToPost
				? 'reply:' + this.inReplyToPost.id
				: 'post';

		this.on('mount', () => {
			this.refs.uploader.on('uploaded', file => {
				this.addFile(file);
			});

			this.refs.uploader.on('change-uploads', uploads => {
				this.trigger('change-uploading-files', uploads);
			});

			this.autocomplete = new Autocomplete(this.refs.text);
			this.autocomplete.attach();

			// 書きかけの投稿を復元
			const draft = JSON.parse(localStorage.getItem('drafts') || '{}')[this.draftId];
			if (draft) {
				this.refs.text.value = draft.data.text;
				this.files = draft.data.files;
				if (draft.data.poll) {
					this.poll = true;
					this.update();
					this.refs.poll.set(draft.data.poll);
				}
				this.trigger('change-files', this.files);
				this.update();
			}

			new Sortable(this.refs.media, {
				animation: 150
			});
		});

		this.on('unmount', () => {
			this.autocomplete.detach();
		});

		this.focus = () => {
			this.refs.text.focus();
		};

		this.clear = () => {
			this.refs.text.value = '';
			this.files = [];
			this.poll = false;
			this.trigger('change-files');
			this.update();
		};

		this.ondragover = e => {
			e.preventDefault();
			e.stopPropagation();
			this.draghover = true;
			e.dataTransfer.dropEffect = e.dataTransfer.effectAllowed == 'all' ? 'copy' : 'move';
		};

		this.ondragenter = e => {
			this.draghover = true;
		};

		this.ondragleave = e => {
			this.draghover = false;
		};

		this.ondrop = e => {
			e.preventDefault();
			e.stopPropagation();
			this.draghover = false;

			// ファイルだったら
			if (e.dataTransfer.files.length > 0) {
				Array.from(e.dataTransfer.files).forEach(this.upload);
				return;
			}

			// データ取得
			const data = e.dataTransfer.getData('text');
			if (data == null) return false;

			try {
				// パース
				const obj = JSON.parse(data);

				// (ドライブの)ファイルだったら
				if (obj.type == 'file') {
					this.files.push(obj.file);
					this.update();
				}
			} catch (e) {

			}
		};

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
			const i = riot.mount(document.body.appendChild(document.createElement('mk-select-file-from-drive-window')), {
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

		this.post = e => {
			this.wait = true;

			const files = [];

			if (this.files.length > 0) {
				Array.from(this.refs.media.children).forEach(el => {
					const id = el.getAttribute('data-id');
					const file = this.files.find(f => f.id == id);
					files.push(file);
				});
			}

			this.api('posts/create', {
				text: this.refs.text.value == '' ? undefined : this.refs.text.value,
				media_ids: this.files.length > 0 ? files.map(f => f.id) : undefined,
				reply_id: this.inReplyToPost ? this.inReplyToPost.id : undefined,
				repost_id: this.repost ? this.repost.id : undefined,
				poll: this.poll ? this.refs.poll.get() : undefined
			}).then(data => {
				this.clear();
				this.removeDraft();
				this.trigger('post');
				notify(this.repost
					? '%i18n:desktop.tags.mk-post-form.reposted%'
					: this.inReplyToPost
						? '%i18n:desktop.tags.mk-post-form.replied%'
						: '%i18n:desktop.tags.mk-post-form.posted%');
			}).catch(err => {
				notify(this.repost
					? '%i18n:desktop.tags.mk-post-form.repost-failed%'
					: this.inReplyToPost
						? '%i18n:desktop.tags.mk-post-form.reply-failed%'
						: '%i18n:desktop.tags.mk-post-form.post-failed%');
			}).then(() => {
				this.update({
					wait: false
				});
			});
		};

		this.kao = () => {
			this.refs.text.value += getKao();
		};

		this.on('update', () => {
			this.saveDraft();
		});

		this.saveDraft = () => {
			const data = JSON.parse(localStorage.getItem('drafts') || '{}');

			data[this.draftId] = {
				updated_at: new Date(),
				data: {
					text: this.refs.text.value,
					files: this.files,
					poll: this.poll && this.refs.poll ? this.refs.poll.get() : undefined
				}
			}

			localStorage.setItem('drafts', JSON.stringify(data));
		};

		this.removeDraft = () => {
			const data = JSON.parse(localStorage.getItem('drafts') || '{}');

			delete data[this.draftId];

			localStorage.setItem('drafts', JSON.stringify(data));
		};
	</script>
</mk-post-form>
