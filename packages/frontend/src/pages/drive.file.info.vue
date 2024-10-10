<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div class="_gaps">
	<MkInfo>{{ i18n.ts._fileViewer.thisPageCanBeSeenFromTheAuthor }}</MkInfo>
	<MkLoading v-if="fetching"/>
	<div v-else-if="file" class="_gaps">
		<div :class="$style.filePreviewRoot">
			<MkMediaList :mediaList="[file]"></MkMediaList>
		</div>
		<div :class="$style.fileQuickActionsRoot">
			<button class="_button" :class="$style.fileNameEditBtn" @click="rename()">
				<h2 class="_nowrap" :class="$style.fileName">{{ file.name }}</h2>
				<i class="ti ti-pencil" :class="$style.fileNameEditIcon"></i>
			</button>
			<div :class="$style.fileQuickActionsOthers">
				<button v-tooltip="i18n.ts.createNoteFromTheFile" class="_button" :class="$style.fileQuickActionsOthersButton" @click="postThis()">
					<i class="ti ti-pencil"></i>
				</button>
				<button v-if="isImage" v-tooltip="i18n.ts.cropImage" class="_button" :class="$style.fileQuickActionsOthersButton" @click="crop()">
					<i class="ti ti-crop"></i>
				</button>
				<button v-if="file.isSensitive" v-tooltip="i18n.ts.unmarkAsSensitive" class="_button" :class="$style.fileQuickActionsOthersButton" @click="toggleSensitive()">
					<i class="ti ti-eye"></i>
				</button>
				<button v-else v-tooltip="i18n.ts.markAsSensitive" class="_button" :class="$style.fileQuickActionsOthersButton" @click="toggleSensitive()">
					<i class="ti ti-eye-exclamation"></i>
				</button>
				<a v-tooltip="i18n.ts.download" :href="file.url" :download="file.name" class="_button" :class="$style.fileQuickActionsOthersButton">
					<i class="ti ti-download"></i>
				</a>
				<button v-tooltip="i18n.ts.delete" class="_button" :class="[$style.fileQuickActionsOthersButton, $style.danger]" @click="deleteFile()">
					<i class="ti ti-trash"></i>
				</button>
			</div>
		</div>
		<div class="_gaps_s">
			<button class="_button" :class="$style.kvEditBtn" @click="move()">
				<MkKeyValue>
					<template #key>{{ i18n.ts.folder }}</template>
					<template #value>{{ folderHierarchy.join(' > ') }}<i class="ti ti-pencil" :class="$style.kvEditIcon"></i></template>
				</MkKeyValue>
			</button>
			<button class="_button" :class="$style.kvEditBtn" @click="describe()">
				<MkKeyValue :class="$style.multiline">
					<template #key>{{ i18n.ts.description }}</template>
					<template #value>{{ file.comment ? file.comment : `(${i18n.ts.none})` }}<i class="ti ti-pencil" :class="$style.kvEditIcon"></i></template>
				</MkKeyValue>
			</button>
			<MkKeyValue :class="$style.fileMetaDataChildren">
				<template #key>{{ i18n.ts._fileViewer.uploadedAt }}</template>
				<template #value><MkTime :time="file.createdAt" mode="detail"/></template>
			</MkKeyValue>
			<MkKeyValue :class="$style.fileMetaDataChildren">
				<template #key>{{ i18n.ts._fileViewer.type }}</template>
				<template #value>{{ file.type }}</template>
			</MkKeyValue>
			<MkKeyValue :class="$style.fileMetaDataChildren">
				<template #key>{{ i18n.ts._fileViewer.size }}</template>
				<template #value>{{ bytes(file.size) }}</template>
			</MkKeyValue>
			<MkKeyValue :class="$style.fileMetaDataChildren" :copy="file.url">
				<template #key>URL</template>
				<template #value>{{ file.url }}</template>
			</MkKeyValue>
		</div>
	</div>
	<div v-else class="_fullinfo">
		<img :src="infoImageUrl" class="_ghost"/>
		<div>{{ i18n.ts.nothing }}</div>
	</div>
</div>
</template>

<script setup lang="ts">
import { ref, computed, defineAsyncComponent, onMounted } from 'vue';
import * as Misskey from 'misskey-js';
import MkInfo from '@/components/MkInfo.vue';
import MkMediaList from '@/components/MkMediaList.vue';
import MkKeyValue from '@/components/MkKeyValue.vue';
import bytes from '@/filters/bytes.js';
import { infoImageUrl } from '@/instance.js';
import { i18n } from '@/i18n.js';
import * as os from '@/os.js';
import { misskeyApi } from '@/scripts/misskey-api.js';
import { useRouter } from '@/router/supplier.js';

const router = useRouter();

const props = defineProps<{
	fileId: string;
}>();

const fetching = ref(true);
const file = ref<Misskey.entities.DriveFile>();
const folderHierarchy = computed(() => {
	if (!file.value) return [i18n.ts.drive];
	const folderNames = [i18n.ts.drive];

	function get(folder: Misskey.entities.DriveFolder) {
		if (folder.parent) get(folder.parent);
		folderNames.push(folder.name);
	}

	if (file.value.folder) get(file.value.folder);
	return folderNames;
});
const isImage = computed(() => file.value?.type.startsWith('image/'));

