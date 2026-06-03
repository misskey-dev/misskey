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
	>
	</div>
	<div
		v-for="(item, i) in modelValue"
		:key="`MkDraggableRoot:${item.id}`"
		:class="$style.item"
		:data-mk-draggable-item-root="item.id"
		@pointerdown="manualDragStart ? undefined : onPointerDown($event, item)"
		@contextmenu="onContextmenu"
	>
		<div
			:class="[$style.forwardArea, { [$style.dropReady]: isDropReady(item.id, 'forward') }]"
			:data-mk-draggable-area="'forward'"
			:data-mk-draggable-item-id="item.id"
			:data-mk-draggable-instance-id="instanceId"
		></div>
		<div :key="`MkDraggableItem:${item.id}`" style="position: relative; z-index: 0;">
			<slot :item="item" :index="i" :pointerStart="(ev: PointerEvent) => onPointerDown(ev, item)"></slot>
		</div>
		<div
			:class="[$style.backwardArea, { [$style.dropReady]: isDropReady(item.id, 'backward') }]"
			:data-mk-draggable-area="'backward'"
			:data-mk-draggable-item-id="item.id"
			:data-mk-draggable-instance-id="instanceId"
		></div>
	</div>
	<slot name="footer"></slot>
</TransitionGroup>
</template>

<script lang="ts">
import { ref } from 'vue';

// インスタンス間でドラッグセッションを連携するため module-level に状態を持つ。
// Pointer Events に統一したことで HTML5 drag-and-drop の DataTransfer を介した
// シリアライズが不要になり、ハンドラレジストリ 1 つだけで完結する。
const dragging = ref(false);

// handler は group 不一致等で no-op の場合 false を返す。source 側はこの戻り値を見て
// `removeSourceCallback` の発火可否を決め、別 group へドロップした時の item 消失を防ぐ。
type DropHandler = (item: { id: string }, sourceGroup: string, targetItemId: string, backward: boolean) => boolean;
type EmptyDropHandler = (item: { id: string }, sourceGroup: string) => boolean;
const dropHandlers = new Map<string, DropHandler>();
const emptyDropHandlers = new Map<string, EmptyDropHandler>();

const dropTarget = ref<{ instanceId: string; itemId: string; area: 'forward' | 'backward' } | null>(null);
</script>

<script lang="ts" setup generic="T extends { id: string; }">
import { onBeforeUnmount } from 'vue';
import { genId } from '@/utility/id.js';

/**
 * default スロットの `pointerStart` を `manualDragStart=true` のハンドル要素に配線する場合、
 * そのハンドル要素には CSS で `touch-action: none` を指定すること。
 * Pointer Events 仕様 (§11.1) によりブラウザは pointerdown の瞬間にジェスチャ判定を確定する
 * ため、JS から後で touch-action を書き換えても間に合わない。touch-action: none を予め
 * 指定しておかないと、ハンドルを掴んでから指を縦に動かした瞬間にブラウザがスクロール
 * ジェスチャを始めて pointercancel を投げてくる。
 */
const slots = defineSlots<{
	default(props: { item: T; index: number; pointerStart: (ev: PointerEvent) => void }): any;
	header(): any;
	footer(): any;
}>();

const props = withDefaults(defineProps<{
	modelValue: T[];
	direction: 'horizontal' | 'vertical';
	group?: string | null;
	manualDragStart?: boolean;
	withGaps?: boolean;
	canNest?: boolean;
}>(), {
	group: null,
	manualDragStart: false,
	withGaps: false,
	canNest: false,
});

const emit = defineEmits<{
	(ev: 'update:modelValue', value: T[]): void;
}>();

const instanceId = genId();
const group = props.group ?? instanceId;

function isDropReady(itemId: T['id'], area: 'forward' | 'backward'): boolean {
	const t = dropTarget.value;
	return t != null && t.instanceId === instanceId && t.itemId === itemId && t.area === area;
}

function applyDrop(draggedItem: T, sourceGroup: string, targetItemId: T['id'], backward: boolean): boolean {
	if (sourceGroup !== group || draggedItem.id === targetItemId) return false;

	const fromIndex = props.modelValue.findIndex(x => x.id === draggedItem.id);
	let toIndex = props.modelValue.findIndex(x => x.id === targetItemId);

	const newValue = [...props.modelValue];
	if (fromIndex > -1) newValue.splice(fromIndex, 1);
	toIndex = newValue.findIndex(x => x.id === targetItemId);
	if (backward) toIndex += 1;
	newValue.splice(toIndex, 0, draggedItem);

	emit('update:modelValue', newValue);
	return true;
}

