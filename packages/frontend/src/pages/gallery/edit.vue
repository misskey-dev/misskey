<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkStickyContainer>
	<template #header><MkPageHeader :actions="headerActions" :tabs="headerTabs"/></template>
	<MkSpacer :contentMax="800" :marginMin="16" :marginMax="32">
		<FormSuspense :p="init" class="_gaps">
			<MkInput v-model="title">
				<template #label>{{ i18n.ts.title }}</template>
			</MkInput>

			<MkTextarea v-model="description" :max="500">
				<template #label>{{ i18n.ts.description }}</template>
			</MkTextarea>

			<div class="_gaps_s">
				<div v-for="file in files" :key="file.id" class="wqugxsfx" :style="{ backgroundImage: file ? `url(${ file.thumbnailUrl })` : null }">
					<div class="name">{{ file.name }}</div>
					<button v-tooltip="i18n.ts.remove" class="remove _button" @click="remove(file)"><i class="ti ti-x"></i></button>
				</div>
				<MkButton primary @click="selectFile"><i class="ti ti-plus"></i> {{ i18n.ts.attachFile }}</MkButton>
			</div>

			<MkSwitch v-model="isSensitive">{{ i18n.ts.markAsSensitive }}</MkSwitch>

			<div class="_buttons">
				<MkButton v-if="postId" primary @click="save"><i class="ti ti-device-floppy"></i> {{ i18n.ts.save }}</MkButton>
				<MkButton v-else primary @click="save"><i class="ti ti-device-floppy"></i> {{ i18n.ts.publish }}</MkButton>

				<MkButton v-if="postId" danger @click="del"><i class="ti ti-trash"></i> {{ i18n.ts.delete }}</MkButton>
			</div>
		</FormSuspense>
	</MkSpacer>
</MkStickyContainer>
</template>

<script lang="ts" setup>
import { computed, watch, ref } from 'vue';
import MkButton from '@/components/MkButton.vue';
import MkInput from '@/components/MkInput.vue';
import MkTextarea from '@/components/MkTextarea.vue';
import MkSwitch from '@/components/MkSwitch.vue';
import FormSuspense from '@/components/form/suspense.vue';
import { selectFiles } from '@/scripts/select-file.js';
import * as os from '@/os.js';
import { useRouter } from '@/router.js';
import { definePageMetadata } from '@/scripts/page-metadata.js';
import { i18n } from '@/i18n.js';

const router = useRouter();

const props = defineProps<{
	postId?: string;
}>();

const init = ref(null);
const files = ref([]);
const description = ref(null);
const title = ref(null);
const isSensitive = ref(false);

function selectFile(evt) {
	selectFiles(evt.currentTarget ?? evt.target, null).then(selected => {
		files.value = files.value.concat(selected);
	});
}

function remove(file) {
	files.value = files.value.filter(f => f.id !== file.id);
}

async function save() {
	if (props.postId) {
		await os.apiWithDialog('gallery/posts/update', {
			postId: props.postId,
			title: title.value,
			description: description.value,
			fileIds: files.value.map(file => file.id),
			isSensitive: isSensitive.value,
		});
		router.push(`/gallery/${props.postId}`);
	} else {
		const created = await os.apiWithDialog('gallery/posts/create', {
			title: title.value,
			description: description.value,
			fileIds: files.value.map(file => file.id),
			isSensitive: isSensitive.value,
		});
		router.push(`/gallery/${created.id}`);
	}
}

async function del() {
	const { canceled } = await os.confirm({
		type: 'warning',
		text: i18n.ts.deleteConfirm,
	});
	if (canceled) return;
	await os.apiWithDialog('gallery/posts/delete', {
		postId: props.postId,
	});
	router.push('/gallery');
}

watch(() => props.postId, () => {
	init.value = () => props.postId ? os.api('gallery/posts/show', {
		postId: props.postId,
	}).then(post => {
		files.value = post.files;
		title.value = post.title;
		description.value = post.description;
		isSensitive.value = post.isSensitive;
	}) : Promise.resolve(null);
}, { immediate: true });

const headerActions = computed(() => []);

const headerTabs = computed(() => []);

definePageMetadata(computed(() => props.postId ? {
	title: i18n.ts.edit,
	icon: 'ti ti-pencil',
} : {
	title: i18n.ts.postToGallery,
	icon: 'ti ti-pencil',
}));
</script>

<style lang="scss" scoped>
.wqugxsfx {
	height: 200px;
	background-size: contain;
	background-position: center;
	background-repeat: no-repeat;
	position: relative;

	> .name {
		position: absolute;
		top: 8px;
		left: 9px;
		padding: 8px;
		background: var(--panel);
	}

	> .remove {
		position: absolute;
		top: 8px;
		right: 9px;
		padding: 8px;
		background: var(--panel);
	}
}
</style>
