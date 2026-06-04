<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<TransitionGroup
	tag="div"
	:enterActiveClass="$style.transition_items_enterActive"
	:leaveActiveClass="$style.transition_items_leaveActive"
	:enterFromClass="$style.transition_items_enterFrom"
	:leaveToClass="$style.transition_items_leaveTo"
	:moveClass="$style.transition_items_move"
	:class="[$style.items, { [$style.dragging]: dragging, [$style.horizontal]: direction === 'horizontal', [$style.vertical]: direction === 'vertical', [$style.withGaps]: withGaps, [$style.canNest]: canNest }]"
>
	<slot name="header"></slot>
	<div
		v-if="modelValue.length === 0"
		:class="$style.emptyDropArea"
		:data-mk-draggable-empty-instance-id="instanceId"
		@dragover.prevent.stop="() => {}"
		@dragleave="() => {}"
		@drop.prevent.stop="onEmptyDrop($event)"
	>
	</div>
	<div
		v-for="(item, i) in modelValue"
		:key="`MkDraggableRoot:${item.id}`"
		:class="$style.item"
		:draggable="!manualDragStart"
		:data-mk-draggable-item-root="item.id"
		@dragstart.stop="onDragstart($event, item)"
		@touchstart.passive="manualDragStart ? undefined : onTouchstart($event, item)"
		@contextmenu="onContextmenu"
	>
		<div
			:class="[$style.forwardArea, { [$style.dropReady]: isDropReady(item.id, 'forward') }]"
			:data-mk-draggable-area="'forward'"
			:data-mk-draggable-item-id="item.id"
			:data-mk-draggable-instance-id="instanceId"
			@dragover.prevent.stop="onDragover($event, item, false)"
			@dragleave="onDragleave($event, item)"
			@drop.prevent.stop="onDrop($event, item, false)"
		></div>
		<div :key="`MkDraggableItem:${item.id}`" style="position: relative; z-index: 0;">
			<slot :item="item" :index="i" :dragStart="(ev) => onDragstart(ev, item)" :touchStart="(ev) => onTouchstart(ev, item)"></slot>
		</div>
		<div
			:class="[$style.backwardArea, { [$style.dropReady]: isDropReady(item.id, 'backward') }]"
			:data-mk-draggable-area="'backward'"
			:data-mk-draggable-item-id="item.id"
			:data-mk-draggable-instance-id="instanceId"
			@dragover.prevent.stop="onDragover($event, item, true)"
			@dragleave="onDragleave($event, item)"
			@drop.prevent.stop="onDrop($event, item, true)"
		></div>
	</div>
	<slot name="footer"></slot>
</TransitionGroup>
</template>

<script lang="ts">
import { ref } from 'vue';

// 別々のコンポーネントインスタンス間でD&Dを融通するためにグローバルに状態を持っておく必要がある
const dragging = ref(false);
let dropCallback: ((targetInstanceId: string) => void) | null = null;

// タッチ操作はDataTransferが使えないので、インスタンス間連携用にmodule-levelレジストリを用意する
type TouchDropHandler = (draggedItem: { id: string }, sourceGroup: string, targetItemId: string, backward: boolean) => void;
type TouchEmptyDropHandler = (draggedItem: { id: string }, sourceGroup: string) => void;
const touchDropHandlers = new Map<string, TouchDropHandler>();
const touchEmptyDropHandlers = new Map<string, TouchEmptyDropHandler>();

// 全インスタンスで共有するタッチドロップ位置 (インスタンスIDで自インスタンス判定する)
const touchDropTarget = ref<{ instanceId: string; itemId: string; area: 'forward' | 'backward' } | null>(null);
</script>

<script lang="ts" setup generic="T extends { id: string; }">
import { nextTick, onBeforeUnmount } from 'vue';
import { getDragData, setDragData } from '@/drag-and-drop.js';
import { genId } from '@/utility/id.js';

