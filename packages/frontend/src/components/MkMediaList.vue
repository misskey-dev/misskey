<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div :class="$style.root">
	<XBanner v-for="media in medias.nonPreviewable" :key="media.id" :media="media"/>
	<div v-if="count > 0" :class="$style.container">
		<div
			ref="gallery"
			:class="[
				$style.medias,
				...(prefer.s.showMediaListByGridInWideArea ? [$style.gridInWideArea] : []),
				count === 1 ? [$style.n1, {
					[$style.n116_9]: prefer.s.mediaListWithOneImageAppearance === '16_9',
					[$style.n11_1]: prefer.s.mediaListWithOneImageAppearance === '1_1',
					[$style.n12_3]: prefer.s.mediaListWithOneImageAppearance === '2_3',
				}] : count === 2 ? $style.n2 : count === 3 ? $style.n3 : count === 4 ? $style.n4 : $style.nMany,
			]"
		>
			<template v-for="media in medias.previewable">
				<XAudio
					v-if="media.type.startsWith('audio')"
					:key="`audio:${media.id}`"
					:class="$style.media"
					:audio="media"
					@mediaClick="onMediaClick(media)"
				/>
				<XVideo
					v-if="media.type.startsWith('video')"
					:key="`video:${media.id}`"
					:ref="(comp) => { mediaComponents.set(media.id, comp as InstanceType<typeof XVideo> | null); }"
					:class="$style.media"
					:video="media"
					@mediaClick="onMediaClick(media)"
				/>
				<XImage
					v-else-if="media.type.startsWith('image')"
					:key="`image:${media.id}`"
					:ref="(comp) => { mediaComponents.set(media.id, comp as InstanceType<typeof XImage> | null); }"
					:marker="`${markerId}:${media.id}`"
					:disableImageLink="true"
					:class="$style.media"
					:image="media"
					:raw="raw"
					@mediaClick="onMediaClick(media)"
				/>
			</template>
		</div>
	</div>
</div>
</template>

<script lang="ts" setup>
import { computed, markRaw, onMounted, onUnmounted, useTemplateRef } from 'vue';
import * as Misskey from 'misskey-js';
import type { Content } from '@/components/MkLightbox.item.vue';
import type { MediaComponentExposes } from '@/types/media-component.js';
import XBanner from '@/components/MkMediaBanner.vue';
import XAudio from '@/components/MkMediaAudio.vue';
import XImage from '@/components/MkMediaImage.vue';
import XVideo from '@/components/MkMediaVideo.vue';
import * as os from '@/os.js';
import { prefer } from '@/preferences.js';
import { isPreviewable, getType } from '@/utility/lightbox.js';
import { genId } from '@/utility/id.js';

const props = defineProps<{
	mediaList: Misskey.entities.DriveFile[];
	user?: Misskey.entities.User | null; // DriveFileのuserはnullになることがある。その場合に使用する所有者情報
	raw?: boolean;
}>();

const gallery = useTemplateRef('gallery');
const medias = computed(() => {
	const previewable: Misskey.entities.DriveFile[] = [];
	const nonPreviewable: Misskey.entities.DriveFile[] = [];
	for (const file of props.mediaList) {
		if (isPreviewable(file.type)) {
			previewable.push(file);
		} else {
			nonPreviewable.push(file);
		}
	}

	return {
		previewable,
		nonPreviewable,
	};
});
const mediaComponents = new Map<string, MediaComponentExposes | null>();
const count = computed(() => medias.value.previewable.length);
const markerId = genId();

async function calcAspectRatio() {
	if (!gallery.value) return;

	const img = props.mediaList[0];

	if (props.mediaList.length !== 1 || !(img.properties.width && img.properties.height)) {
		gallery.value.style.aspectRatio = '';
		return;
	}

	const ratioMax = (ratio: number) => {
		if (img.properties.width == null || img.properties.height == null) return '';
		return `${Math.max(ratio, img.properties.width / img.properties.height).toString()} / 1`;
	};

	switch (prefer.s.mediaListWithOneImageAppearance) {
		case '16_9':
			gallery.value.style.aspectRatio = ratioMax(16 / 9);
			break;
		case '1_1':
			gallery.value.style.aspectRatio = ratioMax(1 / 1);
			break;
		case '2_3':
			gallery.value.style.aspectRatio = ratioMax(2 / 3);
			break;
		default:
			gallery.value.style.aspectRatio = '';
			break;
	}
}

onMounted(() => {
	calcAspectRatio();

	if (gallery.value == null) return; // TSを黙らすため
});

onUnmounted(() => {
	mediaComponents.clear();
});

function onMediaClick(file: Misskey.entities.DriveFile) {
	if (prefer.s.imageNewTab) {
		window.open(file.url, '_blank');
		return;
	}
	openGallery(file.id);
}

async function openGallery(id?: string) {
	if (id == null) {
		const firstImage = medias.value.previewable[0];
		if (firstImage == null) return;
		id = firstImage.id;
	}

	const getElementByMarker = (marker: string) => {
		if (gallery.value == null) return null;
		const found = gallery.value.querySelector(`[data-marker="${marker}"]`) as HTMLElement | null;
		if (found == null) return null;
		return markRaw(found);
	};

	const contents = medias.value.previewable.map<Content>(media => ({
		id: media.id,
		type: getType(media.type),
		url: media.url,
		thumbnailUrl: media.thumbnailUrl,
		width: media.properties.width,
		height: media.properties.height,
		filename: media.name,
		file: media,
		sourceElement: getElementByMarker(`${markerId}:${media.id}`),
	}));

	const initiallyRevealedContentIds = contents
		.filter(content => mediaComponents.get(content.id)?.isRevealed() === true)
		.map(content => content.id);

	const { dispose } = await os.popupAsyncWithDialog(import('@/components/MkLightbox.vue').then(x => x.default), {
		defaultIndex: contents.findIndex(conten => conten.id === id),
		contents: contents,
		initiallyRevealedContentIds,
		user: props.user,
	}, {
		closed: () => dispose(),
	});
}

defineExpose({
	openGallery,
});
</script>

<style lang="scss" module>
.root {
	container-type: inline-size;
}

.container {
	position: relative;
	width: 100%;
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
	cursor: zoom-in;
}

@container (min-width: 500px) {
	.medias.gridInWideArea {
		display: grid;
		aspect-ratio: auto;
		grid-template-columns: repeat(4, 1fr);
		grid-template-rows: auto;
		grid-gap: 8px;

		> .media {
			aspect-ratio: 1 / 1;
		}
	}
}
</style>
