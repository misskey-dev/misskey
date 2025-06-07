<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div v-show="props.modelValue.length != 0" :class="$style.root">
	<Sortable
		:modelValue="props.modelValue"
		:class="$style.files"
		itemKey="id"
		:animation="150"
		:delay="100"
		:delayOnTouchOnly="true"
		:disabled="props.draggable === false"
		@update:modelValue="v => emit('update:modelValue', v)"
	>
		<template #item="{ element }">
			<div
				:class="[$style.file, { [$style.dragEnabled]: props.draggable !== false }]"
				role="button"
				tabindex="0"
				@click="handleClick(element, $event)"
				@keydown.space.enter="showFileMenu(element, $event)"
				@contextmenu.prevent="showFileMenu(element, $event)"
			>
				<MkDriveFileThumbnail v-if="element.type === 'driveFile'" :data-id="element.id" :class="$style.thumbnail" :file="element.file" fit="cover"/>
				<template v-else-if="element.type === 'uploaderItem'">
					<img v-if="element.file.thumbnail" :src="element.file.thumbnail" :class="[$style.thumbnail, $style.uploaderThumbnail]" />
					<div v-else v-panel :class="[$style.thumbnail, $style.uploaderThumbnailIcon]">
						<i :class="[$style.icon, getFileTypeIcon(getFileType(element.file.file.type))]"></i>
					</div>
					<div :class="[$style.uploadProgressWrapper, { uploading: element.file.uploading }]">
						<svg :class="$style.uploadProgressSvg" viewBox="0 0 64 64">
							<circle
								:class="$style.uploadProgressFg"
								cx="32" cy="32" r="16"
								:stroke-dasharray="progressDashArray(element.file)"
							/>
						</svg>
						<div :class="$style.uploadAbortButton">
							<!-- 実際のボタン機能はhandleClick -->
							<i class="ti ti-x"></i>
						</div>
					</div>
				</template>
				<div v-if="(element.type === 'driveFile' && element.file.isSensitive) || (element.type === 'uploaderItem' && element.file.isSensitive)" :class="$style.sensitive">
					<i class="ti ti-eye-exclamation" style="margin: auto;"></i>
				</div>
			</div>
		</template>
	</Sortable>
	<p
		:class="[$style.remain, {
			[$style.exceeded]: props.modelValue.length > 16,
		}]"
	>
		{{ props.modelValue.length }}/16
	</p>
</div>
</template>

<script lang="ts">
import type { UploaderItem } from '@/composables/use-uploader.js';

export type Attach = {
	id: string;
	type: 'driveFile';
	file: Misskey.entities.DriveFile;
} | {
	id: string;
	type: 'uploaderItem';
	file: UploaderItem;
};
</script>

<script lang="ts" setup>
import { defineAsyncComponent, inject } from 'vue';
import * as Misskey from 'misskey-js';
import type { MenuItem } from '@/types/menu';
import { copyToClipboard } from '@/utility/copy-to-clipboard.js';
import { getFileType, getFileTypeIcon } from '@/utility/file-type.js';
import MkDriveFileThumbnail from '@/components/MkDriveFileThumbnail.vue';
import * as os from '@/os.js';
import { misskeyApi } from '@/utility/misskey-api.js';
import { i18n } from '@/i18n.js';
import { prefer } from '@/preferences.js';
import { DI } from '@/di.js';
import { globalEvents } from '@/events.js';

const Sortable = defineAsyncComponent(() => import('vuedraggable').then(x => x.default));

const props = defineProps<{
	draggable?: boolean;
	modelValue: Attach[];
}>();

const mock = inject(DI.mock, false);

const emit = defineEmits<{
	(ev: 'update:modelValue', value: Attach[]): void;
	(ev: 'detach', id: string): void;
	(ev: 'uploaderItemAborted', id: string): void;
	(ev: 'changeDriveFileSensitivity', file: Misskey.entities.DriveFile, isSensitive: boolean): void;
	(ev: 'changeDriveFileName', file: Misskey.entities.DriveFile, newName: string): void;
	(ev: 'showUploaderMenu', uploaderItem: UploaderItem, event: MouseEvent | KeyboardEvent): void;
}>();

