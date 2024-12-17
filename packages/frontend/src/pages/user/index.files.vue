<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkContainer :max-height="300" :foldable="true">
	<template #icon><i class="ti ti-photo"></i></template>
	<template #header>{{ i18n.ts.files }}</template>
	<div :class="$style.root">
		<MkLoading v-if="fetching"/>
		<div v-if="!fetching && medias.length > 0" :class="$style.stream">
			<template v-for="media in medias" :key="media.note.id + media.file.id">
				<MkA :to="notePage(media.note)">
					<XVideo v-if="media.file.type.startsWith('video')" :key="`video:${media.file.id}`" :class="$style.media" :video="media.file" :videoControls="false"/>
					<XImage v-else-if="media.file.type.startsWith('image')" :key="`image:${media.file.id}`" :class="$style.media" class="image" :data-id="media.file.id" :image="media.file" :disableImageLink="true"/>
					<XBanner v-else :media="media.file" :user="user"/>
				</MkA>
			</template>
		</div>
		<p v-if="!fetching && medias.length == 0" :class="$style.empty">{{ i18n.ts.nothing }}</p>
	</div>
</MkContainer>
</template>

<script lang="ts" setup>
import { onMounted, ref } from 'vue';
import * as Misskey from 'misskey-js';
import { notePage } from '@/filters/note.js';
import { misskeyApi } from '@/scripts/misskey-api.js';
import MkContainer from '@/components/MkContainer.vue';
import XVideo from '@/components/MkMediaVideo.vue';
import XImage from '@/components/MkMediaImage.vue';
import XBanner from '@/components/MkMediaBanner.vue';
import { i18n } from '@/i18n.js';

const props = defineProps<{
	user: Misskey.entities.UserDetailed;
}>();

const fetching = ref(true);
const medias = ref<{
	note: Misskey.entities.Note;
	file: Misskey.entities.DriveFile;
}[]>([]);

onMounted(() => {
	misskeyApi('users/notes', {
		userId: props.user.id,
		withFiles: true,
		limit: 15,
	}).then(notes => {
		for (const note of notes) {
			for (const file of note.files) {
				medias.value.push({
					note,
					file,
				});
			}
		}
		fetching.value = false;
	});
});
</script>

<style lang="scss" module>
.root {
	padding: 8px;
}

.stream {
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
	grid-gap: 6px;
}

.media {
	position: relative;
	height: 128px;
	border-radius: 6px;
	overflow: clip;
}

.empty {
	margin: 0;
	padding: 16px;
	text-align: center;
}
</style>
