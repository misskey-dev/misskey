<template>
<div class="pemppnzi _block"
	@dragover.stop="onDragover"
	@drop.stop="onDrop"
>
	<textarea
		ref="text"
		v-model="text"
		:placeholder="$ts.inputMessageHere"
		@keypress="onKeypress"
		@compositionupdate="onCompositionUpdate"
		@paste="onPaste"
	></textarea>
	<div v-if="file" class="file" @click="file = null">{{ file.name }}</div>
	<button class="send _button" :disabled="!canSend || sending" :title="$ts.send" @click="send">
		<template v-if="!sending"><i class="fas fa-paper-plane"></i></template><template v-if="sending"><i class="fas fa-spinner fa-pulse fa-fw"></i></template>
	</button>
	<button class="_button" @click="chooseFile"><i class="fas fa-photo-video"></i></button>
	<button class="_button" @click="insertEmoji"><i class="fas fa-laugh-squint"></i></button>
	<input ref="file" type="file" @change="onChangeFile"/>
</div>
</template>

<script lang="ts">
import { defineComponent, defineAsyncComponent } from 'vue';
import insertTextAtCursor from 'insert-text-at-cursor';
import * as autosize from 'autosize';
import { formatTimeString } from '@/scripts/format-time-string';
import { selectFile } from '@/scripts/select-file';
import * as os from '@/os';
import { Autocomplete } from '@/scripts/autocomplete';
import { throttle } from 'throttle-debounce';

export default defineComponent({
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
			sending: false,
			typing: throttle(3000, () => {
				os.stream.send('typingOnMessaging', this.user ? { partner: this.user.id } : { group: this.group.id });
			}),
		};
	},
	computed: {
		draftKey(): string {
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
		}
	},
	mounted() {
		autosize(this.$refs.text);

		// TODO: detach when unmount
		new Autocomplete(this.$refs.text, this, { model: 'text' });

		// 書きかけの投稿を復元
		const draft = JSON.parse(localStorage.getItem('message_drafts') || '{}')[this.draftKey];
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
					const formatted = `${formatTimeString(new Date(file.lastModified), this.$store.state.pastedFileName).replace(/{{number}}/g, '1')}${ext}`;
					if (formatted) this.upload(file, formatted);
				}
			} else {
				if (items[0].kind == 'file') {
					os.alert({
						type: 'error',
						text: this.$ts.onlyOneFileCanBeAttached
					});
				}
			}
		},

		onDragover(e) {
			const isFile = e.dataTransfer.items[0].kind == 'file';
			const isDriveFile = e.dataTransfer.types[0] == _DATA_TRANSFER_DRIVE_FILE_;
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
				os.alert({
					type: 'error',
					text: this.$ts.onlyOneFileCanBeAttached
				});
				return;
			}

			//#region ドライブのファイル
			const driveFile = e.dataTransfer.getData(_DATA_TRANSFER_DRIVE_FILE_);
			if (driveFile != null && driveFile != '') {
				this.file = JSON.parse(driveFile);
				e.preventDefault();
			}
			//#endregion
		},

		onKeypress(e) {
			this.typing();
			if ((e.which == 10 || e.which == 13) && (e.ctrlKey || e.metaKey) && this.canSend) {
				this.send();
			}
		},

		onCompositionUpdate() {
			this.typing();
		},

		chooseFile(e) {
			selectFile(e.currentTarget || e.target, this.$ts.selectFile).then(file => {
				this.file = file;
			});
		},

		onChangeFile() {
			this.upload((this.$refs.file as any).files[0]);
		},

		upload(file: File, name?: string) {
			os.upload(file, this.$store.state.uploadFolder, name).then(res => {
				this.file = res;
			});
		},

		send() {
			this.sending = true;
			os.api('messaging/messages/create', {
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

			data[this.draftKey] = {
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

			delete data[this.draftKey];

			localStorage.setItem('message_drafts', JSON.stringify(data));
		},

		async insertEmoji(ev) {
			os.openEmojiPicker(ev.currentTarget || ev.target, {}, this.$refs.text);
		}
	}
});
</script>

<style lang="scss" scoped>
.pemppnzi {
	position: relative;

	> textarea {
		cursor: auto;
		display: block;
		width: 100%;
		min-width: 100%;
		max-width: 100%;
		height: 80px;
		margin: 0;
		padding: 16px 16px 0 16px;
		resize: none;
		font-size: 1em;
		font-family: inherit;
		outline: none;
		border: none;
		border-radius: 0;
		box-shadow: none;
		background: transparent;
		box-sizing: border-box;
		color: var(--fg);
	}

	> .file {
		padding: 8px;
		color: #444;
		background: #eee;
		cursor: pointer;
	}

	> .send {
		position: absolute;
		bottom: 0;
		right: 0;
		margin: 0;
		padding: 16px;
		font-size: 1em;
		transition: color 0.1s ease;
		color: var(--accent);

		&:active {
			color: var(--accentDarken);
			transition: color 0s ease;
		}
	}

	.files {
		display: block;
		margin: 0;
		padding: 0 8px;
		list-style: none;

		&:after {
			content: '';
			display: block;
			clear: both;
		}

		> li {
			display: block;
			float: left;
			margin: 4px;
			padding: 0;
			width: 64px;
			height: 64px;
			background-color: #eee;
			background-repeat: no-repeat;
			background-position: center center;
			background-size: cover;
			cursor: move;

			&:hover {
				> .remove {
					display: block;
				}
			}

			> .remove {
				display: none;
				position: absolute;
				right: -6px;
				top: -6px;
				margin: 0;
				padding: 0;
				background: transparent;
				outline: none;
				border: none;
				border-radius: 0;
				box-shadow: none;
				cursor: pointer;
			}
		}
	}

	._button {
		margin: 0;
		padding: 16px;
		font-size: 1em;
		font-weight: normal;
		text-decoration: none;
		transition: color 0.1s ease;

		&:hover {
			color: var(--accent);
		}

		&:active {
			color: var(--accentDarken);
			transition: color 0s ease;
		}
	}

	input[type=file] {
		display: none;
	}
}
</style>
