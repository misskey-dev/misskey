<template>
<div class="mk-messaging-form"
	@dragover.stop="onDragover"
	@drop.stop="onDrop"
>
	<textarea
		v-model="text"
		ref="textarea"
		@keypress="onKeypress"
		@paste="onPaste"
		placeholder="%i18n:common.input-message-here%"
		v-autocomplete="'text'"
	></textarea>
	<div class="file" @click="file = null" v-if="file">{{ file.name }}</div>
	<mk-uploader ref="uploader" @uploaded="onUploaded"/>
	<button class="send" @click="send" :disabled="!canSend || sending" title="%i18n:common.send%">
		<template v-if="!sending">%fa:paper-plane%</template><template v-if="sending">%fa:spinner .spin%</template>
	</button>
	<button class="attach-from-local" @click="chooseFile" title="%i18n:common.tags.mk-messaging-form.attach-from-local%">
		%fa:upload%
	</button>
	<button class="attach-from-drive" @click="chooseFileFromDrive" title="%i18n:common.tags.mk-messaging-form.attach-from-drive%">
		%fa:R folder-open%
	</button>
	<input ref="file" type="file" @change="onChangeFile"/>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import * as autosize from 'autosize';

export default Vue.extend({
	props: ['user'],
	data() {
		return {
			text: null,
			file: null,
			sending: false
		};
	},
	computed: {
		draftId(): string {
			return this.user.id;
		},
		canSend(): boolean {
			return (this.text != null && this.text != '') || this.file != null;
		},
		room(): any {
			return this.$parent;
		}
	},
	watch: {
		text() {
			this.saveDraft();
		},
		file() {
			this.saveDraft();

			if (this.room.isBottom()) {
				this.room.scrollToBottom();
			}
		}
	},
	mounted() {
		autosize(this.$refs.textarea);

		// 書きかけの投稿を復元
		const draft = JSON.parse(localStorage.getItem('message_drafts') || '{}')[this.draftId];
		if (draft) {
			this.text = draft.data.text;
			this.file = draft.data.file;
		}
	},
	methods: {
		onPaste(e) {
			const data = e.clipboardData;
			const items = data.items;

			if (items.length == 1) {
				if (items[0].kind == 'file') {
					this.upload(items[0].getAsFile());
				}
			} else {
				if (items[0].kind == 'file') {
					alert('メッセージに添付できるのはひとつのファイルのみです');
				}
			}
		},

		onDragover(e) {
			const isFile = e.dataTransfer.items[0].kind == 'file';
			const isDriveFile = e.dataTransfer.types[0] == 'mk_drive_file';
			if (isFile || isDriveFile) {
				e.preventDefault();
				e.dataTransfer.dropEffect = e.dataTransfer.effectAllowed == 'all' ? 'copy' : 'move';
			}
		},

		onDrop(e): void {
			// ファイルだったら
			if (e.dataTransfer.files.length == 1) {
				e.preventDefault();
				this.upload(e.dataTransfer.files[0]);
				return;
			} else if (e.dataTransfer.files.length > 1) {
				e.preventDefault();
				alert('メッセージに添付できるのはひとつのファイルのみです');
				return;
			}

			//#region ドライブのファイル
			const driveFile = e.dataTransfer.getData('mk_drive_file');
			if (driveFile != null && driveFile != '') {
				this.file = JSON.parse(driveFile);
				e.preventDefault();
			}
			//#endregion
		},

		onKeypress(e) {
			if ((e.which == 10 || e.which == 13) && e.ctrlKey) {
				this.send();
			}
		},

		chooseFile() {
			(this.$refs.file as any).click();
		},

		chooseFileFromDrive() {
			(this as any).apis.chooseDriveFile({
				multiple: false
			}).then(file => {
				this.file = file;
			});
		},

		onChangeFile() {
			this.upload((this.$refs.file as any).files[0]);
		},

		upload(file) {
			(this.$refs.uploader as any).upload(file);
		},

		onUploaded(file) {
			this.file = file;
		},

		send() {
			this.sending = true;
			(this as any).api('messaging/messages/create', {
				user_id: this.user.id,
				text: this.text ? this.text : undefined,
				file_id: this.file ? this.file.id : undefined
			}).then(message => {
				this.clear();
			}).catch(err => {
				console.error(err);
			}).then(() => {
				this.sending = false;
			});
		},

		clear() {
			this.text = '';
			this.file = null;
			this.deleteDraft();
		},

		saveDraft() {
			const data = JSON.parse(localStorage.getItem('message_drafts') || '{}');

			data[this.draftId] = {
				updated_at: new Date(),
				data: {
					text: this.text,
					file: this.file
				}
			}

			localStorage.setItem('message_drafts', JSON.stringify(data));
		},

		deleteDraft() {
			const data = JSON.parse(localStorage.getItem('message_drafts') || '{}');

			delete data[this.draftId];

			localStorage.setItem('message_drafts', JSON.stringify(data));
		},
	}
});
</script>

<style lang="stylus" scoped>
.mk-messaging-form
	> textarea
		cursor auto
		display block
		width 100%
		min-width 100%
		max-width 100%
		height 64px
		margin 0
		padding 8px
		resize none
		font-size 1em
		color #000
		outline none
		border none
		border-top solid 1px #eee
		border-radius 0
		box-shadow none
		background transparent

	> .file
		padding 8px
		color #444
		background #eee
		cursor pointer

	> .send
		position absolute
		bottom 0
		right 0
		margin 0
		padding 10px 14px
		font-size 1em
		color #aaa
		transition color 0.1s ease

		&:hover
			color $theme-color

		&:active
			color darken($theme-color, 10%)
			transition color 0s ease

	.files
		display block
		margin 0
		padding 0 8px
		list-style none

		&:after
			content ''
			display block
			clear both

		> li
			display block
			float left
			margin 4px
			padding 0
			width 64px
			height 64px
			background-color #eee
			background-repeat no-repeat
			background-position center center
			background-size cover
			cursor move

			&:hover
				> .remove
					display block

			> .remove
				display none
				position absolute
				right -6px
				top -6px
				margin 0
				padding 0
				background transparent
				outline none
				border none
				border-radius 0
				box-shadow none
				cursor pointer

	.attach-from-local
	.attach-from-drive
		margin 0
		padding 10px 14px
		font-size 1em
		font-weight normal
		text-decoration none
		color #aaa
		transition color 0.1s ease

		&:hover
			color $theme-color

		&:active
			color darken($theme-color, 10%)
			transition color 0s ease

	input[type=file]
		display none

</style>