const slots = defineSlots<{
	default(props: { item: T; index: number; dragStart: (ev: DragEvent) => void; touchStart: (ev: TouchEvent) => void }): any;
	header(): any;
	footer(): any;
}>();

const props = withDefaults(defineProps<{
	modelValue: T[];
	direction: 'horizontal' | 'vertical';
	group?: string | null;
	manualDragStart?: boolean;
	/**
	 * タッチ操作時のドラッグ開始モードを切り替える。
	 * - `true` (long-press): 行を一定時間長押し (400ms) してからドラッグ開始。
	 *   行の中に tap で発火させたい要素がなく、画面スクロールに譲りたい縦長リスト向け。
	 * - `false` (default): 行を触ってから一定量 (8px) 動かしたらドラッグ開始。
	 *   tap (動かさずに離す) は親要素の click ハンドラに通すので、行内に tap で
	 *   メニューを開くようなアイテム (画像サムネ、リアクション絵文字など) があっても両立する。
	 *
	 * `manualDragStart` が `true` の場合はこの prop は参照されず、ハンドル要素を触った
	 * 瞬間 (待ち時間 0ms) からドラッグが始まる。
	 */
	longPress?: boolean;
	withGaps?: boolean;
	canNest?: boolean;
}>(), {
	group: null,
	manualDragStart: false,
	longPress: false,
	withGaps: false,
	canNest: false,
});

const emit = defineEmits<{
	(ev: 'update:modelValue', value: T[]): void;
}>();

const dropReadyArea = ref<[T['id'] | null, 'forward' | 'backward' | null]>([null, null]);
const instanceId = genId();
const group = props.group ?? instanceId;

function isDropReady(itemId: T['id'], area: 'forward' | 'backward') {
	if (dropReadyArea.value[0] === itemId && dropReadyArea.value[1] === area) return true;
	const t = touchDropTarget.value;
	if (t != null && t.instanceId === instanceId && t.itemId === itemId && t.area === area) return true;
	return false;
}

function onDragstart(ev: DragEvent, item: T) {
	if (ev.dataTransfer == null) return;
	ev.dataTransfer.effectAllowed = 'move';
	setDragData(ev, 'MkDraggable', { item, instanceId, group });

	const target = ev.target as HTMLElement;
	target.addEventListener('dragend', (ev) => {
		dragging.value = false;
		dropReadyArea.value = [null, null];
	}, { once: true });

	dropCallback = (targetInstanceId) => {
		if (targetInstanceId === instanceId) return;
		const newValue = props.modelValue.filter(x => x.id !== item.id);
		emit('update:modelValue', newValue);
	};

	// Chromeのバグで、Dragstartハンドラ内ですぐにDOMを変更する(=リアクティブなプロパティを変更する)とDragが終了してしまう
	// SEE: https://stackoverflow.com/questions/19639969/html5-dragend-event-firing-immediately
	// SEE: https://issues.chromium.org/issues/41150279
	window.setTimeout(() => {
		dragging.value = true;
	}, 10);
}

function onDragover(ev: DragEvent, item: T, backward: boolean) {
	nextTick(() => {
		dropReadyArea.value = [item.id, backward ? 'backward' : 'forward'];
	});
}

function onDragleave(ev: DragEvent, item: T) {
	dropReadyArea.value = [null, null];
}

function applyDrop(draggedItem: T, sourceGroup: string, targetItemId: T['id'], backward: boolean) {
	if (sourceGroup !== group || draggedItem.id === targetItemId) return;

	const fromIndex = props.modelValue.findIndex(x => x.id === draggedItem.id);
	let toIndex = props.modelValue.findIndex(x => x.id === targetItemId);

	const newValue = [...props.modelValue];
	if (fromIndex > -1) newValue.splice(fromIndex, 1);
	toIndex = newValue.findIndex(x => x.id === targetItemId);
	if (backward) toIndex += 1;
	newValue.splice(toIndex, 0, draggedItem);

	emit('update:modelValue', newValue);
}

