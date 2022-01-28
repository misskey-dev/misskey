<template>
<div class="pemppnzi _block"
	@dragover.stop="onDragover"
	@drop.stop="onDrop"
>
	<textarea
		ref="textEl"
		v-model="text"
		:placeholder="i18n.locale.inputMessageHere"
		@keydown="onKeydown"
		@compositionupdate="onCompositionUpdate"
		@paste="onPaste"
	></textarea>
	<footer>
		<div v-if="file" class="file" @click="file = null">{{ file.name }}</div>
		<div class="buttons">
			<button class="_button" @click="chooseFile"><i class="fas fa-photo-video"></i></button>
			<button class="_button" @click="insertEmoji"><i class="fas fa-laugh-squint"></i></button>
			<button class="send _button" :disabled="!canSend || sending" :title="i18n.locale.send" @click="send">
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
import insertTextAtCursor from 'insert-text-at-cursor';
import { formatTimeString } from '@/scripts/format-time-string';
import { selectFile } from '@/scripts/select-file';
import * as os from '@/os';
import { stream } from '@/stream';
import { throttle } from 'throttle-debounce';
import { defaultStore } from '@/store';
import { i18n } from '@/i18n';
import { Autocomplete } from '@/scripts/autocomplete';

const props = defineProps<{
	user?: Misskey.entities.UserDetailed | null;
	group?: Misskey.entities.UserGroup | null;
}>();

let textEl = $ref<HTMLTextAreaElement>();
let fileEl = $ref<HTMLInputElement>();

let text: string = $ref('');
let file: Misskey.entities.DriveFile | null = $ref(null);
let sending = $ref(false);
const typing = throttle(3000, () => {
	stream.send('typingOnMessaging', props.user ? { partner: props.user.id } : { group: props.group?.id });
});

let draftKey = $computed(() => props.user ? 'user:' + props.user.id : 'group:' + props.group?.id);
let canSend = $computed(() => (text != null && text != '') || file != null);

watch([$$(text), $$(file)], saveDraft);

async function onPaste(e: ClipboardEvent) {
	if (!e.clipboardData) return;

	const data = e.clipboardData;
	const items = data.items;

	if (items.length == 1) {
		if (items[0].kind == 'file') {
			const file = items[0].getAsFile();
			if (!file) return;
			const lio = file.name.lastIndexOf('.');
			const ext = lio >= 0 ? file.name.slice(lio) : '';
			const formatted = `${formatTimeString(new Date(file.lastModified), defaultStore.state.pastedFileName).replace(/{{number}}/g, '1')}${ext}`;
			if (formatted) upload(file, formatted);
		}
	} else {
		if (items[0].kind == 'file') {
			os.alert({
				type: 'error',
				text: i18n.locale.onlyOneFileCanBeAttached
			});
		}
	}
}

function onDragover(e: DragEvent) {
	if (!e.dataTransfer) return;

	const isFile = e.dataTransfer.items[0].kind == 'file';
	const isDriveFile = e.dataTransfer.types[0] == _DATA_TRANSFER_DRIVE_FILE_;
	if (isFile || isDriveFile) {
		e.preventDefault();
		e.dataTransfer.dropEffect = e.dataTransfer.effectAllowed == 'all' ? 'copy' : 'move';
	}
}

function onDrop(e: DragEvent): void {
	if (!e.dataTransfer) return;

	// ファイルだったら
	if (e.dataTransfer.files.length == 1) {
		e.preventDefault();
		upload(e.dataTransfer.files[0]);
		return;
	} else if (e.dataTransfer.files.length > 1) {
		e.preventDefault();
		os.alert({
			type: 'error',
			text: i18n.locale.onlyOneFileCanBeAttached
		});
		return;
	}

	//#region ドライブのファイル
	const driveFile = e.dataTransfer.getData(_DATA_TRANSFER_DRIVE_FILE_);
	if (driveFile != null && driveFile != '') {
		file = JSON.parse(driveFile);
		e.preventDefault();
	}
	//#endregion
}

function onKeydown(e: KeyboardEvent) {
	typing();
	if ((e.key === 'Enter') && (e.ctrlKey || e.metaKey) && canSend) {
		send();
	}
}

function onCompositionUpdate() {
	typing();
}

function chooseFile(e: MouseEvent) {
	selectFile(e.currentTarget ?? e.target, i18n.locale.selectFile).then(selectedFile => {
		file = selectedFile;
	});
}

function onChangeFile() {
	if (fileEl?.files![0]) upload(fileEl.files[0]);
}

function upload(fileToUpload: File, name?: string) {
	os.upload(fileToUpload, defaultStore.state.uploadFolder, name).then(res => {
		file = res;
	});
}

function send() {
	sending = true;
	os.api('messaging/messages/create', {
		userId: props.user ? props.user.id : undefined,
		groupId: props.group ? props.group.id : undefined,
		text: text ? text : undefined,
		fileId: file ? file.id : undefined
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
	const data = JSON.parse(localStorage.getItem('message_drafts') || '{}');

	data[draftKey] = {
		updatedAt: new Date(),
		data: {
			text: text,
			file: file
		}
	}

	localStorage.setItem('message_drafts', JSON.stringify(data));
}

function deleteDraft() {
	const data = JSON.parse(localStorage.getItem('message_drafts') || '{}');

	delete data[draftKey];

	localStorage.setItem('message_drafts', JSON.stringify(data));
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
