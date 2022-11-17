<template>
<div
	class="pemppnzi _block"
	@dragover.stop="onDragover"
	@drop.stop="onDrop"
>
	<textarea
		ref="textEl"
		v-model="text"
		:placeholder="i18n.ts.inputMessageHere"
		@keydown="onKeydown"
		@compositionupdate="onCompositionUpdate"
		@paste="onPaste"
	></textarea>
	<footer>
		<div v-if="file" class="file" @click="file = null">{{ file.name }}</div>
		<div class="buttons">
			<button class="_button" @click="chooseFile"><i class="fas fa-photo-video"></i></button>
			<button class="_button" @click="insertEmoji"><i class="fas fa-laugh-squint"></i></button>
			<button class="send _button" :disabled="!canSend || sending" :title="i18n.ts.send" @click="send">
				<template v-if="!sending"><i class="fas fa-paper-plane"></i></template><template v-if="sending"><i class="fas fa-spinner fa-pulse fa-fw"></i></template>
			</button>
		</div>
	</footer>
	<input ref="fileEl" type="file" @change="onChangeFile"/>
</div>
</template>

<script lang="ts" setup>
import { onMounted, watch } from 'vue';
import * as Misskey from 'misskey-js';
import autosize from 'autosize';
//import insertTextAtCursor from 'insert-text-at-cursor';
import { throttle } from 'throttle-debounce';
import { formatTimeString } from '@/scripts/format-time-string';
import { selectFile } from '@/scripts/select-file';
import * as os from '@/os';
import { stream } from '@/stream';
import { defaultStore } from '@/store';
import { i18n } from '@/i18n';
//import { Autocomplete } from '@/scripts/autocomplete';
import { uploadFile } from '@/scripts/upload';

const props = defineProps<{
	user?: Misskey.entities.UserDetailed | null;
	group?: Misskey.entities.UserGroup | null;
}>();

let textEl = $ref<HTMLTextAreaElement>();
let fileEl = $ref<HTMLInputElement>();

let text = $ref<string>('');
let file = $ref<Misskey.entities.DriveFile | null>(null);
let sending = $ref(false);
const typing = throttle(3000, () => {
	stream.send('typingOnMessaging', props.user ? { partner: props.user.id } : { group: props.group?.id });
});

let draftKey = $computed(() => props.user ? 'user:' + props.user.id : 'group:' + props.group?.id);
let canSend = $computed(() => (text != null && text !== '') || file != null);

watch([$$(text), $$(file)], saveDraft);

async function onPaste(ev: ClipboardEvent) {
	if (!ev.clipboardData) return;

	const clipboardData = ev.clipboardData;
	const items = clipboardData.items;

	if (items.length === 1) {
		if (items[0].kind === 'file') {
			const pastedFile = items[0].getAsFile();
			if (!pastedFile) return;
			const lio = pastedFile.name.lastIndexOf('.');
			const ext = lio >= 0 ? pastedFile.name.slice(lio) : '';
			const formatted = formatTimeString(new Date(pastedFile.lastModified), defaultStore.state.pastedFileName).replace(/{{number}}/g, '1') + ext;
			if (formatted) upload(pastedFile, formatted);
		}
	} else {
		if (items[0].kind === 'file') {
			os.alert({
				type: 'error',
				text: i18n.ts.onlyOneFileCanBeAttached,
			});
		}
	}
}

function onDragover(ev: DragEvent) {
	if (!ev.dataTransfer) return;

	const isFile = ev.dataTransfer.items[0].kind === 'file';
	const isDriveFile = ev.dataTransfer.types[0] === _DATA_TRANSFER_DRIVE_FILE_;
	if (isFile || isDriveFile) {
		ev.preventDefault();
		switch (ev.dataTransfer.effectAllowed) {
			case 'all':
			case 'uninitialized':
			case 'copy': 
			case 'copyLink': 
			case 'copyMove': 
				ev.dataTransfer.dropEffect = 'copy';
				break;
			case 'linkMove':
			case 'move':
				ev.dataTransfer.dropEffect = 'move';
				break;
			default:
				ev.dataTransfer.dropEffect = 'none';
				break;
		}
	}
}

