<template>
<div class="mk-post-form"
	@dragover.prevent.stop="onDragover"
	@dragenter="onDragenter"
	@dragleave="onDragleave"
	@drop.prevent.stop="onDrop"
>
	<div class="content">
		<textarea :class="{ with: (files.length != 0 || poll) }"
			ref="text" v-model="text" :disabled="posting"
			@keydown="onKeydown" @paste="onPaste" :placeholder="placeholder"
			v-autocomplete="'text'"
		></textarea>
		<div class="medias" :class="{ with: poll }" v-show="files.length != 0">
			<x-draggable :list="files" :options="{ animation: 150 }">
				<div v-for="file in files" :key="file.id">
					<div class="img" :style="{ backgroundImage: `url(${file.url}?thumbnail&size=64)` }" :title="file.name"></div>
					<img class="remove" @click="detachMedia(file.id)" src="/assets/desktop/remove.png" title="%i18n:desktop.tags.mk-post-form.attach-cancel%" alt=""/>
				</div>
			</x-draggable>
			<p class="remain">{{ 4 - files.length }}/4</p>
		</div>
		<mk-poll-editor v-if="poll" ref="poll" @destroyed="poll = false" @updated="saveDraft()"/>
	</div>
	<mk-uploader ref="uploader" @uploaded="attachMedia" @change="onChangeUploadings"/>
	<button class="upload" title="%i18n:desktop.tags.mk-post-form.attach-media-from-local%" @click="chooseFile">%fa:upload%</button>
	<button class="drive" title="%i18n:desktop.tags.mk-post-form.attach-media-from-drive%" @click="chooseFileFromDrive">%fa:cloud%</button>
	<button class="kao" title="%i18n:desktop.tags.mk-post-form.insert-a-kao%" @click="kao">%fa:R smile%</button>
	<button class="poll" title="%i18n:desktop.tags.mk-post-form.create-poll%" @click="poll = true">%fa:chart-pie%</button>
	<p class="text-count" :class="{ over: text.length > 1000 }">{{ '%i18n:desktop.tags.mk-post-form.text-remain%'.replace('{}', 1000 - text.length) }}</p>
	<button :class="{ posting }" class="submit" :disabled="!canPost" @click="post">
		{{ posting ? '%i18n:desktop.tags.mk-post-form.posting%' : submitText }}<mk-ellipsis v-if="posting"/>
	</button>
	<input ref="file" type="file" accept="image/*" multiple="multiple" tabindex="-1" @change="onChangeFile"/>
	<div class="dropzone" v-if="draghover"></div>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import * as XDraggable from 'vuedraggable';
import getKao from '../../../common/scripts/get-kao';

