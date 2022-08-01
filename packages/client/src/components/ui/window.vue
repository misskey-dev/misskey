<template>
<transition :name="$store.state.animation ? 'window' : ''" appear @after-leave="$emit('closed')">
	<div v-if="showing" ref="rootEl" class="ebkgocck" :class="{ maximized }">
		<div class="body _shadow _narrow_" @mousedown="onBodyMousedown" @keydown="onKeydown">
			<div class="header" :class="{ mini }" @contextmenu.prevent.stop="onContextmenu">
				<span class="left">
					<button v-for="button in buttonsLeft" v-tooltip="button.title" class="button _button" :class="{ highlighted: button.highlighted }" @click="button.onClick"><i :class="button.icon"></i></button>
				</span>
				<span class="title" @mousedown.prevent="onHeaderMousedown" @touchstart.prevent="onHeaderMousedown">
					<slot name="header"></slot>
				</span>
				<span class="right">
					<button v-for="button in buttonsRight" v-tooltip="button.title" class="button _button" :class="{ highlighted: button.highlighted }" @click="button.onClick"><i :class="button.icon"></i></button>
					<button v-if="canResize && maximized" class="button _button" @click="unMaximize()"><i class="fas fa-window-restore"></i></button>
					<button v-else-if="canResize && !maximized" class="button _button" @click="maximize()"><i class="fas fa-window-maximize"></i></button>
					<button v-if="closeButton" class="button _button" @click="close()"><i class="fas fa-times"></i></button>
				</span>
			</div>
			<div class="body">
				<slot></slot>
			</div>
		</div>
		<template v-if="canResize">
			<div class="handle top" @mousedown.prevent="onTopHandleMousedown"></div>
			<div class="handle right" @mousedown.prevent="onRightHandleMousedown"></div>
			<div class="handle bottom" @mousedown.prevent="onBottomHandleMousedown"></div>
			<div class="handle left" @mousedown.prevent="onLeftHandleMousedown"></div>
			<div class="handle top-left" @mousedown.prevent="onTopLeftHandleMousedown"></div>
			<div class="handle top-right" @mousedown.prevent="onTopRightHandleMousedown"></div>
			<div class="handle bottom-right" @mousedown.prevent="onBottomRightHandleMousedown"></div>
			<div class="handle bottom-left" @mousedown.prevent="onBottomLeftHandleMousedown"></div>
		</template>
	</div>
</transition>
</template>

<script lang="ts" setup>
import { onBeforeUnmount, onMounted, provide } from 'vue';
import contains from '@/scripts/contains';
import * as os from '@/os';
import { MenuItem } from '@/types/menu';

const minHeight = 50;
const minWidth = 250;

function dragListen(fn: (ev: MouseEvent) => void) {
	window.addEventListener('mousemove', fn);
	window.addEventListener('touchmove', fn);
	window.addEventListener('mouseleave', dragClear.bind(null, fn));
	window.addEventListener('mouseup', dragClear.bind(null, fn));
	window.addEventListener('touchend', dragClear.bind(null, fn));
}

function dragClear(fn) {
	window.removeEventListener('mousemove', fn);
	window.removeEventListener('touchmove', fn);
	window.removeEventListener('mouseleave', dragClear);
	window.removeEventListener('mouseup', dragClear);
	window.removeEventListener('touchend', dragClear);
}

const props = withDefaults(defineProps<{
	initialWidth?: number;
	initialHeight?: number | null;
	canResize?: boolean;
	closeButton?: boolean;
	mini?: boolean;
	front?: boolean;
	contextmenu?: MenuItem[] | null;
	buttonsLeft?: any[];
	buttonsRight?: any[];
}>(), {
	initialWidth: 400,
	initialHeight: null,
	canResize: false,
	closeButton: true,
	mini: false,
	front: false,
	contextmenu: null,
	buttonsLeft: () => [],
	buttonsRight: () => [],
});

const emit = defineEmits<{
	(ev: 'closed'): void;
}>();

provide('inWindow', true);

