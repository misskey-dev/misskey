<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div :class="$style.root" class="_gaps_s">
	<div
		v-for="displayItem in displayItems"
		:key="displayItem.item.id"
		v-panel
		:class="[$style.item, { [$style.itemWaiting]: displayItem.item.preprocessing, [$style.itemCompleted]: displayItem.item.uploaded, [$style.itemFailed]: displayItem.item.uploadFailed }]"
		:style="{
			'--p': displayItem.item.progress != null ? `${displayItem.item.progress.value / displayItem.item.progress.max * 100}%` : '0%',
			'--pp': displayItem.item.preprocessProgress != null ? `${displayItem.item.preprocessProgress * 100}%` : '100%',
		}"
		@contextmenu.prevent.stop="onContextmenu(displayItem.item, $event)"
	>
		<div :class="$style.itemInner">
			<div :class="$style.itemActionWrapper">
				<MkButton :iconOnly="true" rounded @click="emit('showMenu', displayItem.item, $event)"><i class="ti ti-dots"></i></MkButton>
			</div>
			<div :class="$style.itemThumbnail" :style="{ backgroundImage: `url(${ displayItem.item.thumbnail })` }" @click="onThumbnailClick(displayItem.item, $event)"></div>
			<div :class="$style.itemBody">
				<div>
					<i v-if="displayItem.item.isSensitive" style="color: var(--MI_THEME-warn); margin-right: 0.5em;" class="ti ti-eye-exclamation"></i>
					<MkCondensedLine :minScale="2 / 3">
						<span>{{ displayItem.nameParts.baseName }}</span>
						<span v-if="displayItem.nameParts.extension != null" style="opacity: 0.5;">{{ displayItem.nameParts.extension }}</span>
					</MkCondensedLine>
				</div>
				<div :class="$style.itemInfo">
					<span>{{ displayItem.item.file.type }}</span>
					<span v-if="displayItem.item.compressedSize">({{ i18n.tsx._uploader.compressedToX({ x: bytes(displayItem.item.compressedSize) }) }} = {{ i18n.tsx._uploader.savedXPercent({ x: Math.round((1 - displayItem.item.compressedSize / displayItem.item.file.size) * 100) }) }})</span>
					<span v-else>{{ bytes(displayItem.item.file.size) }}</span>
					<span v-if="displayItem.item.preprocessing">{{ i18n.ts.preprocessing }}<MkLoading inline em style="margin-left: 0.5em;"/></span>
				</div>
				<div>
				</div>
			</div>
			<div :class="$style.itemIconWrapper">
				<MkSystemIcon v-if="displayItem.item.uploading" :class="$style.itemIcon" type="waiting"/>
				<MkSystemIcon v-else-if="displayItem.item.uploaded" :class="$style.itemIcon" type="success"/>
				<MkSystemIcon v-else-if="displayItem.item.uploadFailed" :class="$style.itemIcon" type="error"/>
			</div>
		</div>
	</div>
</div>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import { isLink } from '@@/js/is-link.js';
import { getUploadName } from '@/composables/use-uploader.js';
import type { UploaderItem } from '@/composables/use-uploader.js';
import { i18n } from '@/i18n.js';
import MkButton from '@/components/MkButton.vue';
import bytes from '@/filters/bytes.js';

const props = defineProps<{
	items: UploaderItem[];
}>();

const displayItems = computed(() => props.items.map(item => ({
	item,
	nameParts: getUploadNameParts(item),
})));

const emit = defineEmits<{
	(ev: 'showMenu', item: UploaderItem, event: PointerEvent): void;
	(ev: 'showMenuViaContextmenu', item: UploaderItem, event: PointerEvent): void;
}>();

function getUploadNameParts(item: UploaderItem): {
	baseName: string;
	extension: string | null;
} {
	const name = getUploadName(item);
	const extensionIndex = name.lastIndexOf('.');

	if (extensionIndex === -1) {
		return {
			baseName: name,
			extension: null,
		};
	}

	return {
		baseName: name.substring(0, extensionIndex),
		extension: name.substring(extensionIndex),
	};
}

function onContextmenu(item: UploaderItem, ev: PointerEvent) {
	if (ev.target && isLink(ev.target as HTMLElement)) return;
	if (window.getSelection()?.toString() !== '') return;

	emit('showMenuViaContextmenu', item, ev);
}

function onThumbnailClick(item: UploaderItem, ev: PointerEvent) {
	// TODO: preview when item is image
}
</script>

<style lang="scss" module>
.root {
	position: relative;
}

.item {
	position: relative;
	border-radius: 10px;
	overflow: clip;

	&::before {
		content: '';
		display: block;
		position: absolute;
		top: 0;
		left: 0;
		width: var(--p);
		height: 100%;
		background: color(from var(--MI_THEME-accent) srgb r g b / 0.5);
		transition: width 0.2s ease, left 0.2s ease;
	}

	&.itemWaiting {
		&::after {
			--c: color(from var(--MI_THEME-accent) srgb r g b / 0.25);

			content: '';
			display: block;
			position: absolute;
			top: 0;
			left: 0;
			width: var(--pp, 100%);
			height: 100%;
			background: linear-gradient(-45deg, transparent 25%, var(--c) 25%,var(--c) 50%, transparent 50%, transparent 75%, var(--c) 75%, var(--c));
			background-size: 25px 25px;
			animation: stripe .8s infinite linear;
		}
	}

	&.itemCompleted {
		&::before {
			left: 100%;
			width: var(--p);
		}

		.itemBody {
			color: var(--MI_THEME-accent);
		}
	}

	&.itemFailed {
		.itemBody {
			color: var(--MI_THEME-error);
		}
	}
}

@keyframes stripe {
	0% { background-position-x: 0; }
	100% { background-position-x: -25px; }
}

.itemInner {
	position: relative;
	z-index: 1;
	padding: 8px 16px;
	display: flex;
	align-items: center;
	gap: 12px;
}

.itemThumbnail {
	width: 70px;
	height: 70px;
	background-color: var(--MI_THEME-bg);
	background-size: contain;
	background-position: center;
	background-repeat: no-repeat;
	border-radius: 6px;
}

.itemBody {
	flex: 1;
	min-width: 0;
}

.itemInfo {
	opacity: 0.7;
	margin-top: 4px;
	font-size: 90%;
	display: flex;
	gap: 8px;
}

.itemIcon {
	width: 35px;
}

@container (max-width: 500px) {
	.itemInner {
		flex-direction: column;
		gap: 8px;
	}

	.itemBody {
		font-size: 90%;
		text-align: center;
		width: 100%;
		min-width: 0;
	}

	.itemActionWrapper {
		position: absolute;
		top: 8px;
		left: 8px;
	}

	.itemInfo {
		justify-content: center;
	}

	.itemIconWrapper {
		position: absolute;
		top: 8px;
		right: 8px;
	}
}
</style>