export default Vue.extend({
	components: {
		XDraggable
	},
	props: ['reply', 'repost'],
	data() {
		return {
			posting: false,
			text: '',
			files: [],
			uploadings: [],
			poll: false,
			autocomplete: null,
			draghover: false
		};
	},
	computed: {
		draftId(): string {
			return this.repost
				? 'repost:' + this.repost.id
				: this.reply
					? 'reply:' + this.reply.id
					: 'post';
		},
		placeholder(): string {
			return this.repost
				? '%i18n:desktop.tags.mk-post-form.quote-placeholder%'
				: this.reply
					? '%i18n:desktop.tags.mk-post-form.reply-placeholder%'
					: '%i18n:desktop.tags.mk-post-form.post-placeholder%';
		},
		submitText(): string {
			return this.repost
				? '%i18n:desktop.tags.mk-post-form.repost%'
				: this.reply
					? '%i18n:desktop.tags.mk-post-form.reply%'
					: '%i18n:desktop.tags.mk-post-form.post%';
		},
		canPost(): boolean {
			return !this.posting && (this.text.length != 0 || this.files.length != 0 || this.poll || this.repost);
		}
	},
	watch: {
		text() {
			this.saveDraft();
		},
		poll() {
			this.saveDraft();
		},
		files() {
			this.saveDraft();
		}
	},
	mounted() {
		this.$nextTick(() => {
			// 書きかけの投稿を復元
			const draft = JSON.parse(localStorage.getItem('drafts') || '{}')[this.draftId];
			if (draft) {
				this.text = draft.data.text;
				this.files = draft.data.files;
				if (draft.data.poll) {
					this.poll = true;
					this.$nextTick(() => {
						(this.$refs.poll as any).set(draft.data.poll);
					});
				}
				this.$emit('change-attached-media', this.files);
			}
		});
	},
	methods: {
		focus() {
			(this.$refs.text as any).focus();
		},
		chooseFile() {
			(this.$refs.file as any).click();
		},
		chooseFileFromDrive() {
			(this as any).apis.chooseDriveFile({
				multiple: true
			}).then(files => {
				files.forEach(this.attachMedia);
			});
		},
		attachMedia(driveFile) {
			this.files.push(driveFile);
			this.$emit('change-attached-media', this.files);
		},
		detachMedia(id) {
			this.files = this.files.filter(x => x.id != id);
			this.$emit('change-attached-media', this.files);
		},
		onChangeFile() {
			Array.from((this.$refs.file as any).files).forEach(this.upload);
		},
		upload(file) {
			(this.$refs.uploader as any).upload(file);
		},
		onChangeUploadings(uploads) {
			this.$emit('change-uploadings', uploads);
		},
		clear() {
			this.text = '';
			this.files = [];
			this.poll = false;
			this.$emit('change-attached-media', this.files);
		},
		onKeydown(e) {
			if ((e.which == 10 || e.which == 13) && (e.ctrlKey || e.metaKey)) this.post();
		},
		onPaste(e) {
			Array.from(e.clipboardData.items).forEach((item: any) => {
				if (item.kind == 'file') {
					this.upload(item.getAsFile());
				}
			});
		},
		onDragover(e) {
			this.draghover = true;
			e.dataTransfer.dropEffect = e.dataTransfer.effectAllowed == 'all' ? 'copy' : 'move';
		},
		onDragenter(e) {
			this.draghover = true;
		},
		onDragleave(e) {
			this.draghover = false;
		},
		onDrop(e): void {
			this.draghover = false;

			// ファイルだったら
			if (e.dataTransfer.files.length > 0) {
				Array.from(e.dataTransfer.files).forEach(this.upload);
				return;
			}

			// データ取得
			const data = e.dataTransfer.getData('text');
			if (data == null) return;

			try {
				// パース
				const obj = JSON.parse(data);

				// (ドライブの)ファイルだったら
				if (obj.type == 'file') {
					this.files.push(obj.file);
					this.$emit('change-attached-media', this.files);
				}
			} catch (e) {
				// not a json, so noop
			}
		},
		post() {
			this.posting = true;

			(this as any).api('posts/create', {
				text: this.text == '' ? undefined : this.text,
				media_ids: this.files.length > 0 ? this.files.map(f => f.id) : undefined,
				reply_id: this.reply ? this.reply.id : undefined,
				repost_id: this.repost ? this.repost.id : undefined,
				poll: this.poll ? (this.$refs.poll as any).get() : undefined
			}).then(data => {
				this.clear();
				this.deleteDraft();
				this.$emit('posted');
				(this as any).apis.notify(this.repost
					? '%i18n:desktop.tags.mk-post-form.reposted%'
					: this.reply
						? '%i18n:desktop.tags.mk-post-form.replied%'
						: '%i18n:desktop.tags.mk-post-form.posted%');
			}).catch(err => {
				(this as any).apis.notify(this.repost
					? '%i18n:desktop.tags.mk-post-form.repost-failed%'
					: this.reply
						? '%i18n:desktop.tags.mk-post-form.reply-failed%'
						: '%i18n:desktop.tags.mk-post-form.post-failed%');
			}).then(() => {
				this.posting = false;
			});
		},
		saveDraft() {
			const data = JSON.parse(localStorage.getItem('drafts') || '{}');

			data[this.draftId] = {
				updated_at: new Date(),
				data: {
					text: this.text,
					files: this.files,
					poll: this.poll && this.$refs.poll ? (this.$refs.poll as any).get() : undefined
				}
			}

			localStorage.setItem('drafts', JSON.stringify(data));
		},
		deleteDraft() {
			const data = JSON.parse(localStorage.getItem('drafts') || '{}');

			delete data[this.draftId];

			localStorage.setItem('drafts', JSON.stringify(data));
		},
		kao() {
			this.text += getKao();
		}
	}
});
</script>

<style lang="stylus" scoped>
.mk-post-form
	display block
	padding 16px
	background lighten($theme-color, 95%)

	&:after
		content ""
		display block
		clear both

	> .content

		textarea
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

			> div
				padding 4px

				&:after
					content ""
					display block
					clear both

				> div
					float left
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

		> .mk-poll-editor
			background lighten($theme-color, 98%)
			border solid 1px rgba($theme-color, 0.1)
			border-top none
			border-radius 0 0 4px 4px
			transition border-color .3s ease

	> .mk-uploader
		margin 8px 0 0 0
		padding 8px
		border solid 1px rgba($theme-color, 0.2)
		border-radius 4px

	input[type='file']
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

	.submit
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

	.upload
	.drive
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
