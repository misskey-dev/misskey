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
		class="_acrylic"
		:placeholder="props.isSecretMessageMode ? (i18n.ts._chat as any).secretMessage : i18n.ts.inputMessageHere"
		:readonly="textareaReadOnly"
		@keydown="onKeydown"
		@paste="onPaste"
		@focus="onTextareaFocus"
		@blur="onTextareaBlur"
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
}>();

const textareaEl = shallowRef<HTMLTextAreaElement>();
const fileEl = shallowRef<HTMLInputElement>();

const text = ref<string>('');
const file = ref<Misskey.entities.DriveFile | null>(null);
const sending = ref(false);
const textareaReadOnly = ref(false);
const isImeOpen = ref(false);
const keyboardHeight = ref(0);
let autocompleteInstance: Autocomplete | null = null;

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
}

// テキストエリアを再レンダリング
function refreshTextarea() {
	if (textareaEl.value == null) return;

	const parent = textareaEl.value.parentElement;
	if (!parent) return;

	const parentParent = parent.parentElement;
	const gaps = parent.closest('._gaps');

	// 統一されたランダムzIndex値を使用
	const randomZIndex = Math.floor(Math.random() * 1000) + 1000;
	console.debug('[KEYBOARD DEBUG] zIndexを変更:', randomZIndex);

	// 統一されたスタイル設定方法
	parent.style.setProperty('z-index', randomZIndex.toString());

	if (parentParent) {
		parentParent.style.setProperty('z-index', randomZIndex.toString());
		parentParent.style.setProperty('height', '0');
	}

	if (gaps) {
		gaps.style.setProperty('z-index', randomZIndex.toString());
		gaps.style.setProperty('height', '0');
	}

	setTimeout(() => {
		// 同じzIndex値を使用して一貫性を保つ
		if (parentParent) {
			parentParent.style.setProperty('height', 'initial');
		}
		if (gaps) {
			gaps.style.setProperty('height', 'initial');
		}
	}, 500);
}

// iOS keyboard handling
function onTextareaFocus() {
	console.log('[KEYBOARD DEBUG] onTextareaFocus called');
	// iOS環境でキーボード表示時のビューポート調整
	if (/iPhone|iPad|iPod/.test(navigator.userAgent)) {
		console.log('[KEYBOARD DEBUG] iOS環境でのキーボード表示処理');
		setTimeout(() => {
			if (textareaEl.value) {
				console.log('[KEYBOARD DEBUG] テキストエリアをスクロール中央に配置');
				textareaEl.value.scrollIntoView({ behavior: 'smooth', block: 'center' });
				refreshTextarea();
			}
		}, 300);
	}
}