function onDrop(ev: DragEvent, item: T, backward: boolean) {
	const dragged = getDragData(ev, 'MkDraggable');
	dropReadyArea.value = [null, null];
	if (dragged == null) return;
	dropCallback?.(instanceId);
	applyDrop(dragged.item as T, dragged.group, item.id, backward);
}

function onEmptyDrop(ev: DragEvent) {
	const dragged = getDragData(ev, 'MkDraggable');
	if (dragged == null) return;
	dropCallback?.(instanceId);

	emit('update:modelValue', [dragged.item as T]);
}

// ---------- タッチ操作 ----------

const LONG_PRESS_MS = 400;
const MOVE_THRESHOLD_PX = 8;

type TouchPending = {
	identifier: number;
	x: number;
	y: number;
	sourceElement: HTMLElement | null;
	item: T;
};

let touchPending: TouchPending | null = null;
let touchLongPressTimer: number | null = null;
let touchDragActive = false;
let touchDragSession: { item: T; instanceId: string; group: string } | null = null;
let touchGhostEl: HTMLElement | null = null;

function findTouchByIdentifier(list: TouchList, id: number): Touch | null {
	for (let i = 0; i < list.length; i++) {
		if (list[i].identifier === id) return list[i];
	}
	return null;
}

function clearTouchLongPress() {
	if (touchLongPressTimer != null) {
		window.clearTimeout(touchLongPressTimer);
		touchLongPressTimer = null;
	}
}

function teardownTouchListeners() {
	window.removeEventListener('touchmove', onWindowTouchMove);
	window.removeEventListener('touchend', onWindowTouchEnd);
	window.removeEventListener('touchcancel', onWindowTouchEnd);
}

// touch session 中、source item の draggable 属性を一時的に false にしておくことで、
// HTML5 drag-and-drop との競合 (DevTools のタッチエミュレーションでは下層のマウスから
// dragstart が発火してしまい touchmove フローを阻害する) を避ける。
// 実機モバイルでは元々 touch から HTML5 drag は起きないので無害。
function restoreTouchSourceDraggable() {
	const el = touchPending?.sourceElement;
	if (el != null && !props.manualDragStart) {
		el.setAttribute('draggable', 'true');
	}
}

// touch session 中 (長押し待ち中 / drag 中) は contextmenu を抑止する。
// draggable=false に切り替えた副作用で、DevTools のタッチエミュレーション環境では
// mouse-down 長押しが contextmenu を呼んでしまうため。
// preventDefault でブラウザのデフォルトメニュー、stopPropagation で Misskey 上位の
// カスタムコンテキストメニュー (バブリングで上位 listener に到達するもの) も止める。
// touch session 外 (= PC でのまとも右クリック) は素通しなので副作用なし。
function onContextmenu(ev: MouseEvent) {
	if (touchPending != null || touchDragActive) {
		ev.preventDefault();
		ev.stopPropagation();
	}
}

function cleanupTouchDrag() {
	restoreTouchSourceDraggable();
	touchDragActive = false;
	touchDragSession = null;
	touchPending = null;
	touchDropTarget.value = null;
	dragging.value = false;
	dropCallback = null;
	if (touchGhostEl != null) {
		touchGhostEl.remove();
		touchGhostEl = null;
	}
	teardownTouchListeners();
}