function progressDashArray(item: UploaderItem): string {
	const progress = item.progress ? item.progress.value / item.progress.max : 0;
	return `${progress * 100} ${100 - progress * 100}`;
}

function detachMedia(id: string) {
	if (mock) return;

	emit('detach', id);
}

async function detachAndDeleteMedia(file: Misskey.entities.DriveFile) {
	if (mock) return;

	detachMedia(file.id);

	const { canceled } = await os.confirm({
		type: 'warning',
		text: i18n.tsx.driveFileDeleteConfirm({ name: file.name }),
	});
	if (canceled) return;

	await os.apiWithDialog('drive/files/delete', {
		fileId: file.id,
	});

	globalEvents.emit('driveFilesDeleted', [file]);
}

function toggleDriveFileSensitivity(file: Misskey.entities.DriveFile) {
	if (mock) {
		emit('changeDriveFileSensitivity', file, !file.isSensitive);
		return;
	}

	misskeyApi('drive/files/update', {
		fileId: file.id,
		isSensitive: !file.isSensitive,
	}).then(() => {
		emit('changeDriveFileSensitivity', file, !file.isSensitive);
	});
}

async function renameDriveFile(file: Misskey.entities.DriveFile) {
	if (mock) return;

	const { canceled, result } = await os.inputText({
		title: i18n.ts.enterFileName,
		default: file.name,
		minLength: 1,
	});
	if (canceled) return;
	misskeyApi('drive/files/update', {
		fileId: file.id,
		name: result,
	}).then(() => {
		emit('changeDriveFileName', file, result);
		file.name = result;
	});
}

async function describeDriveFile(file: Misskey.entities.DriveFile) {
	if (mock) return;

	const { dispose } = await os.popupAsyncWithDialog(import('@/components/MkFileCaptionEditWindow.vue').then(x => x.default), {
		default: file.comment !== null ? file.comment : '',
		file: file,
	}, {
		done: caption => {
			let comment = caption.length === 0 ? null : caption;
			misskeyApi('drive/files/update', {
				fileId: file.id,
				comment: comment,
			}).then(() => {
				file.comment = comment;
			});
		},
		closed: () => dispose(),
	});
}

function handleClick(attach: Attach, ev: MouseEvent | KeyboardEvent): void {
	if (ev instanceof MouseEvent && ev.button !== 0) return; // 左クリック以外は無視

	if (attach.type === 'driveFile' || (attach.type === 'uploaderItem' && !attach.file.uploading)) {
		showFileMenu(attach, ev);
	} else {
		if (attach.file.abort) {
			attach.file.abort();
		}
		attach.file.aborted = true;
		attach.file.uploadFailed = true;
		emit('uploaderItemAborted', attach.file.id);
	}
}

function showFileMenu(attach: Attach, ev: MouseEvent | KeyboardEvent): void {
	if (attach.type === 'driveFile') {
		const file = attach.file;
		const isImage = file.type.startsWith('image/');

		const menuItems: MenuItem[] = [];
		menuItems.push({
			text: i18n.ts.renameFile,
			icon: 'ti ti-forms',
			action: () => { renameDriveFile(file); },
		}, {
			text: file.isSensitive ? i18n.ts.unmarkAsSensitive : i18n.ts.markAsSensitive,
			icon: file.isSensitive ? 'ti ti-eye-exclamation' : 'ti ti-eye',
			action: () => { toggleDriveFileSensitivity(file); },
		}, {
			text: i18n.ts.describeFile,
			icon: 'ti ti-text-caption',
			action: () => { describeDriveFile(file); },
		});

		if (isImage) {
			menuItems.push({
				text: i18n.ts.preview,
				icon: 'ti ti-photo-search',
				action: async () => {
					const { dispose } = await os.popupAsyncWithDialog(import('@/components/MkImgPreviewDialog.vue').then(x => x.default), {
						file: file,
					}, {
						closed: () => dispose(),
					});
				},
			});
		}

		menuItems.push({
			type: 'divider',
		}, {
			text: i18n.ts.attachCancel,
			icon: 'ti ti-circle-x',
			action: () => { detachMedia(file.id); },
		}, {
			text: i18n.ts.deleteFile,
			icon: 'ti ti-trash',
			danger: true,
			action: () => { detachAndDeleteMedia(file); },
		});

		if (prefer.s.devMode) {
			menuItems.push({ type: 'divider' }, {
				icon: 'ti ti-hash',
				text: i18n.ts.copyFileId,
				action: () => {
					copyToClipboard(file.id);
				},
			});
		}

		os.popupMenu(menuItems, ev.currentTarget ?? ev.target);
	} else if (attach.type === 'uploaderItem') {
		emit('showUploaderMenu', attach.file, ev);
	}
}
</script>