// ---------- pointer events ----------

const LONG_PRESS_MS = 400;
const MOVE_THRESHOLD_PX = 8;

type Pending = {
	pointerId: number;
	pointerType: string;
	x: number;
	y: number;
	captureTarget: HTMLElement;
	sourceElement: HTMLElement | null;
	item: T;
};

let pending: Pending | null = null;
let longPressTimer: number | null = null;
let dragActive = false;
let dragSession: { item: T; instanceId: string; group: string } | null = null;
let ghostEl: HTMLElement | null = null;
let removeSourceCallback: (() => void) | null = null;

function clearLongPress() {
	if (longPressTimer != null) {
		window.clearTimeout(longPressTimer);
		longPressTimer = null;
	}
}

function detachPointerListeners() {
	if (pending == null) return;
	pending.captureTarget.removeEventListener('pointermove', onPointerMove);
	pending.captureTarget.removeEventListener('pointerup', onPointerUp);
	pending.captureTarget.removeEventListener('pointercancel', onPointerCancel);
}

function releaseCapture() {
	if (pending == null) return;
	try {
		if (pending.captureTarget.hasPointerCapture(pending.pointerId)) {
			pending.captureTarget.releasePointerCapture(pending.pointerId);
		}
	} catch {
		// noop
	}
}

function cleanup() {
	detachPointerListeners();
	releaseCapture();
	clearLongPress();
	const wasTouch = pending?.pointerType === 'touch';
	dragActive = false;
	dragSession = null;
	pending = null;
	dropTarget.value = null;
	dragging.value = false;
	removeSourceCallback = null;
	if (ghostEl != null) {
		ghostEl.remove();
		ghostEl = null;
	}
	if (wasTouch) {
		// cleanup の後にも contextmenu が遅延して飛んでくる経路があるため、少し遅らせて外す
		scheduleContextmenuSuppressorRelease();
	}
}

// タッチ長押し中、ブラウザ / OS が contextmenu イベントを投げてくることへの対策。
// 経路がいくつかあって厄介:
//   1. .item div 上の listener で stopPropagation するだけでは pointercancel → cleanup
//      の後に contextmenu が発火するケースで `pending`/`dragActive` が false になっており
//      捕捉できない (祖先の Misskey 共通 contextmenu に到達してしまう)。
//   2. キャプチャ要素の touch-action: none だけでは contextmenu イベント自体は抑止できない。
//   3. Misskey 側の `@contextmenu` リスナーは祖先側 (universal.vue 等) にも複数存在し、
//      .stop 修飾子 (bubble 中の stopPropagation) を尊重して順序通り発火する。
//
// 対策: touch pointerdown と同時に document に capture phase で contextmenu を
// 完全抑止する listener を張り、cleanup 後しばらく ( SUPPRESS_AFTER_CLEANUP_MS )
// 残してから外す。これで上記すべての timing で確実に止められる。
const SUPPRESS_AFTER_CLEANUP_MS = 500;
let contextmenuSuppressorActive = false;
let contextmenuSuppressorTimer: number | null = null;

function suppressContextmenuListener(ev: Event) {
	ev.preventDefault();
	ev.stopImmediatePropagation();
}

function attachContextmenuSuppressor() {
	if (contextmenuSuppressorActive) return;
	contextmenuSuppressorActive = true;
	window.document.addEventListener('contextmenu', suppressContextmenuListener, { capture: true });
}

function scheduleContextmenuSuppressorRelease() {
	if (contextmenuSuppressorTimer != null) {
		window.clearTimeout(contextmenuSuppressorTimer);
	}
	contextmenuSuppressorTimer = window.setTimeout(() => {
		window.document.removeEventListener('contextmenu', suppressContextmenuListener, { capture: true });
		contextmenuSuppressorActive = false;
		contextmenuSuppressorTimer = null;
	}, SUPPRESS_AFTER_CLEANUP_MS);
}

