<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div
	:class="$style.root"
	@dragover.stop="onDragover"
	@drop.stop="onDrop"
>
	<textarea
		ref="textareaEl"
		v-model="text"
		:class="[$style.textarea, { [$style.secretMode]: props.isSecretMessageMode }]"
		:placeholder="props.isSecretMessageMode ? (i18n.ts._chat as any).secretMessage : i18n.ts.inputMessageHere"
		:readonly="textareaReadOnly"
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
import { onMounted, watch, ref, shallowRef, computed, nextTick, readonly, onBeforeUnmount } from 'vue';
import * as Misskey from 'misskey-js';
import { throttle } from 'throttle-debounce';
//import insertTextAtCursor from 'insert-text-at-cursor';
import { formatTimeString } from '@/utility/format-time-string.js';
import { selectFile } from '@/utility/drive.js';
import * as os from '@/os.js';
import { i18n } from '@/i18n.js';
import { miLocalStorage } from '@/local-storage.js';
import { misskeyApi } from '@/utility/misskey-api.js';
import { prefer } from '@/preferences.js';
import { Autocomplete } from '@/utility/autocomplete.js';
import { emojiPicker } from '@/utility/emoji-picker.js';
import { checkDragDataType, getDragData } from '@/drag-and-drop.js';

const props = defineProps<{
	user?: Misskey.entities.UserDetailed | null;
	room?: Misskey.entities.ChatRoom | null;
	isSecretMessageMode?: boolean;
	onTyping?: () => void;
	onTypingStop?: () => void;
}>();

const textareaEl = shallowRef<HTMLTextAreaElement>();
const fileEl = shallowRef<HTMLInputElement>();
let cleanupKeyboardDetection: (() => void) | null = null;

const text = ref<string>('');
const file = ref<Misskey.entities.DriveFile | null>(null);
const sending = ref(false);
const textareaReadOnly = ref(false);
let autocompleteInstance: Autocomplete | null = null;
// connection は props から受け取る
let typingStopTimer: ReturnType<typeof setTimeout> | null = null;
let isTyping = ref(false);

const canSend = computed(() => (text.value != null && text.value !== '') || file.value != null);

// typing停止状態を送信する関数
function notifyTypingStop() {
	if (props.onTypingStop && isTyping.value) {
		props.onTypingStop();
		isTyping.value = false;
	}
}

// 強制的にtyping停止を送信する関数（送信時などに使用）
function forceNotifyTypingStop() {
	if (props.onTypingStop) {
		props.onTypingStop();
		isTyping.value = false;

		// タイマーもクリア
		if (typingStopTimer) {
			clearTimeout(typingStopTimer);
			typingStopTimer = null;
		}
	}
}

// typing状態を送信する関数（3秒間隔でthrottle）
const notifyTyping = throttle(3000, () => {
	// 送信直前に再度textareaが空でないかチェック
	if (!text.value || text.value.trim() === '') {
		return;
	}

	if (props.onTyping) {
		props.onTyping();
		isTyping.value = true;

		// 既存のタイマーをクリア
		if (typingStopTimer) {
			clearTimeout(typingStopTimer);
		}

		// 5秒後にtyping停止を送信
		typingStopTimer = setTimeout(() => {
			notifyTypingStop();
		}, 5000);
	}
});

function getDraftKey() {
	return props.user ? 'user:' + props.user.id : 'room:' + props.room?.id;
}

watch([text, file], saveDraft);

// テキストが空になった時のtyping停止処理
watch(text, (newText) => {
	// テキストが空になり、かつtyping中の場合
	if (isTyping.value && (!newText || newText.trim() === '')) {
		notifyTypingStop();
	}
});

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
			const formattedName = formatTimeString(new Date(pastedFile.lastModified), pastedFileName).replace(/{{number}}/g, '1') + ext;
			const renamedFile = new File([pastedFile], formattedName, { type: pastedFile.type });
			os.launchUploader([renamedFile], { multiple: false }).then(driveFiles => {
				file.value = driveFiles[0];
			});
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
	if (isFile || checkDragDataType(ev, ['driveFiles'])) {
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
		os.launchUploader([Array.from(ev.dataTransfer.files)[0]], { multiple: false });
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
	{
		const droppedData = getDragData(ev, 'driveFiles');
		if (droppedData != null) {
			file.value = droppedData[0];
			ev.preventDefault();
		}
	}
	//#endregion
}

function onKeydown(ev: KeyboardEvent) {
	// typing状態を通知（ただし、実際にテキストがある場合のみ）
	if (text.value && text.value.trim() !== '') {
		notifyTyping();
	}

	if (ev.key === 'Enter') {
		if (prefer.s['chat.sendOnEnter']) {
			if (!(ev.ctrlKey || ev.metaKey || ev.shiftKey)) {
				send();
			}
		} else {
			if ((ev.ctrlKey || ev.metaKey)) {
				send();
			}
		}
	}
}

function chooseFile(ev: MouseEvent) {
	selectFile({
		anchorElement: ev.currentTarget ?? ev.target,
		multiple: false,
		label: i18n.ts.selectFile,
	}).then(selectedFile => {
		file.value = selectedFile;
	});
}

