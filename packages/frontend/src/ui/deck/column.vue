<template>
<!-- sectionを利用しているのは、deck.vue側でcolumnに対してfirst-of-typeを効かせるため -->
<section
	v-hotkey="keymap"
	:class="[$style.root, { [$style.paged]: isMainColumn, [$style.naked]: naked, [$style.active]: active, [$style.isStacked]: isStacked, [$style.draghover]: draghover, [$style.dragging]: dragging, [$style.dropready]: dropready }]"
	@dragover.prevent.stop="onDragover"
	@dragleave="onDragleave"
	@drop.prevent.stop="onDrop"
>
	<header
		:class="[$style.header]"
		draggable="true"
		@click="goTop"
		@dragstart="onDragstart"
		@dragend="onDragend"
		@contextmenu.prevent.stop="onContextmenu"
	>
		<button v-if="isStacked && !isMainColumn" :class="$style.toggleActive" class="_button" @click="toggleActive">
			<template v-if="active"><i class="ti ti-chevron-up"></i></template>
			<template v-else><i class="ti ti-chevron-down"></i></template>
		</button>
		<span :class="$style.title"><slot name="header"></slot></span>
		<button v-tooltip="i18n.ts.settings" :class="$style.menu" class="_button" @click.stop="showSettingsMenu"><i class="ti ti-dots"></i></button>
	</header>
	<div v-show="active" ref="body" :class="$style.body">
		<slot></slot>
	</div>
</section>
</template>

<script lang="ts" setup>
import { onBeforeUnmount, onMounted, provide, watch } from 'vue';
import { updateColumn, swapLeftColumn, swapRightColumn, swapUpColumn, swapDownColumn, stackLeftColumn, popRightColumn, removeColumn, swapColumn, Column } from './deck-store';
import * as os from '@/os';
import { i18n } from '@/i18n';
import { MenuItem } from '@/types/menu';

provide('shouldHeaderThin', true);
provide('shouldOmitHeaderTitle', true);
provide('forceSpacerMin', true);

const props = withDefaults(defineProps<{
	column: Column;
	isStacked?: boolean;
	naked?: boolean;
	menu?: MenuItem[];
}>(), {
	isStacked: false,
	naked: false,
});

const emit = defineEmits<{
	(ev: 'parent-focus', direction: 'up' | 'down' | 'left' | 'right'): void;
	(ev: 'change-active-state', v: boolean): void;
}>();

let body = $shallowRef<HTMLDivElement>();

let dragging = $ref(false);
watch($$(dragging), v => os.deckGlobalEvents.emit(v ? 'column.dragStart' : 'column.dragEnd'));

let draghover = $ref(false);
let dropready = $ref(false);

const isMainColumn = $computed(() => props.column.type === 'main');
const active = $computed(() => props.column.active !== false);
watch($$(active), v => emit('change-active-state', v));

const keymap = $computed(() => ({
	'shift+up': () => emit('parent-focus', 'up'),
	'shift+down': () => emit('parent-focus', 'down'),
	'shift+left': () => emit('parent-focus', 'left'),
	'shift+right': () => emit('parent-focus', 'right'),
}));

onMounted(() => {
	os.deckGlobalEvents.on('column.dragStart', onOtherDragStart);
	os.deckGlobalEvents.on('column.dragEnd', onOtherDragEnd);
});

onBeforeUnmount(() => {
	os.deckGlobalEvents.off('column.dragStart', onOtherDragStart);
	os.deckGlobalEvents.off('column.dragEnd', onOtherDragEnd);
});

function onOtherDragStart() {
	dropready = true;
}

function onOtherDragEnd() {
	dropready = false;
}

function toggleActive() {
	if (!props.isStacked) return;
	updateColumn(props.column.id, {
		active: !props.column.active,
	});
}

function getMenu() {
	let items = [{
		icon: 'ti ti-settings',
		text: i18n.ts._deck.configureColumn,
		action: async () => {
			const { canceled, result } = await os.form(props.column.name, {
				name: {
					type: 'string',
					label: i18n.ts.name,
					default: props.column.name,
				},
				width: {
					type: 'number',
					label: i18n.ts.width,
					default: props.column.width,
				},
				flexible: {
					type: 'boolean',
					label: i18n.ts.flexible,
					default: props.column.flexible,
				},
			});
			if (canceled) return;
			updateColumn(props.column.id, result);
		},
	}, {
		type: 'parent',
		text: i18n.ts.move + '...',
		icon: 'ti ti-arrows-move',
		children: [{
			icon: 'ti ti-arrow-left',
			text: i18n.ts._deck.swapLeft,
			action: () => {
				swapLeftColumn(props.column.id);
			},
		}, {
			icon: 'ti ti-arrow-right',
			text: i18n.ts._deck.swapRight,
			action: () => {
				swapRightColumn(props.column.id);
			},
		}, props.isStacked ? {
			icon: 'ti ti-arrow-up',
			text: i18n.ts._deck.swapUp,
			action: () => {
				swapUpColumn(props.column.id);
			},
		} : undefined, props.isStacked ? {
			icon: 'ti ti-arrow-down',
			text: i18n.ts._deck.swapDown,
			action: () => {
				swapDownColumn(props.column.id);
			},
		} : undefined],
	}, {
		icon: 'ti ti-stack-2',
		text: i18n.ts._deck.stackLeft,
		action: () => {
			stackLeftColumn(props.column.id);
		},
	}, props.isStacked ? {
		icon: 'ti ti-window-maximize',
		text: i18n.ts._deck.popRight,
		action: () => {
			popRightColumn(props.column.id);
		},
	} : undefined, null, {
		icon: 'ti ti-trash',
		text: i18n.ts.remove,
		danger: true,
		action: () => {
			removeColumn(props.column.id);
		},
	}];

	if (props.menu) {
		items.unshift(null);
		items = props.menu.concat(items);
	}

	return items;
}