<style lang="scss" module>
.root {
	padding: 8px 16px;
	position: relative;
}

.files {
	display: flex;
	flex-wrap: wrap;
}

.file {
	position: relative;
	width: 64px;
	height: 64px;
	margin-right: 4px;
	border-radius: 8px;
	overflow: hidden;

	&:focus-visible {
		outline-offset: 4px;
	}

	&.dragEnabled {
		cursor: move;
	}
}

.thumbnail {
	width: 100%;
	height: 100%;
	z-index: 1;
	color: var(--MI_THEME-fg);
}

.uploaderThumbnail {
	object-fit: cover;
	object-position: center;
}

.uploaderThumbnailIcon {
	display: flex;
	align-items: center;
	justify-content: center;
}

.icon {
	pointer-events: none;
	margin: auto;
	font-size: 32px;
	color: #777;
}

.sensitive {
	display: flex;
	position: absolute;
	width: 64px;
	height: 64px;
	top: 0;
	left: 0;
	z-index: 2;
	background: rgba(17, 17, 17, .7);
	color: #fff;
}

.remain {
	display: block;
	position: absolute;
	top: 8px;
	right: 8px;
	margin: 0;
	padding: 0;
	font-size: 90%;

	&.exceeded {
		color: var(--MI_THEME-error);
	}
}

.uploadProgressWrapper {
	position: absolute;
	left: 0;
	top: 0;
	width: 100%;
	height: 100%;
	z-index: 1;

	&::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background: rgba(0, 0, 0, 0.75);
		mask-image: linear-gradient(#000, #000), url("data:image/svg+xml;base64,PHN2ZyB2aWV3Qm94PSIwIDAgMTAwIDEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4gPGNpcmNsZSBjeD0iNTAiIGN5PSI1MCIgcj0iNTAiIC8+PC9zdmc+");
		mask-position: center;
		mask-repeat: no-repeat;
		mask-size: 100% 100%, 90px 90px;
		mask-composite: exclude;
		transition: mask-size 0.2s ease;
	}
}

.uploadProgressSvg {
	position: absolute;
	top: 50%;
	left: 50%;
	width: 32px;
	height: 32px;
	transform: translate(-50%, -50%);
	pointer-events: none;
	opacity: 0;
	transition: opacity 0.2s ease;
}

.uploadProgressFg {
	fill: none;
	stroke-width: 32;
	stroke: rgba(0, 0, 0, 0.75);
	stroke-dashoffset: 25;
	transition: stroke-dasharray 0.2s ease;
}

.uploadAbortButton {
	position: absolute;
	top: 50%;
	left: 50%;
	width: 32px;
	height: 32px;
	border-radius: 50%;
	transform: translate(-50%, -50%);
	font-size: 16px;
	line-height: 32px;
	text-align: center;
	background-color: rgba(0, 0, 0, 0.75);
	color: #fff;
	opacity: 0;
	transition: opacity 0.2s ease;
	cursor: pointer;
}

.uploadProgressWrapper:global(.uploading) {
	backdrop-filter: brightness(1.5);

	&::before {
		mask-size: 100% 100%, 36px 36px;
	}

	.uploadProgressSvg {
		opacity: 1;
	}
}

.file:hover .uploadProgressWrapper:global(.uploading) {
	.uploadProgressSvg {
		opacity: 0;
	}

	.uploadAbortButton {
		opacity: 1;
	}
}
</style>
