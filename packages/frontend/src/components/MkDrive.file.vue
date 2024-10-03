<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div
	:class="[$style.root, { [$style.isSelected]: isSelected }]"
	draggable="true"
	:title="title"
	@click="onClick"
	@contextmenu.stop="onContextmenu"
	@dragstart="onDragstart"
	@dragend="onDragend"
>
	<div style="pointer-events: none;">
		<div v-if="$i?.avatarId == file.id" :class="[$style.label]">
			<img :class="$style.labelImg" src="/client-assets/label.svg"/>
			<p :class="$style.labelText">{{ i18n.ts.avatar }}</p>
		</div>
		<div v-if="$i?.bannerId == file.id" :class="[$style.label]">
			<img :class="$style.labelImg" src="/client-assets/label.svg"/>
			<p :class="$style.labelText">{{ i18n.ts.banner }}</p>
		</div>
		<div v-if="file.isSensitive" :class="[$style.label, $style.red]">
			<img :class="$style.labelImg" src="/client-assets/label-red.svg"/>
			<p :class="$style.labelText">{{ i18n.ts.sensitive }}</p>
		</div>

		<MkDriveFileThumbnail :class="$style.thumbnail" :file="file" fit="contain"/>

		<p :class="$style.name">
			<span>{{ file.name.lastIndexOf('.') != -1 ? file.name.substring(0, file.name.lastIndexOf('.')) : file.name }}</span>
			<span v-if="file.name.lastIndexOf('.') != -1" style="opacity: 0.5;">{{ file.name.substring(file.name.lastIndexOf('.')) }}</span>
		</p>
	</div>
</div>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue';
import * as Misskey from 'misskey-js';
import MkDriveFileThumbnail from '@/components/MkDriveFileThumbnail.vue';
import bytes from '@/filters/bytes.js';
import * as os from '@/os.js';
import { i18n } from '@/i18n.js';
import { $i } from '@/account.js';
import { getDriveFileMenu } from '@/scripts/get-drive-file-menu.js';
import { deviceKind } from '@/scripts/device-kind.js';
import { useRouter } from '@/router/supplier.js';

const router = useRouter();

const props = withDefaults(defineProps<{
	file: Misskey.entities.DriveFile;
	folder: Misskey.entities.DriveFolder | null;
	isSelected?: boolean;
	selectMode?: boolean;
}>(), {
	isSelected: false,
	selectMode: false,
});

const emit = defineEmits<{
	(ev: 'chosen', r: Misskey.entities.DriveFile): void;
	(ev: 'dragstart'): void;
	(ev: 'dragend'): void;
}>();

const isDragging = ref(false);

const title = computed(() => `${props.file.name}\n${props.file.type} ${bytes(props.file.size)}`);

function onClick(ev: MouseEvent) {
	if (props.selectMode) {
		emit('chosen', props.file);
	} else {
		if (deviceKind === 'desktop') {
			router.push(`/my/drive/file/${props.file.id}`);
		} else {
			os.popupMenu(getDriveFileMenu(props.file, props.folder), (ev.currentTarget ?? ev.target ?? undefined) as HTMLElement | undefined);
		}
	}
}

function onContextmenu(ev: MouseEvent) {
	os.contextMenu(getDriveFileMenu(props.file, props.folder), ev);
}

function onDragstart(ev: DragEvent) {
	if (ev.dataTransfer) {
		ev.dataTransfer.effectAllowed = 'move';
		ev.dataTransfer.setData(_DATA_TRANSFER_DRIVE_FILE_, JSON.stringify(props.file));
	}
	isDragging.value = true;

	emit('dragstart');
}

function onDragend() {
	isDragging.value = false;
	emit('dragend');
}
</script>

<style lang="scss" module>
.root {
	position: relative;
	padding: 8px 0 0 0;
	min-height: 180px;
	border-radius: 8px;
	cursor: pointer;

	&:hover {
		background: rgba(#000, 0.05);

		> .label {
			&::before,
			&::after {
				background: #0b65a5;
			}

			&.red {
				&::before,
				&::after {
					background: #c12113;
				}
			}
		}
	}

	&:active {
		background: rgba(#000, 0.1);

		> .label {
			&::before,
			&::after {
				background: #0b588c;
			}

			&.red {
				&::before,
				&::after {
					background: #ce2212;
				}
			}
		}
	}

	&.isSelected {
		background: var(--accent);

		&:hover {
			background: var(--accentLighten);
		}

		&:active {
			background: var(--accentDarken);
		}

		> .label {
			&::before,
			&::after {
				display: none;
			}
		}

		> .name {
			color: #fff;
		}

		> .thumbnail {
			color: #fff;
		}
	}
}

.label {
	position: absolute;
	top: 0;
	left: 0;
	pointer-events: none;

	&::before,
	&::after {
		content: "";
		display: block;
		position: absolute;
		z-index: 1;
		background: #0c7ac9;
	}

	&::before {
		top: 0;
		left: 57px;
		width: 28px;
		height: 8px;
	}

	&::after {
		top: 57px;
		left: 0;
		width: 8px;
		height: 28px;
	}

	&.red {
		&::before,
		&::after {
			background: #c12113;
		}
	}
}

.labelImg {
	position: absolute;
	z-index: 2;
	top: 0;
	left: 0;
}

.labelText {
	position: absolute;
	z-index: 3;
	top: 19px;
	left: -28px;
	width: 120px;
	margin: 0;
	text-align: center;
	line-height: 28px;
	color: #fff;
	transform: rotate(-45deg);
}

.thumbnail {
	width: 110px;
	height: 110px;
	margin: auto;
}

.name {
	display: block;
	margin: 4px 0 0 0;
	font-size: 0.8em;
	text-align: center;
	word-break: break-all;
	color: var(--fg);
	overflow: hidden;
}
</style>
