<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div
	v-panel
	:class="[$style.root, {
		[$style.sensitiveHighlight]: highlightWhenSensitive && file.isSensitive,
		[$style.large]: large,
	}]"
>
	<MkImgWithBlurhash
		v-if="isThumbnailAvailable && prefer.s.enableHighQualityImagePlaceholders"
		:hash="file.blurhash"
		:src="file.thumbnailUrl"
		:alt="file.name"
		:title="file.name"
		:class="$style.thumbnail"
		:cover="fit !== 'contain'"
		:forceBlurhash="forceBlurhash"
	/>
	<img
		v-else-if="isThumbnailAvailable"
		:src="file.thumbnailUrl!"
		:alt="file.name"
		:title="file.name"
		:class="$style.thumbnail"
		:style="{ objectFit: fit }"
	/>
	<i v-else :class="[$style.icon, fileIcon]"></i>

	<i v-if="isThumbnailAvailable && is === 'video'" class="ti ti-video" :class="$style.iconSub"></i>
</div>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import * as Misskey from 'misskey-js';
import MkImgWithBlurhash from '@/components/MkImgWithBlurhash.vue';
import { getFileType, getFileTypeIcon } from '@/utility/file-type.js';
import { prefer } from '@/preferences.js';

const props = defineProps<{
	file: Misskey.entities.DriveFile;
	fit: 'cover' | 'contain';
	highlightWhenSensitive?: boolean;
	forceBlurhash?: boolean;
	large?: boolean;
}>();

const is = computed(() => getFileType(props.file.type));
const fileIcon = computed(() => getFileTypeIcon(is.value));

const isThumbnailAvailable = computed(() => {
	return props.file.thumbnailUrl
		? (is.value === 'image' || is.value === 'video')
		: false;
});
</script>

<style lang="scss" module>
.root {
	position: relative;
	display: flex;
	background: var(--MI_THEME-panel);
	border-radius: 8px;
	overflow: clip;
}

.sensitiveHighlight::after {
	content: "";
	position: absolute;
	top: 0;
	left: 0;
	width: 100%;
	height: 100%;
	pointer-events: none;
	border-radius: inherit;
	box-shadow: inset 0 0 0 4px var(--MI_THEME-warn);
}

.iconSub {
	position: absolute;
	width: 30%;
	height: auto;
	margin: 0;
	right: 4%;
	bottom: 4%;
}

.icon {
	pointer-events: none;
	margin: auto;
	font-size: 32px;
	color: #777;
}

.large .icon {
	font-size: 40px;
}

.thumbnail {
	width: 100%;
}
</style>
