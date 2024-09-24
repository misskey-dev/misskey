<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div>
	<div v-for="media in mediaList.filter(media => !previewable(media))" :key="media.id" :class="$style.banner">
		<XBanner :media="media" :href="originalEntityUrl"/>
	</div>
	<div v-if="mediaList.filter(media => previewable(media)).length > 0" :class="$style.container">
		<div
			:class="[
				$style.medias,
				count === 1 ? [$style.n1] : count === 2 ? $style.n2 : count === 3 ? $style.n3 : count === 4 ? $style.n4 : $style.nMany,
			]"
		>
			<div v-for="media in mediaList.filter(media => previewable(media))" :class="$style.media">
				<XVideo v-if="media.type.startsWith('video')" :key="`video:${media.id}`" :class="$style.mediaInner" :video="media" :href="originalEntityUrl"/>
				<XImage v-else-if="media.type.startsWith('image')" :key="`image:${media.id}`" :class="$style.mediaInner" class="image" :image="media" :raw="raw" :href="originalEntityUrl"/>
			</div>
		</div>
	</div>
</div>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import * as Misskey from 'misskey-js';
import XBanner from './EmMediaBanner.vue';
import XImage from './EmMediaImage.vue';
import XVideo from './EmMediaVideo.vue';
import { FILE_TYPE_BROWSERSAFE } from '@@/js/const.js';

const props = defineProps<{
	mediaList: Misskey.entities.DriveFile[];
	raw?: boolean;

	/** 埋め込みページ用 親要素の正規URL */
	originalEntityUrl: string;
}>();

const count = computed(() => props.mediaList.filter(media => previewable(media)).length);

const previewable = (file: Misskey.entities.DriveFile): boolean => {
	if (file.type === 'image/svg+xml') return true; // svgのwebpublic/thumbnailはpngなのでtrue
	// FILE_TYPE_BROWSERSAFEに適合しないものはブラウザで表示するのに不適切
	return (file.type.startsWith('video') || file.type.startsWith('image')) && FILE_TYPE_BROWSERSAFE.includes(file.type);
};
</script>

<style lang="scss" module>
.container {
	position: relative;
	width: 100%;
	margin-top: 4px;
}

.medias {
	display: grid;
	grid-gap: 8px;

	height: 100%;
	width: 100%;

	&.n1 {
		grid-template-rows: 1fr;

		// default but fallback (expand)
		min-height: 64px;
		max-height: clamp(
			64px,
			50cqh,
			min(360px, 50vh)
		);

		&.n116_9 {
			min-height: initial;
			max-height: initial;
			aspect-ratio: 16 / 9; // fallback
		}

		&.n11_1{
			min-height: initial;
			max-height: initial;
			aspect-ratio: 1 / 1; // fallback
		}

		&.n12_3 {
			min-height: initial;
			max-height: initial;
			aspect-ratio: 2 / 3; // fallback
		}
	}

	&.n2 {
		aspect-ratio: 16/9;
		grid-template-columns: 1fr 1fr;
		grid-template-rows: 1fr;
	}

	&.n3 {
		aspect-ratio: 16/9;
		grid-template-columns: 1fr 0.5fr;
		grid-template-rows: 1fr 1fr;

		> .media:nth-child(1) {
			grid-row: 1 / 3;
		}

		> .media:nth-child(3) {
			grid-column: 2 / 3;
			grid-row: 2 / 3;
		}
	}

	&.n4 {
		aspect-ratio: 16/9;
		grid-template-columns: 1fr 1fr;
		grid-template-rows: 1fr 1fr;
	}

	&.nMany {
		grid-template-columns: 1fr 1fr;

		> .media {
			aspect-ratio: 16/9;
		}
	}
}

.media {
	overflow: hidden; // clipにするとバグる
	border-radius: 8px;
	position: relative;

	>.mediaInner {
		width: 100%;
		height: 100%;
	}
}

.banner {
	position: relative;
}
</style>