async function fetch() {
	fetching.value = true;

	file.value = await misskeyApi('drive/files/show', {
		fileId: props.fileId,
	}).catch((err) => {
		console.error(err);
		return undefined;
	});

	fetching.value = false;
}

function postThis() {
	if (!file.value) return;

	os.post({
		initialFiles: [file.value],
	});
}

function crop() {
	if (!file.value) return;

	os.cropImage(file.value, {
		aspectRatio: NaN,
		uploadFolder: file.value.folderId ?? null,
	});
}

function move() {
	if (!file.value) return;

	os.selectDriveFolder(false).then(folder => {
		misskeyApi('drive/files/update', {
			fileId: file.value.id,
			folderId: folder[0] ? folder[0].id : null,
		}).then(async () => {
			await fetch();
		});
	});
}

function toggleSensitive() {
	if (!file.value) return;

	os.apiWithDialog('drive/files/update', {
		fileId: file.value.id,
		isSensitive: !file.value.isSensitive,
	}).then(async () => {
		await fetch();
	}).catch(err => {
		os.alert({
			type: 'error',
			title: i18n.ts.error,
			text: err.message,
		});
	});
}

function rename() {
	if (!file.value) return;

	os.inputText({
		title: i18n.ts.renameFile,
		placeholder: i18n.ts.inputNewFileName,
		default: file.value.name,
	}).then(({ canceled, result: name }) => {
		if (canceled) return;
		os.apiWithDialog('drive/files/update', {
			fileId: file.value.id,
			name: name,
		}).then(async () => {
			await fetch();
		});
	});
}

function describe() {
	if (!file.value) return;

	const { dispose } = os.popup(defineAsyncComponent(() => import('@/components/MkFileCaptionEditWindow.vue')), {
		default: file.value.comment ?? '',
		file: file.value,
	}, {
		done: caption => {
			os.apiWithDialog('drive/files/update', {
				fileId: file.value.id,
				comment: caption.length === 0 ? null : caption,
			}).then(async () => {
				await fetch();
			});
		},
		closed: () => dispose(),
	});
}

async function deleteFile() {
	if (!file.value) return;

	const { canceled } = await os.confirm({
		type: 'warning',
		text: i18n.tsx.driveFileDeleteConfirm({ name: file.value.name }),
	});

	if (canceled) return;
	await os.apiWithDialog('drive/files/delete', {
		fileId: file.value.id,
	});

	router.push('/my/drive');
}

onMounted(async () => {
	await fetch();
});
</script>

<style lang="scss" module>

.filePreviewRoot {
	background: var(--MI_THEME-panel);
	border-radius: var(--MI-radius);
	// MkMediaList 内の上部マージン 4px
	padding: calc(1rem - 4px) 1rem 1rem;
}

.fileQuickActionsRoot {
	display: flex;
	flex-direction: column;
	gap: 8px;
}

@container (min-width: 500px) {
	.fileQuickActionsRoot {
		flex-direction: row;
		align-items: center;
	}
}

.fileQuickActionsOthers {
	margin-left: auto;
	margin-right: 1rem;
	display: flex;
	gap: 8px;

	.fileQuickActionsOthersButton {
		padding: .5rem;
		border-radius: 99rem;

		&:hover,
		&:focus-visible {
			background-color: var(--MI_THEME-accentedBg);
			color: var(--MI_THEME-accent);
			text-decoration: none;
			outline: none;
		}

		&.danger {
			color: #ff2a2a;
		}

		&.danger:hover,
		&.danger:focus-visible {
			background-color: rgba(255, 42, 42, .15);
		}
	}
}

.fileNameEditBtn {
	padding: .5rem 1rem;
	display: flex;
	align-items: center;
	min-width: 0;
	font-weight: 700;
	border-radius: var(--MI-radius);
	font-size: .8rem;

	>.fileNameEditIcon {
		color: transparent;
		visibility: hidden;
		padding-left: .5rem;
	}

	>.fileName {
		margin: 0;
	}

	&:hover {
		background-color: var(--MI_THEME-accentedBg);

		>.fileName,
		>.fileNameEditIcon {
			visibility: visible;
			color: var(--MI_THEME-accent);
		}
	}
}

.fileMetaDataChildren {
	padding: .5rem 1rem;
}

.multiline {
	white-space: pre-wrap;
}

.kvEditBtn {
	text-align: start;
	display: block;
	width: 100%;
	padding: .5rem 1rem;
	border-radius: var(--MI-radius);

	.kvEditIcon {
		display: inline-block;
		color: transparent;
		visibility: hidden;
		padding-left: .5rem;
	}

	&:hover {
		color: var(--MI_THEME-accent);
		background-color: var(--MI_THEME-accentedBg);

		.kvEditIcon {
			color: var(--MI_THEME-accent);
			visibility: visible;
		}
	}
}
</style>