function onTextareaBlur() {
	console.log('[KEYBOARD DEBUG] onTextareaBlur called');
	// iOS環境でキーボード非表示時のビューポート調整
	if (/iPhone|iPad|iPod/.test(navigator.userAgent)) {
		console.log('[KEYBOARD DEBUG] iOS環境でのキーボード非表示処理');
		setTimeout(() => {
			console.log('[KEYBOARD DEBUG] ウィンドウを上部にスクロール');
			window.scrollTo(0, 0);
			refreshTextarea();
		}, 100);
	}
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

function setupKeyboardHandling() {
	// モバイル環境の検出
	function isMobileDevice() {
		return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
			   ('ontouchstart' in window) ||
			   (navigator.maxTouchPoints > 0);
	}

	// PCの場合は何もしない
	if (!isMobileDevice()) {
		return () => {}; // 空のクリーンアップ関数
	}

	let isKeyboardOpen = false;
	let footerElement: HTMLElement | null = null;

	function getFooterElement() {
		if (!footerElement && textareaEl.value) {
			// 同じコンポーネント内のfooterを取得
			const parent = textareaEl.value.closest('[class*="root"]');
			if (parent) {
				footerElement = parent.querySelector('[class*="footer"]') as HTMLElement;
			}
		}
		return footerElement;
	}

	function handleKeyboardOpen() {
		if (isKeyboardOpen) return;
		isKeyboardOpen = true;
		isImeOpen.value = true;

		console.log('[KEYBOARD DEBUG] キーボードが開かれました');
		console.log('[KEYBOARD DEBUG] Visual Viewport Height:', window.visualViewport?.height);
		console.log('[KEYBOARD DEBUG] Window Inner Height:', window.innerHeight);
		refreshTextarea();

		const footer = getFooterElement();
		if (footer) {
			console.log('[KEYBOARD DEBUG] フッター要素を調整開始');
			// 一度staticにしてレンダリングをリセット
			footer.style.position = 'static';

			// ブラウザに強制的にレンダリングさせる
			footer.offsetHeight;

			// 次のフレームでstickyに戻す
			requestAnimationFrame(() => {
				setTimeout(() => {
					footer.style.position = 'sticky';
					footer.style.bottom = '0';
					console.log('[KEYBOARD DEBUG] フッターをstickyに設定完了');
				}, 100);
			});
		}

		document.documentElement.classList.add('ime-open');
		console.log('[KEYBOARD DEBUG] ime-openクラス追加完了');
	}

	function handleKeyboardClose() {
		if (!isKeyboardOpen) return;
		isKeyboardOpen = false;
		isImeOpen.value = false;

		console.log('[KEYBOARD DEBUG] キーボードが閉じられました');
		console.log('[KEYBOARD DEBUG] Visual Viewport Height:', window.visualViewport?.height);
		console.log('[KEYBOARD DEBUG] Window Inner Height:', window.innerHeight);
		refreshTextarea();

		const footer = getFooterElement();
		if (footer) {
			console.log('[KEYBOARD DEBUG] フッターを通常状態に戻す');
			// 通常のstickyに戻す
			footer.style.position = 'sticky';
			footer.style.bottom = '0';
		}

		document.documentElement.classList.remove('ime-open');
		console.log('[KEYBOARD DEBUG] ime-openクラス削除完了');
	}

	function detectKeyboardChange() {
		const vv = window.visualViewport;
		if (!vv) return;

		const keyboardHeight = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);

		console.log('[KEYBOARD DEBUG] キーボード高さ検出:', {
			windowInnerHeight: window.innerHeight,
			visualViewportHeight: vv.height,
			visualViewportOffsetTop: vv.offsetTop,
			calculatedKeyboardHeight: keyboardHeight,
			currentlyOpen: isKeyboardOpen
		});

		refreshTextarea();

		// キーボードが開いているかどうかを判定（100px以上の高さ変化）
		if (keyboardHeight > 100 && !isKeyboardOpen) {
			console.log('[KEYBOARD DEBUG] キーボード開く判定 - 高さ:', keyboardHeight);
			handleKeyboardOpen();
		} else if (keyboardHeight <= 100 && isKeyboardOpen) {
			console.log('[KEYBOARD DEBUG] キーボード閉じる判定 - 高さ:', keyboardHeight);
			handleKeyboardClose();
		}
	}

	// iOS/Android キーボードイベント検知
	const handleVisualViewportChange = () => {
		console.log('[KEYBOARD DEBUG] Visual Viewport変更イベント発生');
		detectKeyboardChange();
	};

	// フォーカスイベントでのキーボード検知
	const handleTextareaFocus = () => {
		console.log('[KEYBOARD DEBUG] テキストエリアにフォーカス');
		// モバイルでフォーカス時はキーボードが表示される可能性が高い
		setTimeout(() => {
			console.log('[KEYBOARD DEBUG] フォーカス後の遅延チェック実行');
			detectKeyboardChange();
		}, 300);
	};

	const handleTextareaBlur = () => {
		console.log('[KEYBOARD DEBUG] テキストエリアからフォーカス外れ');
		// フォーカスが外れたら少し待ってからキーボード状態をチェック
		setTimeout(() => {
			console.log('[KEYBOARD DEBUG] フォーカス外れ後の遅延チェック実行');
			detectKeyboardChange();
		}, 300);
	};

	// イベントリスナー設定
	if (window.visualViewport) {
		window.visualViewport.addEventListener('resize', handleVisualViewportChange);
		window.visualViewport.addEventListener('scroll', handleVisualViewportChange);
	}

	if (textareaEl.value) {
		textareaEl.value.addEventListener('focus', handleTextareaFocus);
		textareaEl.value.addEventListener('blur', handleTextareaBlur);
	}

	// 初期状態をチェック
	detectKeyboardChange();

	return () => {
		if (window.visualViewport) {
			window.visualViewport.removeEventListener('resize', handleVisualViewportChange);
			window.visualViewport.removeEventListener('scroll', handleVisualViewportChange);
		}
		if (textareaEl.value) {
			textareaEl.value.removeEventListener('focus', handleTextareaFocus);
			textareaEl.value.removeEventListener('blur', handleTextareaBlur);
		}
		document.documentElement.classList.remove('ime-open');

		// フッターをリセット
		const footer = getFooterElement();
		if (footer) {
			footer.style.position = '';
			footer.style.bottom = '';
			footer.style.display = '';
		}
	};
}

onMounted(() => {
	if (textareaEl.value != null) {
		autocompleteInstance = new Autocomplete(textareaEl.value, text);
	}

	// キーボード処理の設定
	const cleanupKeyboard = setupKeyboardHandling();

	// 書きかけの投稿を復元
	const draft = JSON.parse(miLocalStorage.getItem('chatMessageDrafts') || '{}')[getDraftKey()];
	if (draft) {
		text.value = draft.data.text;
		file.value = draft.data.file;
	}

	// アンマウント時にクリーンアップ
	onBeforeUnmount(() => {
		cleanupKeyboard();
	});
});

onBeforeUnmount(() => {
	if (autocompleteInstance) {
		autocompleteInstance.detach();
		autocompleteInstance = null;
	}
});
</script>

<style lang="scss" module>
.root {
	position: relative;
	border-bottom: none;
	border-radius: 14px 14px 0 0;
	overflow: clip;
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

	// iOS Safari キーボード対応
	-webkit-appearance: none;
	-webkit-user-select: auto;
	user-select: auto;
	-webkit-overflow-scrolling: touch;
	color: var(--MI_THEME-fg);
	field-sizing: content;

	&.secretMode {
		border-radius: 14px 14px 0 0;
		border: 2px solid rgba(255, 165, 0, 0.3);
		background: linear-gradient(135deg, rgba(255, 165, 0, 0.05) 0%, rgba(255, 200, 50, 0.05) 100%);
	}
}

.footer {
	position: sticky;
	bottom: 0;
	background: var(--MI_THEME-panel);
	z-index: 1000;
}

/* iOSキーボード表示時もstickyを維持（レンダリング調整により解決） */
:global(.ime-open) .footer {
	/* JavaScriptで動的にposition: stickyを再設定するためCSS側は最小限 */
	transform: translateZ(0); /* GPU加速を有効にして描画を安定化 */
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
