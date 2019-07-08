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
		:placeholder="$t('input-message-here')"
		v-autocomplete="{ model: 'text' }"
	></textarea>
	<div class="file" @click="file = null" v-if="file">{{ file.name }}</div>
	<mk-uploader ref="uploader" @uploaded="onUploaded"/>
	<button class="send" @click="send" :disabled="!canSend || sending" :title="$t('send')">
		<template v-if="!sending"><fa icon="paper-plane"/></template><template v-if="sending"><fa icon="spinner .spin"/></template>
	</button>
	<button class="attach-from-local" @click="chooseFile" :title="$t('attach-from-local')">
		<fa icon="upload"/>
	</button>
	<button class="attach-from-drive" @click="chooseFileFromDrive" :title="$t('attach-from-drive')">
		<fa :icon="['far', 'folder-open']"/>
	</button>
	<input ref="file" type="file" @change="onChangeFile"/>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import i18n from '../../../i18n';
import * as autosize from 'autosize';
import { formatTimeString } from '../../../../../misc/format-time-string';

export default Vue.extend({
	i18n: i18n('common/views/components/messaging-room.form.vue'),
	props: {
		user: {
			type: Object,
			requird: false,
		},
		group: {
			type: Object,
			requird: false,
		},
	},
	data() {
		return {
			text: null,
			file: null,
			sending: false
		};
	},
	computed: {
		draftId(): string {
			return this.user ? 'user:' + this.user.id : 'group:' + this.group.id;
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
		async onPaste(e: ClipboardEvent) {
			const data = e.clipboardData;
			const items = data.items;

			if (items.length == 1) {
				if (items[0].kind == 'file') {
					const file = items[0].getAsFile();
					const lio = file.name.lastIndexOf('.');
					const ext = lio >= 0 ? file.name.slice(lio) : '';
					const formatted = `${formatTimeString(new Date(file.lastModified), this.$store.state.settings.pastedFileName).replace(/{{number}}/g, '1')}${ext}`;
					const name = this.$store.state.settings.pasteDialog
						? await this.$root.dialog({
							title: this.$t('@.post-form.enter-file-name'),
							input: {
								default: formatted
							},
							allowEmpty: false
						}).then(({ canceled, result }) => canceled ? false : result)
						: formatted;
					if (name) this.upload(file, name);
				}
			} else {
				if (items[0].kind == 'file') {
					this.$root.dialog({
						type: 'error',
						text: this.$t('only-one-file-attached')
					});
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
				this.$root.dialog({
					type: 'error',
					text: this.$t('only-one-file-attached')
				});
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
			if ((e.which == 10 || e.which == 13) && e.ctrlKey && this.canSend) {
				this.send();
			}
		},

		chooseFile() {
			(this.$refs.file as any).click();
		},

		chooseFileFromDrive() {
			this.$chooseDriveFile({
				multiple: false
			}).then(file => {
				this.file = file;
			});
		},

		onChangeFile() {
			this.upload((this.$refs.file as any).files[0]);
		},

		upload(file: File, name?: string) {
			(this.$refs.uploader as any).upload(file, this.$store.state.settings.uploadFolder, name);
		},

		onUploaded(file) {
			this.file = file;
		},

		send() {
			this.sending = true;
			this.$root.api('messaging/messages/create', {
				userId: this.user ? this.user.id : undefined,
				groupId: this.group ? this.group.id : undefined,
				text: this.text ? this.text : undefined,
				fileId: this.file ? this.file.id : undefined
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
				updatedAt: new Date(),
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
		color var(--inputText)
		outline none
		border none
		border-top solid 1px var(--faceDivider)
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
			color var(--primary)

		&:active
			color var(--primaryDarken10)
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
			color var(--primary)

		&:active
			color var(--primaryDarken10)
			transition color 0s ease

	input[type=file]
		display none

</style>
