<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
	<template v-for="file in note.files">
		<div
			v-if="(defaultStore.state.nsfw === 'force' || file.isSensitive) && defaultStore.state.nsfw !== 'ignore' && !showingFiles.has(file.id)"
			:class="[$style.img, { [$style.square]: square }]"
			@click="showingFiles.add(file.id)"
		>
			<ImgWithBlurhash
				v-if="FILE_TYPE_BROWSERSAFE.includes(file.type) && (file.type.startsWith('image/') || (file.type.startsWith('video/') && file.thumbnailUrl != null))"
				:class="$style.sensitiveImg"
				:hash="file.blurhash"
				:src="thumbnail(file)"
				:title="file.name"
				:forceBlurhash="true"
			/>
			<XFilePreview v-else :class="$style.sensitiveFile" :file="file" :bgIsPanel="bgIsPanel"/>
			<div :class="$style.sensitive">
				<div>
					<div><i class="ti ti-eye-exclamation"></i> {{ i18n.ts.sensitive }}</div>
					<div>{{ i18n.ts.clickToShow }}</div>
				</div>
			</div>
		</div>
		<MkA v-else :class="[$style.img, { [$style.square]: square }]" :to="notePage(note)">
			<ImgWithBlurhash
				v-if="FILE_TYPE_BROWSERSAFE.includes(file.type) && (file.type.startsWith('image/') || (file.type.startsWith('video/') && file.thumbnailUrl != null))"
				:hash="file.blurhash"
				:src="thumbnail(file)"
				:title="file.name"
			/>
			<XFilePreview v-else :file="file" :bgIsPanel="bgIsPanel"/>
		</MkA>
	</template>
</template>

<script lang="ts" setup>

import { ref } from 'vue';
import { FILE_TYPE_BROWSERSAFE } from '@@/js/const.js';
import { notePage } from '@/filters/note.js';
import { i18n } from '@/i18n.js';
import ImgWithBlurhash from '@/components/MkImgWithBlurhash.vue';
import * as Misskey from 'misskey-js';
import { defaultStore } from '@/store.js';
import { getProxiedImageUrl, getStaticImageUrl } from '@/scripts/media-proxy.js';

import XFilePreview from '@/components/MkNoteMediaGrid.file.vue';

defineProps<{
	note: Misskey.entities.Note;
	square?: boolean;
	bgIsPanel?: boolean;
}>();

const showingFiles = ref<Set<string>>(new Set());

function thumbnail(image: Misskey.entities.DriveFile): string {
	return defaultStore.state.disableShowingAnimatedImages
		? getStaticImageUrl(image.url)
		: image.thumbnailUrl ?? getProxiedImageUrl(image.url, 'preview');
}
</script>

<style lang="scss" module>
.square {
	width: 100%;
	height: auto;
	aspect-ratio: 1;
}

.img {
	position: relative;
	height: 128px;
	border-radius: 6px;
	overflow: clip;

	&:hover {
		text-decoration: none;
	}

	&.square {
		height: 100%;
	}
}

.sensitiveImg {
	position: absolute;
	top: 0;
	left: 0;
	width: 100%;
	height: 100%;
	filter: brightness(0.7);
}

.sensitiveFile {
	filter: brightness(0.5) blur(2px);
}

.sensitive {
	position: absolute;
	top: 0;
	left: 0;
	width: 100%;
	height: 100%;
	display: grid;
  place-items: center;
	font-size: 0.8em;
	color: #fff;
	cursor: pointer;
}
</style>