// .item div 上では PC の右クリックも捕まえるので、touch session 外は何もしない。
// (タッチ経路は document の capture phase suppressor 側で抑止される)
function onContextmenu(ev: MouseEvent) {
	if (pending != null || dragActive) {
		ev.preventDefault();
		ev.stopPropagation();
	}
}

function onPointerDown(ev: PointerEvent, item: T) {
	if (pending != null || dragActive) return;
	// mouse は左ボタンだけ受け付ける (右クリックメニュー等を阻害しない)
	if (ev.pointerType === 'mouse' && ev.button !== 0) return;

	// capture / listener 対象は ev.currentTarget (= ハンドル button などの小さい要素) ではなく
	// MkDraggable の `.item` div を選ぶ。これで指がハンドルの矩形を外れても capture が保持され、
	// pointermove が滑らかに届き続ける。また button 固有の implicit pointer release 挙動
	// (focus 抜け・blur 時の解放など) に左右されない。
	const origin = ev.currentTarget as HTMLElement;
	const itemEl = origin.closest<HTMLElement>(`[data-mk-draggable-item-root="${CSS.escape(item.id)}"]`) ?? origin;
	const captureTarget = itemEl;
	const sourceElement = itemEl;

	pending = {
		pointerId: ev.pointerId,
		pointerType: ev.pointerType,
		x: ev.clientX,
		y: ev.clientY,
		captureTarget,
		sourceElement,
		item,
	};

	// 祖先の Misskey 共通コンテキストメニューが暴発しないよう document に capture phase で抑止を張る
	// (詳細は suppressContextmenuListener 付近のコメント参照)
	if (ev.pointerType === 'touch') {
		attachContextmenuSuppressor();
	}

	try {
		captureTarget.setPointerCapture(ev.pointerId);
	} catch {
		// noop
	}

	captureTarget.addEventListener('pointermove', onPointerMove);
	captureTarget.addEventListener('pointerup', onPointerUp);
	captureTarget.addEventListener('pointercancel', onPointerCancel);

	if (props.manualDragStart) {
		// ハンドル経由は明示的な意図表明なので即時開始
		startDrag();
	} else if (ev.pointerType === 'touch') {
		// 行全体掴み × touch では touch-action: pan-y がスクロールを横取りするため、
		// 動かしてから開始する方式は構造的に成立しない。SortableJS や iOS の編集モード
		// 等と同じ「長押しで並び替え、動かせばスクロール」の挙動に統一する。
		longPressTimer = window.setTimeout(startDrag, LONG_PRESS_MS);
	}
	// それ以外 (mouse / pen): pointermove で MOVE_THRESHOLD_PX を超えたら開始
}

function startDrag() {
	if (pending == null) return;
	dragActive = true;
	const item = pending.item;
	dragSession = { item, instanceId, group };
	dragging.value = true;

	// mouse は textnode の選択が始まっていることがあるのでクリアする
	if (pending.pointerType === 'mouse') {
		window.getSelection()?.removeAllRanges();
	}

	if (pending.sourceElement != null) {
		const rect = pending.sourceElement.getBoundingClientRect();
		const ghost = pending.sourceElement.cloneNode(true) as HTMLElement;
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
		// Ghost は body 直下に配置されるため container-type を持つ祖先が外れる。
		// 子孫の @container クエリ (例: profile の .fieldDragItem) が元と同じ評価結果に
		// なるよう、Ghost 自身を inline-size container にする。
		ghost.style.containerType = 'inline-size';
		window.document.body.appendChild(ghost);
		ghostEl = ghost;
	}

	removeSourceCallback = () => {
		const newValue = props.modelValue.filter(x => x.id !== item.id);
		emit('update:modelValue', newValue);
	};

	if (pending.pointerType === 'touch' && 'vibrate' in navigator) {
		try {
			navigator.vibrate(30);
		} catch {
			// noop
		}
	}
}

