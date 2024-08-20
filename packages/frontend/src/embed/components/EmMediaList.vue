<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div>
	<div v-for="media in mediaList.filter(media => !previewable(media))" :key="media.id" :class="$style.banner">
		<XBanner :media="media" :inert="inEmbedPage"/>
		<a v-if="inEmbedPage && originalEntityUrl" :href="originalEntityUrl" target="_blank" rel="noopener" :class="$style.mediaLinkForEmbed"></a>
	</div>
	<div v-if="mediaList.filter(media => previewable(media)).length > 0" :class="$style.container">
		<div
			:class="[
				$style.medias,
				count === 1 ? [$style.n1] : count === 2 ? $style.n2 : count === 3 ? $style.n3 : count === 4 ? $style.n4 : $style.nMany,
			]"
		>
			<div v-for="media in mediaList.filter(media => previewable(media))" :class="$style.media">
				<XVideo v-if="media.type.startsWith('video')" :key="`video:${media.id}`" :video="media" :class="$style.mediaInner" :inert="inEmbedPage"/>
				<XImage v-else-if="media.type.startsWith('image')" :key="`image:${media.id}`" :class="$style.mediaInner" class="image" :inert="inEmbedPage" :data-id="media.id" :image="media" :raw="raw"/>
				<a v-if="inEmbedPage && originalEntityUrl" :href="originalEntityUrl" target="_blank" rel="noopener" :class="$style.mediaLinkForEmbed"></a>
			</div>
		</div>
	</div>
</div>
</template>

<script lang="ts" setup>
import { computed, inject } from 'vue';
import * as Misskey from 'misskey-js';
import XBanner from './EmMediaBanner.vue';
import XImage from './EmMediaImage.vue';
import XVideo from './EmMediaVideo.vue';
import * as os from '@/os.js';
import { FILE_TYPE_BROWSERSAFE } from '@/const.js';

const props = defineProps<{
	mediaList: Misskey.entities.DriveFile[];
	raw?: boolean;

	/** 埋め込みページ用 親要素の正規URL */
	originalEntityUrl?: string;
}>();

const inEmbedPage = inject<boolean>('EMBED_PAGE', false);

const pswpZIndex = os.claimZIndex('middle');
document.documentElement.style.setProperty('--mk-pswp-root-z-index', pswpZIndex.toString());
const count = computed(() => props.mediaList.filter(media => previewable(media)).length);

let activeEl: HTMLElement | null = null;

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

.mediaLinkForEmbed::after {
	position: absolute;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	z-index: 1;
	content: '';
}

:global(.pswp) {
	--pswp-root-z-index: var(--mk-pswp-root-z-index, 2000700) !important;
	--pswp-bg: var(--modalBg) !important;
}
</style>

<style lang="scss">
.pswp__bg {
	background: var(--modalBg);
	backdrop-filter: var(--modalBgFilter);
}

.pswp__alt-text-container {
	display: flex;
	flex-direction: row;
	align-items: center;

	position: absolute;
	bottom: 20px;
	left: 50%;
	transform: translateX(-50%);

	width: 75%;
	max-width: 800px;
}

.pswp__alt-text {
	color: var(--fg);
	margin: 0 auto;
	text-align: center;
	padding: var(--margin);
	border-radius: var(--radius);
	max-height: 8em;
	overflow-y: auto;
	text-shadow: var(--bg) 0 0 10px, var(--bg) 0 0 3px, var(--bg) 0 0 3px;
	white-space: pre-line;
}
</style>
