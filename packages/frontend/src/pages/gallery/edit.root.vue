<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<PageWithHeader :actions="headerActions" :tabs="headerTabs">
	<div class="_spacer" style="--MI_SPACER-w: 800px; --MI_SPACER-min: 16px; --MI_SPACER-max: 32px;">
		<MkInput v-model="title">
			<template #label>{{ i18n.ts.title }}</template>
		</MkInput>

		<MkTextarea v-model="description" :max="500">
			<template #label>{{ i18n.ts.description }}</template>
		</MkTextarea>

		<div class="_gaps_s">
			<div v-for="file in files" :key="file.id" class="wqugxsfx" :style="{ backgroundImage: file ? `url(${ file.thumbnailUrl })` : '' }">
				<div class="name">{{ file.name }}</div>
				<button v-tooltip="i18n.ts.remove" class="remove _button" @click="remove(file)"><i class="ti ti-x"></i></button>
			</div>
			<MkButton primary @click="chooseFile"><i class="ti ti-plus"></i> {{ i18n.ts.attachFile }}</MkButton>
		</div>

		<MkSwitch v-model="isSensitive">{{ i18n.ts.markAsSensitive }}</MkSwitch>

		<div class="_buttons">
			<MkButton v-if="props.post != null" primary @click="save"><i class="ti ti-device-floppy"></i> {{ i18n.ts.save }}</MkButton>
			<MkButton v-else primary @click="save"><i class="ti ti-device-floppy"></i> {{ i18n.ts.publish }}</MkButton>

			<MkButton v-if="props.post != null" danger @click="del"><i class="ti ti-trash"></i> {{ i18n.ts.delete }}</MkButton>
		</div>
	</div>
</PageWithHeader>
</template>

<script lang="ts" setup>
import { computed, watch, ref } from 'vue';
import * as Misskey from 'misskey-js';
import MkButton from '@/components/MkButton.vue';
import MkInput from '@/components/MkInput.vue';
import MkTextarea from '@/components/MkTextarea.vue';
import MkSwitch from '@/components/MkSwitch.vue';
import { selectFile } from '@/utility/drive.js';
import * as os from '@/os.js';
import { misskeyApi } from '@/utility/misskey-api.js';
import { i18n } from '@/i18n.js';
import { useRouter } from '@/router.js';

const router = useRouter();

const props = defineProps<{
	post: Misskey.entities.GalleryPost | null;
}>();

const files = ref(props.post?.files ?? []);
const description = ref(props.post?.description ?? null);
const title = ref(props.post?.title ?? '');
const isSensitive = ref(props.post?.isSensitive ?? false);

function chooseFile(evt: MouseEvent) {
	selectFile({
		anchorElement: evt.currentTarget ?? evt.target,
		multiple: true,
	}).then(selected => {
		files.value = files.value.concat(selected);
	});
}

function remove(file: NonNullable<Misskey.entities.GalleryPost['files']>[number]) {
	files.value = files.value.filter(f => f.id !== file.id);
}

async function save() {
	if (props.post != null) {
		await os.apiWithDialog('gallery/posts/update', {
			postId: props.post.id,
			title: title.value,
			description: description.value,
			fileIds: files.value.map(file => file.id),
			isSensitive: isSensitive.value,
		});
		router.push('/gallery/:postId', {
			params: {
				postId: props.post.id,
			},
		});
	} else {
		const created = await os.apiWithDialog('gallery/posts/create', {
			title: title.value,
			description: description.value,
			fileIds: files.value.map(file => file.id),
			isSensitive: isSensitive.value,
		});
		router.push('/gallery/:postId', {
			params: {
				postId: created.id,
			},
		});
	}
}

async function del() {
	if (props.post == null) return;
	const { canceled } = await os.confirm({
		type: 'warning',
		text: i18n.ts.deleteConfirm,
	});
	if (canceled) return;
	await os.apiWithDialog('gallery/posts/delete', {
		postId: props.post.id,
	});
	router.push('/gallery');
}

const headerActions = computed(() => []);

const headerTabs = computed(() => []);
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
		background: var(--MI_THEME-panel);
	}

	> .remove {
		position: absolute;
		top: 8px;
		right: 9px;
		padding: 8px;
		background: var(--MI_THEME-panel);
	}
}
</style>