function onDrop(ev: DragEvent): void {
	if (!ev.dataTransfer) return;

	// ファイルだったら
	if (ev.dataTransfer.files.length === 1) {
		ev.preventDefault();
		upload(ev.dataTransfer.files[0]);
		return;
	} else if (ev.dataTransfer.files.length > 1) {
		ev.preventDefault();
		os.alert({
			type: 'error',
			text: i18n.ts.onlyOneFileCanBeAttached,
		});
		return;
	}

	//#region ドライブのファイル
	const driveFile = ev.dataTransfer.getData(_DATA_TRANSFER_DRIVE_FILE_);
	if (driveFile != null && driveFile !== '') {
		file = JSON.parse(driveFile);
		ev.preventDefault();
	}
	//#endregion
}

function onKeydown(ev: KeyboardEvent) {
	typing();
	if ((ev.key === 'Enter') && (ev.ctrlKey || ev.metaKey) && canSend) {
		send();
	}
}

function onCompositionUpdate() {
	typing();
}

function chooseFile(ev: MouseEvent) {
	selectFile(ev.currentTarget ?? ev.target, i18n.ts.selectFile).then(selectedFile => {
		file = selectedFile;
	});
}

function onChangeFile() {
	if (fileEl.files![0]) upload(fileEl.files[0]);
}

function upload(fileToUpload: File, name?: string) {
	uploadFile(fileToUpload, defaultStore.state.uploadFolder, name).then(res => {
		file = res;
	});
}

function send() {
	sending = true;
	os.api('messaging/messages/create', {
		userId: props.user ? props.user.id : undefined,
		groupId: props.group ? props.group.id : undefined,
		text: text ? text : undefined,
		fileId: file ? file.id : undefined,
	}).then(message => {
		clear();
	}).catch(err => {
		console.error(err);
	}).then(() => {
		sending = false;
	});
}

function clear() {
	text = '';
	file = null;
	deleteDraft();
}

function saveDraft() {
	const drafts = JSON.parse(localStorage.getItem('message_drafts') || '{}');

	drafts[draftKey] = {
		updatedAt: new Date(),
		// eslint-disable-next-line id-denylist
		data: {
			text: text,
			file: file,
		},
	};

	localStorage.setItem('message_drafts', JSON.stringify(drafts));
}

function deleteDraft() {
	const drafts = JSON.parse(localStorage.getItem('message_drafts') || '{}');

	delete drafts[draftKey];

	localStorage.setItem('message_drafts', JSON.stringify(drafts));
}

async function insertEmoji(ev: MouseEvent) {
	os.openEmojiPicker(ev.currentTarget ?? ev.target, {}, textEl);
}

onMounted(() => {
	autosize(textEl);

	// TODO: detach when unmount
	// TODO
	//new Autocomplete(textEl, this, { model: 'text' });

	// 書きかけの投稿を復元
	const draft = JSON.parse(localStorage.getItem('message_drafts') || '{}')[draftKey];
	if (draft) {
		text = draft.data.text;
		file = draft.data.file;
	}
});

defineExpose({
	file,
	upload,
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
		min-height: 80px;
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

	footer {
		position: sticky;
		bottom: 0;
		background: var(--panel);

		> .file {
			padding: 8px;
			color: var(--fg);
			background: transparent;
			cursor: pointer;
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

	.buttons {
		display: flex;

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

		> .send {
			margin-left: auto;
			color: var(--accent);

			&:hover {
				color: var(--accentLighten);
			}

			&:active {
				color: var(--accentDarken);
				transition: color 0s ease;
			}
		}
	}

	input[type=file] {
		display: none;
	}
}
</style>