function showSettingsMenu(ev: MouseEvent) {
	os.popupMenu(getMenu(), ev.currentTarget ?? ev.target);
}

function onContextmenu(ev: MouseEvent) {
	os.contextMenu(getMenu(), ev);
}

function goTop() {
	body.scrollTo({
		top: 0,
		behavior: 'smooth',
	});
}

function onDragstart(ev) {
	ev.dataTransfer.effectAllowed = 'move';
	ev.dataTransfer.setData(_DATA_TRANSFER_DECK_COLUMN_, props.column.id);

	// Chromeのバグで、Dragstartハンドラ内ですぐにDOMを変更する(=リアクティブなプロパティを変更する)とDragが終了してしまう
	// SEE: https://stackoverflow.com/questions/19639969/html5-dragend-event-firing-immediately
	window.setTimeout(() => {
		dragging = true;
	}, 10);
}

function onDragend(ev) {
	dragging = false;
}

function onDragover(ev) {
	// 自分自身がドラッグされている場合
	if (dragging) {
		// 自分自身にはドロップさせない
		ev.dataTransfer.dropEffect = 'none';
	} else {
		const isDeckColumn = ev.dataTransfer.types[0] === _DATA_TRANSFER_DECK_COLUMN_;

		ev.dataTransfer.dropEffect = isDeckColumn ? 'move' : 'none';

		if (isDeckColumn) draghover = true;
	}
}

function onDragleave() {
	draghover = false;
}

function onDrop(ev) {
	draghover = false;
	os.deckGlobalEvents.emit('column.dragEnd');

	const id = ev.dataTransfer.getData(_DATA_TRANSFER_DECK_COLUMN_);
	if (id != null && id !== '') {
		swapColumn(props.column.id, id);
	}
}
</script>

<style lang="scss" module>
.root {
	--root-margin: 10px;
	--deckColumnHeaderHeight: 40px;

	height: 100%;
	overflow: clip;
	contain: strict;

	&.draghover {
		&:after {
			content: "";
			display: block;
			position: absolute;
			z-index: 1000;
			top: 0;
			left: 0;
			width: 100%;
			height: 100%;
			background: var(--focus);
		}
	}

	&.dragging {
		&:after {
			content: "";
			display: block;
			position: absolute;
			z-index: 1000;
			top: 0;
			left: 0;
			width: 100%;
			height: 100%;
			background: var(--focus);
			opacity: 0.5;
		}
	}

	&.dropready {
		* {
			pointer-events: none;
		}
	}

	&:not(.active) {
		flex-basis: var(--deckColumnHeaderHeight);
		min-height: var(--deckColumnHeaderHeight);
	}

	&.naked {
		background: var(--acrylicBg) !important;
		-webkit-backdrop-filter: var(--blur, blur(10px));
		backdrop-filter: var(--blur, blur(10px));

		> .header {
			background: transparent;
			box-shadow: none;
			color: var(--fg);
		}
	}

	&.paged {
		background: var(--bg) !important;
	}
}

.header {
	position: relative;
	display: flex;
	z-index: 2;
	line-height: var(--deckColumnHeaderHeight);
	height: var(--deckColumnHeaderHeight);
	padding: 0 16px;
	font-size: 0.9em;
	color: var(--panelHeaderFg);
	background: var(--panelHeaderBg);
	box-shadow: 0 1px 0 0 var(--panelHeaderDivider);
	cursor: pointer;

	&, * {
		user-select: none;
	}
}

.title {
	display: inline-block;
	align-items: center;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
	width: 100%;
}

.toggleActive,
.menu {
	z-index: 1;
	width: var(--deckColumnHeaderHeight);
	line-height: var(--deckColumnHeaderHeight);
	color: var(--faceTextButton);

	&:hover {
		color: var(--faceTextButtonHover);
	}

	&:active {
		color: var(--faceTextButtonActive);
	}
}

.toggleActive {
	margin-left: -16px;
}

.menu {
	margin-left: auto;
	margin-right: -16px;
}

.body {
	height: calc(100% - var(--deckColumnHeaderHeight));
	overflow-y: auto;
	overflow-x: hidden; // Safari does not supports clip
	overflow-x: clip;
	-webkit-overflow-scrolling: touch;
	box-sizing: border-box;
	container-type: inline-size;
	background-color: var(--bg);
}
</style>
