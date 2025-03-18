<template>
<div
	:class="$style.root"
	@dragover.stop="onDragover"
	@drop.stop="onDrop"
>
	<textarea
		ref="textEl"
		v-model="text"
		:class="$style.textarea"
		class="_acrylic"
		:placeholder="i18n.ts.inputMessageHere"
		@keydown="onKeydown"
		@paste="onPaste"
	></textarea>
	<footer :class="$style.footer">
		<div v-if="file" :class="$style.file" @click="file = null">{{ file.name }}</div>
		<div :class="$style.buttons">
			<button class="_button" :class="$style.button" @click="chooseFile"><i class="ti ti-photo-plus"></i></button>
			<button class="_button" :class="$style.button" @click="insertEmoji"><i class="ti ti-mood-happy"></i></button>
			<button class="_button" :class="[$style.button, $style.send]" :disabled="!canSend || sending" :title="i18n.ts.send" @click="send">
				<template v-if="!sending"><i class="ti ti-send"></i></template><template v-if="sending"><MkLoading :em="true"/></template>
			</button>
		</div>
	</footer>
	<input ref="fileEl" style="display: none;" type="file" @change="onChangeFile"/>
</div>
</template>

<script lang="ts" setup>
import { onMounted, watch, ref, shallowRef, computed } from 'vue';
import * as Misskey from 'misskey-js';
//import insertTextAtCursor from 'insert-text-at-cursor';
import { throttle } from 'throttle-debounce';
import { formatTimeString } from '@/utility/format-time-string.js';
import { selectFile } from '@/utility/select-file.js';
import * as os from '@/os.js';
import { useStream } from '@/stream.js';
import { i18n } from '@/i18n.js';
//import { Autocomplete } from '@/utility/autocomplete.js';
import { uploadFile } from '@/utility/upload.js';
import { miLocalStorage } from '@/local-storage.js';
import { misskeyApi } from '@/utility/misskey-api.js';
import { prefer } from '@/preferences.js';

const props = defineProps<{
	user?: Misskey.entities.UserDetailed | null;
	room?: Misskey.entities.ChatRoom | null;
}>();

const textEl = shallowRef<HTMLTextAreaElement>();
const fileEl = shallowRef<HTMLInputElement>();

const text = ref<string>('');
const file = ref<Misskey.entities.DriveFile | null>(null);
const sending = ref(false);

const canSend = computed(() => (text.value != null && text.value !== '') || file.value != null);

function getDraftKey() {
	return props.user ? 'user:' + props.user.id : 'room:' + props.room?.id;
}

watch([text, file], saveDraft);

async function onPaste(ev: ClipboardEvent) {
	if (!ev.clipboardData) return;

	const pastedFileName = 'yyyy-MM-dd HH-mm-ss [{{number}}]';

	const clipboardData = ev.clipboardData;
	const items = clipboardData.items;

	if (items.length === 1) {
		if (items[0].kind === 'file') {
			const pastedFile = items[0].getAsFile();
			if (!pastedFile) return;
			const lio = pastedFile.name.lastIndexOf('.');
			const ext = lio >= 0 ? pastedFile.name.slice(lio) : '';
			const formatted = formatTimeString(new Date(pastedFile.lastModified), pastedFileName).replace(/{{number}}/g, '1') + ext;
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
		file.value = JSON.parse(driveFile);
		ev.preventDefault();
	}
	//#endregion
}

function onKeydown(ev: KeyboardEvent) {
	if ((ev.key === 'Enter') && (ev.ctrlKey || ev.metaKey)) {
		send();
	}
}

function chooseFile(ev: MouseEvent) {
	selectFile(ev.currentTarget ?? ev.target, i18n.ts.selectFile).then(selectedFile => {
		file.value = selectedFile;
	});
}

function onChangeFile() {
	if (fileEl.value.files![0]) upload(fileEl.value.files[0]);
}

function upload(fileToUpload: File, name?: string) {
	uploadFile(fileToUpload, prefer.s.uploadFolder, name).then(res => {
		file.value = res;
	});
}

function send() {
	if (!canSend.value) return;

	sending.value = true;
	misskeyApi('chat/messages/create', {
		toUserId: props.user ? props.user.id : undefined,
		toRoomId: props.room ? props.room.id : undefined,
		text: text.value ? text.value : undefined,
		fileId: file.value ? file.value.id : undefined,
	}).then(message => {
		clear();
	}).catch(err => {
		console.error(err);
	}).then(() => {
		sending.value = false;
	});
}

function clear() {
	text.value = '';
	file.value = null;
	deleteDraft();
}

function saveDraft() {
	const drafts = JSON.parse(miLocalStorage.getItem('chatMessageDrafts') || '{}');

	drafts[getDraftKey()] = {
		updatedAt: new Date(),
		data: {
			text: text.value,
			file: file.value,
		},
	};

	miLocalStorage.setItem('chatMessageDrafts', JSON.stringify(drafts));
}

function deleteDraft() {
	const drafts = JSON.parse(miLocalStorage.getItem('chatMessageDrafts') || '{}');

	delete drafts[getDraftKey()];

	miLocalStorage.setItem('chatMessageDrafts', JSON.stringify(drafts));
}

async function insertEmoji(ev: MouseEvent) {
	os.openEmojiPicker(ev.currentTarget ?? ev.target, {}, textEl);
}

onMounted(() => {
	//autosize(textEl);

	// TODO: detach when unmount
	// TODO
	//new Autocomplete(textEl, this, { model: 'text' });

	// 書きかけの投稿を復元
	const draft = JSON.parse(miLocalStorage.getItem('chatMessageDrafts') || '{}')[getDraftKey()];
	if (draft) {
		text.value = draft.data.text;
		file.value = draft.data.file;
	}
});
</script>

<style lang="scss" module>
.root {
	position: relative;
}

.textarea {
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
	box-sizing: border-box;
	color: var(--fg);
}

.footer {
	position: sticky;
	bottom: 0;
	background: var(--panel);
}

.file {
	padding: 8px;
	color: var(--fg);
	background: transparent;
	cursor: pointer;
}
/*
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
	}
}

.file-remove {
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
*/

.buttons {
	display: flex;
}

.button {
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
.send {
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
</style>