function onTouchstart(ev: TouchEvent, item: T) {
	if (ev.touches.length !== 1) return;
	if (touchDragActive || touchPending != null) return;
	const t = ev.touches[0];
	const target = ev.target as HTMLElement | null;
	const itemEl = target?.closest<HTMLElement>(`[data-mk-draggable-item-root="${CSS.escape(item.id)}"]`) ?? null;

	// HTML5 drag との競合を防ぐため、この touch session 中は draggable を一時的に無効化
	if (itemEl != null && !props.manualDragStart) {
		itemEl.setAttribute('draggable', 'false');
	}

	touchPending = {
		identifier: t.identifier,
		x: t.clientX,
		y: t.clientY,
		sourceElement: itemEl,
		item,
	};
	clearTouchLongPress();

	if (props.manualDragStart) {
		// ハンドル経由は明示的にハンドルを掴んだ意図表明なので待たずに即開始
		startTouchDrag();
	} else if (props.longPress) {
		// 行全体を長押しさせるモード: タイマー成立まで何もせず、しきい値を超えて動いたらキャンセル
		touchLongPressTimer = window.setTimeout(startTouchDrag, LONG_PRESS_MS);
	}
	// それ以外 (即時 + 移動しきい値モード): touchmove で MOVE_THRESHOLD_PX を超えた時点で開始

	window.addEventListener('touchmove', onWindowTouchMove, { passive: false });
	window.addEventListener('touchend', onWindowTouchEnd);
	window.addEventListener('touchcancel', onWindowTouchEnd);
}

function startTouchDrag() {
	if (touchPending == null) return;
	touchDragActive = true;
	const item = touchPending.item;
	touchDragSession = { item, instanceId, group };
	dragging.value = true;

	// sourceRect は touchstart 時点でなく drag 開始時点で取り直す (待ち時間中にレイアウトが
	// 変動する可能性があるため)
	if (touchPending.sourceElement != null) {
		const rect = touchPending.sourceElement.getBoundingClientRect();
		const ghost = touchPending.sourceElement.cloneNode(true) as HTMLElement;
		ghost.style.position = 'fixed';
		ghost.style.pointerEvents = 'none';
		ghost.style.top = `${rect.top}px`;
		ghost.style.left = `${rect.left}px`;
		ghost.style.width = `${rect.width}px`;
		ghost.style.margin = '0';
		ghost.style.opacity = '0.85';
		ghost.style.zIndex = '2147483647';
		ghost.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.3)';
		ghost.style.transition = 'transform 0.05s linear';
		ghost.style.transformOrigin = 'top left';
		window.document.body.appendChild(ghost);
		touchGhostEl = ghost;
	}

	dropCallback = (targetInstanceId) => {
		if (targetInstanceId === instanceId) return;
		const newValue = props.modelValue.filter(x => x.id !== item.id);
		emit('update:modelValue', newValue);
	};

	if ('vibrate' in navigator) {
		try {
			navigator.vibrate(30);
		} catch {
			// noop
		}
	}
}

function onWindowTouchMove(ev: TouchEvent) {
	if (touchPending == null) return;
	const t = findTouchByIdentifier(ev.touches, touchPending.identifier);
	if (t == null) return;

	if (!touchDragActive) {
		const dx = Math.abs(t.clientX - touchPending.x);
		const dy = Math.abs(t.clientY - touchPending.y);
		const moved = dx > MOVE_THRESHOLD_PX || dy > MOVE_THRESHOLD_PX;
		if (!moved) return;

		if (props.longPress) {
			// 長押し成立前に動いたらキャンセル (通常スクロールへ譲る)
			clearTouchLongPress();
			restoreTouchSourceDraggable();
			touchPending = null;
			teardownTouchListeners();
		} else {
			// 即時モード: 動き出した瞬間がドラッグ開始のトリガー。
			// tap (動かさず touchend) は touchend 側で touchDragActive=false のまま素通しになり
			// ブラウザの click 合成を妨げない。
			startTouchDrag();
		}
		return;
	}

	ev.preventDefault();

	if (touchGhostEl != null) {
		const dx = t.clientX - touchPending.x;
		const dy = t.clientY - touchPending.y;
		touchGhostEl.style.transform = `translate(${dx}px, ${dy}px)`;
	}

	// elementFromPoint で実際のドロップターゲットを判定 (ghostは一時的に隠す)
	const prevGhostDisplay = touchGhostEl?.style.display ?? '';
	if (touchGhostEl != null) touchGhostEl.style.display = 'none';
	const el = window.document.elementFromPoint(t.clientX, t.clientY) as HTMLElement | null;
	if (touchGhostEl != null) touchGhostEl.style.display = prevGhostDisplay;

	if (el == null) {
		touchDropTarget.value = null;
		return;
	}

	const areaEl = el.closest<HTMLElement>('[data-mk-draggable-area]');
	if (areaEl != null) {
		const targetInstanceId = areaEl.dataset.mkDraggableInstanceId;
		const targetItemId = areaEl.dataset.mkDraggableItemId;
		const area = areaEl.dataset.mkDraggableArea as 'forward' | 'backward' | undefined;
		if (targetInstanceId != null && targetItemId != null && (area === 'forward' || area === 'backward')) {
			touchDropTarget.value = { instanceId: targetInstanceId, itemId: targetItemId, area };
			return;
		}
	}
	touchDropTarget.value = null;
}