let rootEl = $ref<HTMLElement | null>();
let showing = $ref(true);
let beforeClickedAt = 0;
let maximized = $ref(false);
let unMaximizedTop = '';
let unMaximizedLeft = '';
let unMaximizedWidth = '';
let unMaximizedHeight = '';

function close() {
	showing = false;
}

function onKeydown(evt) {
	if (evt.which === 27) { // Esc
		evt.preventDefault();
		evt.stopPropagation();
		close();
	}
}

function onContextmenu(ev: MouseEvent) {
	if (props.contextmenu) {
		os.contextMenu(props.contextmenu, ev);
	}
}

// 最前面へ移動
function top() {
	if (rootEl) {
		rootEl.style.zIndex = os.claimZIndex(props.front ? 'middle' : 'low');
	}
}

function maximize() {
	maximized = true;
	unMaximizedTop = rootEl.style.top;
	unMaximizedLeft = rootEl.style.left;
	unMaximizedWidth = rootEl.style.width;
	unMaximizedHeight = rootEl.style.height;
	rootEl.style.top = '0';
	rootEl.style.left = '0';
	rootEl.style.width = '100%';
	rootEl.style.height = '100%';
}

function unMaximize() {
	maximized = false;
	rootEl.style.top = unMaximizedTop;
	rootEl.style.left = unMaximizedLeft;
	rootEl.style.width = unMaximizedWidth;
	rootEl.style.height = unMaximizedHeight;
}

function onBodyMousedown() {
	top();
}

function onDblClick() {
	maximize();
}

function onHeaderMousedown(evt: MouseEvent) {
	// 右クリックはコンテキストメニューを開こうとした可能性が高いため無視
	if (evt.button === 2) return;

	let beforeMaximized = false;

	if (maximized) {
		beforeMaximized = true;
		unMaximize();
	}

	// ダブルクリック判定
	if (Date.now() - beforeClickedAt < 300) {
		beforeClickedAt = Date.now();
		onDblClick();
		return;
	}

	beforeClickedAt = Date.now();

	const main = rootEl;
	if (main == null) return;

	if (!contains(main, document.activeElement)) main.focus();

	const position = main.getBoundingClientRect();

	const clickX = evt.touches && evt.touches.length > 0 ? evt.touches[0].clientX : evt.clientX;
	const clickY = evt.touches && evt.touches.length > 0 ? evt.touches[0].clientY : evt.clientY;
	const moveBaseX = beforeMaximized ? parseInt(unMaximizedWidth, 10) / 2 : clickX - position.left; // TODO: parseIntやめる
	const moveBaseY = beforeMaximized ? 20 : clickY - position.top;
	const browserWidth = window.innerWidth;
	const browserHeight = window.innerHeight;
	const windowWidth = main.offsetWidth;
	const windowHeight = main.offsetHeight;

	function move(x: number, y: number) {
		let moveLeft = x - moveBaseX;
		let moveTop = y - moveBaseY;

		// 下はみ出し
		if (moveTop + windowHeight > browserHeight) moveTop = browserHeight - windowHeight;

		// 左はみ出し
		if (moveLeft < 0) moveLeft = 0;

		// 上はみ出し
		if (moveTop < 0) moveTop = 0;

		// 右はみ出し
		if (moveLeft + windowWidth > browserWidth) moveLeft = browserWidth - windowWidth;

		rootEl.style.left = moveLeft + 'px';
		rootEl.style.top = moveTop + 'px';
	}

	if (beforeMaximized) {
		move(clickX, clickY);
	}

	// 動かした時
	dragListen(me => {
		const x = me.touches && me.touches.length > 0 ? me.touches[0].clientX : me.clientX;
		const y = me.touches && me.touches.length > 0 ? me.touches[0].clientY : me.clientY;

		move(x, y);
	});
}

