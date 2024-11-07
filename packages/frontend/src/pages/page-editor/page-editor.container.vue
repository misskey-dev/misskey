<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div
	:class="[$style.blockContainerRoot, {
		[$style.dragging]: isDragging,
		[$style.draggingOver]: isDraggingOver,
	}]"
	@dragover="dragOver"
	@dragleave="dragLeave"
	@drop="drop"
>
	<header :class="$style.blockContainerHeader">
		<div :class="$style.title"><slot name="header"></slot></div>
		<div :class="$style.buttons">
			<button v-if="removable" :class="$style.blockContainerActionButton" class="_button" @click="remove()">
				<i class="ti ti-trash"></i>
			</button>
			<button
				v-if="draggable"
				draggable="true"
				:class="$style.blockContainerActionButton"
				class="_button"
				:data-block-id="blockId"
				@dragstart="dragStart"
				@dragend="dragEnd"
			>
				<i class="ti ti-menu-2"></i>
		</button>
		</div>
	</header>
	<div :class="$style.blockContainerBody" tabindex="0">
		<slot></slot>
	</div>
</div>
</template>

<script lang="ts" setup>
import { ref } from 'vue';

const props = withDefaults(defineProps<{
	blockId: string;
	expanded?: boolean;
	removable?: boolean;
	draggable?: boolean;
}>(), {
	expanded: true,
	removable: true,
});

const emit = defineEmits<{
	(ev: 'remove'): void;
}>();

function remove() {
	emit('remove');
}

const isDragging = ref(false);
function dragStart(ev: DragEvent) {
	ev.dataTransfer?.setData('text/plain', props.blockId);
	isDragging.value = true;
}
function dragEnd() {
	isDragging.value = false;
}

const isDraggingOver = ref(false);
function dragOver(ev: DragEvent) {
	if (isDragging.value) {
		// ブロックの中にドロップできるのは自分自身だけ
		ev.preventDefault();
		isDraggingOver.value = true;
	}
}
function dragLeave() {
	isDraggingOver.value = false;
}
function drop() {
	// 自分自身しかドロップできないので何もしない
	isDraggingOver.value = false;
}
</script>

<style lang="scss" module>
.blockContainerRoot {
	position: relative;
}

.blockContainerHeader {
	position: absolute;
	box-sizing: border-box;
	top: 0;
	right: 0;
	transform: translateY(-100%);
	z-index: 1;
	display: none;
	gap: var(--MI-margin);

	height: 42px;
	padding: 6px 14px;
	background-color: var(--MI_THEME-panel);
	border: 2px solid var(--MI_THEME-accent);
	border-bottom: none;
	border-radius: 8px 8px 0 0;

	> .title {
		line-height: 26px;
	}

	> .buttons {
		display: flex;
		gap: 8px;
	}
}

.blockContainerActionButton {
	display: block;
	width: 26px;
	height: 26px;
	line-height: 26px;
	text-align: center;
}

.blockContainerBody {
	position: relative;
	overflow: hidden;
	background: var(--MI_THEME-panel);
	border: solid 2px var(--MI_THEME-X12);
	border-radius: 8px;

	&:hover {
		border: solid 2px var(--MI_THEME-X13);
	}
}

.blockContainerRoot.dragging {
	&::after {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: var(--MI_THEME-bg);
		z-index: 1;
		border-radius: 8px 0 8px 8px;
	}

	&.draggingOver::after {
		outline: dashed 2px var(--MI_THEME-accent);
		outline-offset: -2px;
	}

	.blockContainerHeader {
		display: flex;
	}

	.blockContainerBody {
		border: solid 2px var(--MI_THEME-accent);
		border-top-right-radius: 0;
	}
}

@container (min-width: 700px) {
	.blockContainerRoot:focus-within {
		.blockContainerHeader {
			display: flex;
		}

		.blockContainerBody {
			border: solid 2px var(--MI_THEME-accent);
			border-top-right-radius: 0;
		}
	}
}
</style>