function onWindowTouchEnd(ev: TouchEvent) {
	// touchcancel は identifier の追跡を放棄し、状態を完全にクリーンアップする
	if (ev.type === 'touchcancel') {
		if (touchDragActive) {
			cleanupTouchDrag();
		} else {
			clearTouchLongPress();
			restoreTouchSourceDraggable();
			touchPending = null;
			teardownTouchListeners();
		}
		return;
	}

	// 追跡中の指の touchend だけを処理 (他の指の touchend では何もしない)
	if (touchPending == null) return;
	if (findTouchByIdentifier(ev.changedTouches, touchPending.identifier) == null) return;

	if (!touchDragActive) {
		clearTouchLongPress();
		restoreTouchSourceDraggable();
		touchPending = null;
		teardownTouchListeners();
		return;
	}

	const target = touchDropTarget.value;
	const session = touchDragSession;

	if (session != null && target != null) {
		const handler = touchDropHandlers.get(target.instanceId);
		if (handler != null) {
			dropCallback?.(target.instanceId);
			handler(session.item, session.group, target.itemId, target.area === 'backward');
		}
	} else if (session != null) {
		// emptyDropArea にドロップしたか確認
		const endTouch = findTouchByIdentifier(ev.changedTouches, touchPending.identifier);
		if (endTouch != null) {
			if (touchGhostEl != null) touchGhostEl.style.display = 'none';
			const el = window.document.elementFromPoint(endTouch.clientX, endTouch.clientY) as HTMLElement | null;
			const emptyEl = el?.closest<HTMLElement>('[data-mk-draggable-empty-instance-id]');
			if (emptyEl != null) {
				const targetInstanceId = emptyEl.dataset.mkDraggableEmptyInstanceId;
				if (targetInstanceId != null) {
					const handler = touchEmptyDropHandlers.get(targetInstanceId);
					if (handler != null) {
						dropCallback?.(targetInstanceId);
						handler(session.item, session.group);
					}
				}
			}
		}
	}

	cleanupTouchDrag();
}

// ---------- レジストリ登録 ----------

touchDropHandlers.set(instanceId, (draggedItem, sourceGroup, targetItemId, backward) => {
	applyDrop(draggedItem as T, sourceGroup, targetItemId, backward);
});
touchEmptyDropHandlers.set(instanceId, (draggedItem, sourceGroup) => {
	if (sourceGroup !== group) return;
	emit('update:modelValue', [draggedItem as T]);
});

onBeforeUnmount(() => {
	touchDropHandlers.delete(instanceId);
	touchEmptyDropHandlers.delete(instanceId);
	if (touchDragSession?.instanceId === instanceId) {
		cleanupTouchDrag();
	} else if (touchPending != null) {
		// 長押し成立前 (touchPending のみ、touchDragSession 未開始) に unmount された場合の
		// window listener / タイマーリーク対策
		clearTouchLongPress();
		restoreTouchSourceDraggable();
		touchPending = null;
		teardownTouchListeners();
	}
});
</script>