// 上ハンドル掴み時
function onTopHandleMousedown(evt) {
	const main = rootEl;

	const base = evt.clientY;
	const height = parseInt(getComputedStyle(main, '').height, 10);
	const top = parseInt(getComputedStyle(main, '').top, 10);

	// 動かした時
	dragListen(me => {
		const move = me.clientY - base;
		if (top + move > 0) {
			if (height + -move > minHeight) {
				applyTransformHeight(height + -move);
				applyTransformTop(top + move);
			} else { // 最小の高さより小さくなろうとした時
				applyTransformHeight(minHeight);
				applyTransformTop(top + (height - minHeight));
			}
		} else { // 上のはみ出し時
			applyTransformHeight(top + height);
			applyTransformTop(0);
		}
	});
}

// 右ハンドル掴み時
function onRightHandleMousedown(evt) {
	const main = rootEl;

	const base = evt.clientX;
	const width = parseInt(getComputedStyle(main, '').width, 10);
	const left = parseInt(getComputedStyle(main, '').left, 10);
	const browserWidth = window.innerWidth;

	// 動かした時
	dragListen(me => {
		const move = me.clientX - base;
		if (left + width + move < browserWidth) {
			if (width + move > minWidth) {
				applyTransformWidth(width + move);
			} else { // 最小の幅より小さくなろうとした時
				applyTransformWidth(minWidth);
			}
		} else { // 右のはみ出し時
			applyTransformWidth(browserWidth - left);
		}
	});
}

// 下ハンドル掴み時
function onBottomHandleMousedown(evt) {
	const main = rootEl;

	const base = evt.clientY;
	const height = parseInt(getComputedStyle(main, '').height, 10);
	const top = parseInt(getComputedStyle(main, '').top, 10);
	const browserHeight = window.innerHeight;

	// 動かした時
	dragListen(me => {
		const move = me.clientY - base;
		if (top + height + move < browserHeight) {
			if (height + move > minHeight) {
				applyTransformHeight(height + move);
			} else { // 最小の高さより小さくなろうとした時
				applyTransformHeight(minHeight);
			}
		} else { // 下のはみ出し時
			applyTransformHeight(browserHeight - top);
		}
	});
}

// 左ハンドル掴み時
function onLeftHandleMousedown(evt) {
	const main = rootEl;

	const base = evt.clientX;
	const width = parseInt(getComputedStyle(main, '').width, 10);
	const left = parseInt(getComputedStyle(main, '').left, 10);

	// 動かした時
	dragListen(me => {
		const move = me.clientX - base;
		if (left + move > 0) {
			if (width + -move > minWidth) {
				applyTransformWidth(width + -move);
				applyTransformLeft(left + move);
			} else { // 最小の幅より小さくなろうとした時
				applyTransformWidth(minWidth);
				applyTransformLeft(left + (width - minWidth));
			}
		} else { // 左のはみ出し時
			applyTransformWidth(left + width);
			applyTransformLeft(0);
		}
	});
}

// 左上ハンドル掴み時
function onTopLeftHandleMousedown(evt) {
	onTopHandleMousedown(evt);
	onLeftHandleMousedown(evt);
}

// 右上ハンドル掴み時
function onTopRightHandleMousedown(evt) {
	onTopHandleMousedown(evt);
	onRightHandleMousedown(evt);
}

// 右下ハンドル掴み時
function onBottomRightHandleMousedown(evt) {
	onBottomHandleMousedown(evt);
	onRightHandleMousedown(evt);
}

// 左下ハンドル掴み時
function onBottomLeftHandleMousedown(evt) {
	onBottomHandleMousedown(evt);
	onLeftHandleMousedown(evt);
}

// 高さを適用
function applyTransformHeight(height) {
	if (height > window.innerHeight) height = window.innerHeight;
	rootEl.style.height = height + 'px';
}

// 幅を適用
function applyTransformWidth(width) {
	if (width > window.innerWidth) width = window.innerWidth;
	rootEl.style.width = width + 'px';
}

// Y座標を適用
function applyTransformTop(top) {
	rootEl.style.top = top + 'px';
}

// X座標を適用
function applyTransformLeft(left) {
	rootEl.style.left = left + 'px';
}

