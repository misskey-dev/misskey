<template>
<div ref="thumbnail" class="zdjebgpv">
	<ImgWithBlurhash v-if="isThumbnailAvailable" :hash="file.blurhash" :src="file.thumbnailUrl" :alt="file.name" :title="file.name" :cover="fit !== 'contain'"/>
	<i v-else-if="is === 'image'" class="fas fa-file-image icon"></i>
	<i v-else-if="is === 'video'" class="fas fa-file-video icon"></i>
	<i v-else-if="is === 'audio' || is === 'midi'" class="fas fa-music icon"></i>
	<i v-else-if="is === 'csv'" class="fas fa-file-csv icon"></i>
	<i v-else-if="is === 'pdf'" class="fas fa-file-pdf icon"></i>
	<i v-else-if="is === 'textfile'" class="fas fa-file-alt icon"></i>
	<i v-else-if="is === 'archive'" class="fas fa-file-archive icon"></i>
	<i v-else class="fas fa-file icon"></i>

	<i v-if="isThumbnailAvailable && is === 'video'" class="fas fa-film icon-sub"></i>
</div>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import * as Misskey from 'misskey-js';
import ImgWithBlurhash from '@/components/MkImgWithBlurhash.vue';

const props = defineProps<{
	file: Misskey.entities.DriveFile;
	fit: string;
}>();

const is = computed(() => {
	if (props.file.type.startsWith('image/')) return 'image';
	if (props.file.type.startsWith('video/')) return 'video';
	if (props.file.type === 'audio/midi') return 'midi';
	if (props.file.type.startsWith('audio/')) return 'audio';
	if (props.file.type.endsWith('/csv')) return 'csv';
	if (props.file.type.endsWith('/pdf')) return 'pdf';
	if (props.file.type.startsWith('text/')) return 'textfile';
	if ([
		'application/zip',
		'application/x-cpio',
		'application/x-bzip',
		'application/x-bzip2',
		'application/java-archive',
		'application/x-rar-compressed',
		'application/x-tar',
		'application/gzip',
		'application/x-7z-compressed',
	].some(archiveType => archiveType === props.file.type)) return 'archive';
	return 'unknown';
});

const isThumbnailAvailable = computed(() => {
	return props.file.thumbnailUrl
		? (is.value === 'image' as const || is.value === 'video')
		: false;
});
</script>

<style lang="scss" scoped>
.zdjebgpv {
	position: relative;
	display: flex;
	background: var(--panel);
	border-radius: 8px;
	overflow: clip;

	> .icon-sub {
		position: absolute;
		width: 30%;
		height: auto;
		margin: 0;
		right: 4%;
		bottom: 4%;
	}

	> .icon {
		pointer-events: none;
		margin: auto;
		font-size: 32px;
		color: #777;
	}
}
</style>