function onPointerMove(ev: PointerEvent) {
	if (pending == null || ev.pointerId !== pending.pointerId) return;

	if (!dragActive) {
		const dx = Math.abs(ev.clientX - pending.x);
		const dy = Math.abs(ev.clientY - pending.y);
		const moved = dx > MOVE_THRESHOLD_PX || dy > MOVE_THRESHOLD_PX;
		if (!moved) return;

		if (pending.pointerType === 'touch') {
			// 長押し成立前に動いたら通常スクロールに譲る (タッチのみ)
			cleanup();
		} else {
			// mouse / pen: 動き出した瞬間がドラッグ開始トリガー。
			// 動かさず pointerup (=click) は dragActive=false のまま素通し。
			startDrag();
		}
		return;
	}

	// drag 中
	if (pending.pointerType === 'touch') {
		// タッチ時のみ、スクロールへの誤伝播を防ぐため preventDefault。
		// mouse / pen は元々スクロールジェスチャを持たないので不要。
		ev.preventDefault();
	}

	if (ghostEl != null) {
		const dx = ev.clientX - pending.x;
		const dy = ev.clientY - pending.y;
		ghostEl.style.transform = `translate(${dx}px, ${dy}px)`;
	}

	// elementFromPoint で実際のドロップターゲットを判定 (ghostは一時的に隠す)
	const prevDisplay = ghostEl?.style.display ?? '';
	if (ghostEl != null) ghostEl.style.display = 'none';
	const el = window.document.elementFromPoint(ev.clientX, ev.clientY) as HTMLElement | null;
	if (ghostEl != null) ghostEl.style.display = prevDisplay;

	if (el == null) {
		dropTarget.value = null;
		return;
	}

	const areaEl = el.closest<HTMLElement>('[data-mk-draggable-area]');
	if (areaEl != null) {
		const targetInstanceId = areaEl.dataset.mkDraggableInstanceId;
		const targetItemId = areaEl.dataset.mkDraggableItemId;
		const area = areaEl.dataset.mkDraggableArea as 'forward' | 'backward' | undefined;
		if (targetInstanceId != null && targetItemId != null && (area === 'forward' || area === 'backward')) {
			dropTarget.value = { instanceId: targetInstanceId, itemId: targetItemId, area };
			return;
		}
	}
	dropTarget.value = null;
}

function onPointerUp(ev: PointerEvent) {
	if (pending == null || ev.pointerId !== pending.pointerId) return;

	if (!dragActive) {
		// tap (動かさず離した) のケース: click 合成を妨げないようそのまま終了
		cleanup();
		return;
	}

	const target = dropTarget.value;
	const session = dragSession;

	if (session != null && target != null) {
		const handler = dropHandlers.get(target.instanceId);
		if (handler != null) {
			// target 側で処理が成立した (group 一致等) 場合のみ source から削除
			const accepted = handler(session.item, session.group, target.itemId, target.area === 'backward');
			if (accepted && target.instanceId !== instanceId) {
				removeSourceCallback?.();
			}
		}
	} else if (session != null) {
		// emptyDropArea にドロップしたか確認
		const prevDisplay = ghostEl?.style.display ?? '';
		if (ghostEl != null) ghostEl.style.display = 'none';
		const el = window.document.elementFromPoint(ev.clientX, ev.clientY) as HTMLElement | null;
		if (ghostEl != null) ghostEl.style.display = prevDisplay;
		const emptyEl = el?.closest<HTMLElement>('[data-mk-draggable-empty-instance-id]');
		if (emptyEl != null) {
			const targetInstanceId = emptyEl.dataset.mkDraggableEmptyInstanceId;
			if (targetInstanceId != null) {
				const handler = emptyDropHandlers.get(targetInstanceId);
				if (handler != null) {
					const accepted = handler(session.item, session.group);
					if (accepted && targetInstanceId !== instanceId) {
						removeSourceCallback?.();
					}
				}
			}
		}
	}

	cleanup();
}

function onPointerCancel(ev: PointerEvent) {
	if (pending == null || ev.pointerId !== pending.pointerId) return;
	cleanup();
}

// ---------- registry ----------

dropHandlers.set(instanceId, (draggedItem, sourceGroup, targetItemId, backward) => {
	return applyDrop(draggedItem as T, sourceGroup, targetItemId, backward);
});
emptyDropHandlers.set(instanceId, (draggedItem, sourceGroup) => {
	if (sourceGroup !== group) return false;
	emit('update:modelValue', [draggedItem as T]);
	return true;
});

onBeforeUnmount(() => {
	dropHandlers.delete(instanceId);
	emptyDropHandlers.delete(instanceId);
	// 自インスタンスがドラッグ中 / 待機中だった場合はリスナーリーク防止のため cleanup
	if (dragSession?.instanceId === instanceId || pending != null) {
		cleanup();
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