function onBrowserResize() {
	const main = rootEl;
	const position = main.getBoundingClientRect();
	const browserWidth = window.innerWidth;
	const browserHeight = window.innerHeight;
	const windowWidth = main.offsetWidth;
	const windowHeight = main.offsetHeight;
	if (position.left < 0) main.style.left = '0'; // 左はみ出し
	if (position.top + windowHeight > browserHeight) main.style.top = browserHeight - windowHeight + 'px'; // 下はみ出し
	if (position.left + windowWidth > browserWidth) main.style.left = browserWidth - windowWidth + 'px'; // 右はみ出し
	if (position.top < 0) main.style.top = '0'; // 上はみ出し
}

onMounted(() => {
	if (props.initialWidth) applyTransformWidth(props.initialWidth);
	if (props.initialHeight) applyTransformHeight(props.initialHeight);

	applyTransformTop((window.innerHeight / 2) - (rootEl.offsetHeight / 2));
	applyTransformLeft((window.innerWidth / 2) - (rootEl.offsetWidth / 2));

	// 他のウィンドウ内のボタンなどを押してこのウィンドウが開かれた場合、親が最前面になろうとするのでそれに隠されないようにする
	top();

	window.addEventListener('resize', onBrowserResize);
});

onBeforeUnmount(() => {
	window.removeEventListener('resize', onBrowserResize);
});

defineExpose({
	close,
});
</script>

<style lang="scss" scoped>
.window-enter-active, .window-leave-active {
	transition: opacity 0.2s, transform 0.2s !important;
}
.window-enter-from, .window-leave-to {
	pointer-events: none;
	opacity: 0;
	transform: scale(0.9);
}

.ebkgocck {
	position: fixed;
	top: 0;
	left: 0;

	> .body {
		overflow: clip;
		display: flex;
		flex-direction: column;
		contain: content;
		width: 100%;
		height: 100%;
		border-radius: var(--radius);

		> .header {
			--height: 42px;

			&.mini {
				--height: 38px;
			}

			display: flex;
			position: relative;
			z-index: 1;
			flex-shrink: 0;
			user-select: none;
			height: var(--height);
			background: var(--windowHeader);
			-webkit-backdrop-filter: var(--blur, blur(15px));
			backdrop-filter: var(--blur, blur(15px));
			//border-bottom: solid 1px var(--divider);
			font-size: 95%;
			font-weight: bold;

			> .left, > .right {
				> .button {
					height: var(--height);
					width: var(--height);

					&:hover {
						color: var(--fgHighlighted);
					}

					&.highlighted {
						color: var(--accent);
					}
				}
			}

			> .left {
				margin-right: 16px;
			}

			> .right {
				min-width: 16px;
			}

			> .title {
				flex: 1;
				position: relative;
				line-height: var(--height);
				white-space: nowrap;
				overflow: hidden;
				text-overflow: ellipsis;
				cursor: move;
			}
		}

		> .body {
			flex: 1;
			overflow: auto;
			background: var(--panel);
		}
	}

	> .handle {
		$size: 8px;

		position: absolute;

		&.top {
			top: -($size);
			left: 0;
			width: 100%;
			height: $size;
			cursor: ns-resize;
		}

		&.right {
			top: 0;
			right: -($size);
			width: $size;
			height: 100%;
			cursor: ew-resize;
		}

		&.bottom {
			bottom: -($size);
			left: 0;
			width: 100%;
			height: $size;
			cursor: ns-resize;
		}

		&.left {
			top: 0;
			left: -($size);
			width: $size;
			height: 100%;
			cursor: ew-resize;
		}

		&.top-left {
			top: -($size);
			left: -($size);
			width: $size * 2;
			height: $size * 2;
			cursor: nwse-resize;
		}

		&.top-right {
			top: -($size);
			right: -($size);
			width: $size * 2;
			height: $size * 2;
			cursor: nesw-resize;
		}

		&.bottom-right {
			bottom: -($size);
			right: -($size);
			width: $size * 2;
			height: $size * 2;
			cursor: nwse-resize;
		}

		&.bottom-left {
			bottom: -($size);
			left: -($size);
			width: $size * 2;
			height: $size * 2;
			cursor: nesw-resize;
		}
	}

	&.maximized {
		> .body {
			border-radius: 0;
		}
	}
}
</style>
