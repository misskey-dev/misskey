<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
	<template v-for="file in note.files">
		<div v-if="file.isSensitive && !showingFiles.includes(file.id)" :class="$style.sensitive" @click="showingFiles.push(file.id)">
			<div>
				<div><i class="ti ti-eye-exclamation"></i> {{ i18n.ts.sensitive }}</div>
				<div>{{ i18n.ts.clickToShow }}</div>
			</div>
		</div>
		<MkA v-else :class="$style.img" :to="notePage(note)">
			<!-- TODO: 画像以外のファイルに対応 -->
			<ImgWithBlurhash :hash="file.blurhash" :src="thumbnail(file)" :title="file.name"/>
		</MkA>
	</template>
</template>

<script lang="ts" setup>

import { ref } from 'vue';
import { notePage } from '@/filters/note.js';
import { i18n } from '@/i18n.js';
import ImgWithBlurhash from '@/components/MkImgWithBlurhash.vue';
import * as Misskey from 'misskey-js';
import { defaultStore } from '@/store.js';
import { getProxiedImageUrl, getStaticImageUrl } from '@/scripts/media-proxy.js';

const props = defineProps<{
	note: Misskey.entities.Note;
}>();

const showingFiles = ref<string[]>([]);

function thumbnail(image: Misskey.entities.DriveFile): string {
	return defaultStore.state.disableShowingAnimatedImages
		? getStaticImageUrl(image.url)
		: image.thumbnailUrl ?? getProxiedImageUrl(image.url, 'preview');
}
</script>

<style lang="scss" module>
.img {
	height: 220px;
	border-radius: 6px;
	overflow: clip;
}

.empty {
	margin: 0;
	padding: 16px;
	text-align: center;
}

.sensitive {
	display: grid;
	place-items: center;
}
</style>
