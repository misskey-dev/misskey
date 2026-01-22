<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkModalWindow
	ref="dialog"
	:width="800"
	:height="500"
	@close="cancel()"
	@closed="emit('closed')"
>
	<template #header>
		<i class="ti ti-upload"></i> {{ i18n.tsx.uploadNFiles({ n: files.length }) }}
	</template>

	<div :class="$style.root">
		<div :class="[$style.overallProgress, canRetry ? $style.overallProgressError : null]" :style="{ '--op': `${overallProgress}%` }"></div>

		<div class="_gaps_s _spacer">
			<MkTip k="uploader">
				{{ i18n.ts._uploader.tip }}
			</MkTip>

			<MkUploaderItems :items="items" @showMenu="(item, ev) => showPerItemMenu(item, ev)" @showMenuViaContextmenu="(item, ev) => showPerItemMenuViaContextmenu(item, ev)"/>

			<div v-if="props.multiple">
				<MkButton style="margin: auto;" :iconOnly="true" rounded @click="chooseFile($event)"><i class="ti ti-plus"></i></MkButton>
			</div>

			<div>{{ i18n.tsx._uploader.maxFileSizeIsX({ x: $i.policies.maxFileSizeMb + 'MB' }) }}</div>

			<!-- クライアントで検出するMIME typeとサーバーで検出するMIME typeが異なる場合があり、混乱の元になるのでとりあえず隠しとく -->
			<!-- https://github.com/misskey-dev/misskey/issues/16091 -->
			<!-- https://github.com/misskey-dev/misskey/issues/16663 -->
			<!--<div>{{ i18n.ts._uploader.allowedTypes }}: {{ $i.policies.uploadableFileTypes.join(', ') }}</div>-->
		</div>
	</div>

	<template #footer>
		<div class="_buttonsCenter">
			<MkButton v-if="uploader.uploading.value" rounded @click="abortWithConfirm()"><i class="ti ti-x"></i> {{ i18n.ts.abort }}</MkButton>
			<MkButton v-else-if="!firstUploadAttempted" primary rounded :disabled="!uploader.readyForUpload.value" @click="upload()"><i class="ti ti-upload"></i> {{ i18n.ts.upload }}</MkButton>

			<MkButton v-if="canRetry" rounded @click="upload()"><i class="ti ti-reload"></i> {{ i18n.ts.retry }}</MkButton>
			<MkButton v-if="canDone" rounded @click="done()"><i class="ti ti-arrow-right"></i> {{ i18n.ts.done }}</MkButton>
		</div>
	</template>
</MkModalWindow>
</template>

<script lang="ts" setup>
import { computed, onMounted, ref, useTemplateRef, watch } from 'vue';
import * as Misskey from 'misskey-js';
import type { UploaderFeatures, UploaderItem } from '@/composables/use-uploader.js';
import MkModalWindow from '@/components/MkModalWindow.vue';
import { i18n } from '@/i18n.js';
import MkButton from '@/components/MkButton.vue';
import * as os from '@/os.js';
import { ensureSignin } from '@/i.js';
import { useUploader } from '@/composables/use-uploader.js';
import MkUploaderItems from '@/components/MkUploaderItems.vue';

const $i = ensureSignin();

const props = withDefaults(defineProps<{
	files: File[];
	folderId?: string | null;
	multiple?: boolean;
	features?: UploaderFeatures;
}>(), {
	multiple: true,
});

const emit = defineEmits<{
	(ev: 'done', driveFiles: Misskey.entities.DriveFile[]): void;
	(ev: 'canceled'): void;
	(ev: 'closed'): void;
}>();

const dialog = useTemplateRef('dialog');

const uploader = useUploader({
	multiple: props.multiple,
	folderId: props.folderId,
	features: props.features,
});

onMounted(() => {
	uploader.addFiles(props.files);
});

const items = uploader.items;

const firstUploadAttempted = ref(false);
const canRetry = computed(() => firstUploadAttempted.value && uploader.readyForUpload.value);
const canDone = computed(() => items.value.some(item => item.uploaded != null));
const overallProgress = computed(() => {
	const max = items.value.length;
	if (max === 0) return 0;
	const v = items.value.reduce((acc, item) => {
		if (item.uploaded) return acc + 1;
		if (item.progress) return acc + (item.progress.value / item.progress.max);
		return acc;
	}, 0);
	return Math.round((v / max) * 100);
});

watch(items, () => {
	if (items.value.length === 0) {
		emit('canceled');
		dialog.value?.close();
		return;
	}

	if (items.value.every(item => item.uploaded)) {
		emit('done', items.value.map(item => item.uploaded!));
		dialog.value?.close();
	}
}, { deep: true });

async function cancel() {
	const { canceled } = await os.confirm({
		type: 'question',
		text: i18n.ts._uploader.abortConfirm,
		okText: i18n.ts.yes,
		cancelText: i18n.ts.no,
	});
	if (canceled) return;

	uploader.abortAll();
	emit('canceled');
	dialog.value?.close();
}

function upload() {
	firstUploadAttempted.value = true;
	uploader.upload();
}

async function abortWithConfirm() {
	const { canceled } = await os.confirm({
		type: 'question',
		text: i18n.ts._uploader.abortConfirm,
		okText: i18n.ts.yes,
		cancelText: i18n.ts.no,
	});
	if (canceled) return;

	uploader.abortAll();
}

async function done() {
	if (!uploader.allItemsUploaded.value) {
		const { canceled } = await os.confirm({
			type: 'question',
			text: i18n.ts._uploader.doneConfirm,
			okText: i18n.ts.yes,
			cancelText: i18n.ts.no,
		});
		if (canceled) return;
	}

	emit('done', items.value.filter(item => item.uploaded != null).map(item => item.uploaded!));
	dialog.value?.close();
}

async function chooseFile(ev: PointerEvent) {
	const newFiles = await os.chooseFileFromPc({ multiple: true });
	uploader.addFiles(newFiles);
}

function showPerItemMenu(item: UploaderItem, ev: PointerEvent) {
	const menu = uploader.getMenu(item);
	os.popupMenu(menu, ev.currentTarget ?? ev.target);
}

function showPerItemMenuViaContextmenu(item: UploaderItem, ev: PointerEvent) {
	const menu = uploader.getMenu(item);
	os.contextMenu(menu, ev);
}
</script>

<style lang="scss" module>
.root {
	position: relative;
}

.overallProgress {
	position: absolute;
	top: 0;
	left: 0;
	width: var(--op);
	height: 4px;
	background: var(--MI_THEME-accent);
	border-radius: 0 999px 999px 0;
	transition: width 0.2s ease;

	&.overallProgressError {
		background: var(--MI_THEME-warn);
	}
}
</style>