<style lang="scss" module>
.transition_items_move,
.transition_items_enterActive,
.transition_items_leaveActive {
	transition: all 0.15s ease;
}
.transition_items_enterFrom,
.transition_items_leaveTo {
	opacity: 0;
}
.transition_items_leaveActive {
	position: absolute;
}

.items {
	display: flex;
	align-items: center;
	justify-content: left;
	flex-wrap: wrap;
}

.items.horizontal {
	flex-direction: row;
}
.items.vertical {
	flex-direction: column;
}

.item {
	position: relative;

	// 縦スクロール (= ページスクロール) はブラウザに譲り、それ以外のタッチジェスチャ
	// (横スワイプやピンチズーム等) は抑止する。指を動かせばスクロール、指を止めれば
	// 長押し成立 → 並び替えという直感的な切り替えになる。横方向 MkDraggable でも
	// ページの縦スクロールは通したいので、direction によらず一律 pan-y。
	// ※ 横スクロール可能なコンテナに horizontal MkDraggable を入れる場合は、利用側で
	//   `touch-action` を上書きする必要がある。
	touch-action: pan-y;

	// iOS: 長押し時のコンテキストメニュー (Copy / Define / リンクプレビュー等) を抑止 —
	// 長押しドラッグと競合するため。
	-webkit-touch-callout: none;
}

// タッチデバイスでのみ text selection を抑止 (PC では選択を残す)。
// pointer:coarse + hover:none で touch-primary 端末を判定。
@media (hover: none) and (pointer: coarse) {
	.item {
		-webkit-user-select: none;
		user-select: none;
	}

	// form 要素や contenteditable は子で選択可に戻す
	.item :where(textarea, input, [contenteditable]) {
		-webkit-user-select: auto;
		user-select: auto;
	}
}

.items.vertical .item {
	width: 100%;
}

.items.horizontal.withGaps {
	row-gap: var(--MI-margin);
}

.items.horizontal.withGaps .item {
	padding-left: calc(var(--MI-margin) / 2);
	padding-right: calc(var(--MI-margin) / 2);
}

.items.vertical.withGaps .item {
	padding-top: calc(var(--MI-margin) / 2);
	padding-bottom: calc(var(--MI-margin) / 2);
}

.forwardArea, .backwardArea {
	position: absolute;
	z-index: 1;
	pointer-events: none;
}

.items.dragging {
	.forwardArea, .backwardArea {
		pointer-events: auto;
	}
}

.items.horizontal {
	.forwardArea {
		top: 0;
		left: 0;
		width: 50%;
		height: 100%;
	}

	.backwardArea {
		top: 0;
		right: 0;
		width: 50%;
		height: 100%;
	}
}

.items.vertical {
	.forwardArea {
		top: 0;
		left: 0;
		width: 100%;
		height: 50%;
	}

	.backwardArea {
		bottom: 0;
		left: 0;
		width: 100%;
		height: 50%;
	}
}

.items.canNest.horizontal {
	.forwardArea, .backwardArea {
		width: 30px;
	}
}

.items.canNest.vertical {
	.forwardArea, .backwardArea {
		height: 30px;
	}
}

.dropReady::before {
	content: '';
	position: absolute;
	z-index: 99999;
	background: var(--MI_THEME-accent);
	border-radius: 999px;
	pointer-events: none;
}

.items.horizontal {
	.forwardArea.dropReady::before {
		top: 0;
		left: -1px;
		width: 2px;
		height: 100%;
	}

	.backwardArea.dropReady::before {
		top: 0;
		right: -1px;
		width: 2px;
		height: 100%;
	}
}

.items.vertical {
	.forwardArea.dropReady::before {
		top: -1px;
		left: 0;
		width: 100%;
		height: 2px;
	}

	.backwardArea.dropReady::before {
		bottom: -1px;
		left: 0;
		width: 100%;
		height: 2px;
	}
}

.items.horizontal .emptyDropArea {
	width: 40px;
	height: 40px;
}

.items.vertical .emptyDropArea {
	width: 100%;
	height: 50px;
}
</style>