function onChangeFile() {
	if (fileEl.value == null || fileEl.value.files == null) return;

	if (fileEl.value.files[0]) {
		os.launchUploader(Array.from(fileEl.value.files), { multiple: false }).then(driveFiles => {
			file.value = driveFiles[0];
		});
	}
}

function send() {
	if (!canSend.value) return;

	forceNotifyTypingStop();

	sending.value = true;

	if (props.user) {
		misskeyApi('chat/messages/create-to-user', {
			toUserId: props.user.id,
			text: text.value ? text.value : undefined,
			fileId: file.value ? file.value.id : undefined,
		}).then(message => {
			clear();
		}).catch(err => {
			console.error(err);
		}).then(() => {
			sending.value = false;
		});
	} else if (props.room) {
		misskeyApi('chat/messages/create-to-room', {
			toRoomId: props.room.id,
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
}

function clear() {
	text.value = '';
	file.value = null;
	deleteDraft();

	forceNotifyTypingStop();
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

function focus() {
	if (textareaEl.value) {
		textareaEl.value.focus();
	}
}

async function insertEmoji(ev: MouseEvent) {
	textareaReadOnly.value = true;
	const target = ev.currentTarget ?? ev.target;
	if (target == null) return;

	// emojiPickerはダイアログが閉じずにtextareaとやりとりするので、
	// focustrapをかけているとinsertTextAtCursorが効かない
	// そのため、投稿フォームのテキストに直接注入する
	// See: https://github.com/misskey-dev/misskey/pull/14282
	//      https://github.com/misskey-dev/misskey/issues/14274

	let pos = textareaEl.value?.selectionStart ?? 0;
	let posEnd = textareaEl.value?.selectionEnd ?? text.value.length;
	emojiPicker.show(
		target as HTMLElement,
		emoji => {
			const textBefore = text.value.substring(0, pos);
			const textAfter = text.value.substring(posEnd);
			text.value = textBefore + emoji + textAfter;
			pos += emoji.length;
			posEnd += emoji.length;
		},
		() => {
			textareaReadOnly.value = false;
			nextTick(() => focus());
		},
	);
}

onMounted(() => {
	if (textareaEl.value != null) {
		autocompleteInstance = new Autocomplete(textareaEl.value, text);
	}

	// 書きかけの投稿を復元
	const draft = JSON.parse(miLocalStorage.getItem('chatMessageDrafts') || '{}')[getDraftKey()];
	if (draft) {
		text.value = draft.data.text;
		file.value = draft.data.file;
	}

	// キーボード表示検出: iOS Safariではキーボード表示時も100dvhが変わらないため
	// visualViewportでキーボード高さを検出し、CSS変数とクラスでレイアウトを調整する
	const vv = window.visualViewport;
	if (vv) {
		const onVvResize = () => {
			// iOS: innerHeightはlayout viewport(キーボードで変わらない)
			// vv.heightはvisual viewport(キーボードで縮む)
			const kbHeight = window.innerHeight - vv.height - vv.offsetTop;
			if (kbHeight > 100) {
				document.documentElement.classList.add('keyboard-open');
				document.documentElement.style.setProperty('--keyboard-height', `${kbHeight}px`);
			} else {
				document.documentElement.classList.remove('keyboard-open');
				document.documentElement.style.removeProperty('--keyboard-height');
			}
		};
		vv.addEventListener('resize', onVvResize);
		cleanupKeyboardDetection = () => {
			vv.removeEventListener('resize', onVvResize);
			document.documentElement.classList.remove('keyboard-open');
			document.documentElement.style.removeProperty('--keyboard-height');
		};
	}
});

onBeforeUnmount(() => {
	if (autocompleteInstance) {
		autocompleteInstance.detach();
		autocompleteInstance = null;
	}
	notifyTypingStop();
	if (typingStopTimer) {
		clearTimeout(typingStopTimer);
		typingStopTimer = null;
	}
	cleanupKeyboardDetection?.();
});
</script>

<style lang="scss" module>
// スクロールコンテナ外に配置されるため、sticky不要
// モバイルナビバーと同じnavBgで確実に不透明背景を表示する
.root {
	position: relative;
	background: var(--MI_THEME-navBg);
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
	// backdrop-filterを使わない不透明背景（iOS Safari対応）
	background: var(--MI_THEME-navBg);
	color: var(--MI_THEME-navFg);
	field-sizing: content;

	&.secretMode {
		// borderはサブピクセルで左辺が1px欠けることがあるため、box-shadowで代替
		box-shadow: inset 0 0 0 2px rgba(255, 165, 0, 0.3);
		background: linear-gradient(135deg, rgba(255, 165, 0, 0.05) 0%, rgba(255, 200, 50, 0.05) 100%);
	}
}

// スクロールコンテナ外配置のためsticky不要
.footer {
	background: var(--MI_THEME-navBg);
}

.file {
	padding: 8px;
	cursor: pointer;
}

.secretIndicator {
	display: flex;
	align-items: center;
	gap: 6px;
	padding: 8px;
	color: var(--MI_THEME-warn);
	font-size: 0.9em;
	font-weight: 500;
}

.buttons {
	display: flex;
}

.button {
	height: 50px;
	aspect-ratio: 1;

	&:hover {
		color: var(--MI_THEME-accent);
	}
}
.send {
	margin-left: auto;
	color: var(--MI_THEME-accent);
}
</style>
