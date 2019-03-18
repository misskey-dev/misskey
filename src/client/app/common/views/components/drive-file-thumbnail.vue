<template>
<div class="aqzdnzwsdgwhmztnueknzkwkjygptfcv" :class="{ detail }" ref="thumbnail" :style="`background-color: ${ background }`">
	<img
		:src="file.url"
		:alt="file.name"
		:title="file.name"
		v-if="detail && isImage"/>
	<video
		:src="file.url"
		ref="volumectrl"
		preload="metadata"
		controls
		v-else-if="detail && isVideo"/>
	<img :src="file.thumbnailUrl" alt="" @load="onThumbnailLoaded" :style="`object-fit: ${ fit }`" v-else-if="isThumbnailAvailable"/>
	<fa :icon="faFileImage" v-else-if="isImage"/>
	<fa :icon="faFileVideo" v-else-if="isVideo"/>

	<audio
		:src="file.url"
		ref="volumectrl"
		preload="metadata"
		controls
		v-else-if="detail && isAudio"/>
	<fa :icon="faFileAudio" v-else-if="isAudio"/>

	<fa :icon="faFileCsv" v-else-if="file.type.endsWith('/csv')"/>
	<fa :icon="faFilePdf" v-else-if="file.type.endsWith('/pdf')"/>
	<fa :icon="faFileAlt" v-else-if="file.type.startsWith('text/')"/>
	<fa :icon="faFileArchive" v-else-if="isArchive"/>
	<fa :icon="faFile" v-else/>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import anime from 'animejs';
import i18n from '../../../i18n';
import { faFile, faFileAlt, faFileImage, faFileAudio, faFileVideo, faFileCsv, faFilePdf, faFileArchive } from '@fortawesome/free-solid-svg-icons';

export default Vue.extend({
	i18n: i18n('common/views/components/drive-file-icon.vue'),
	props: ['file', 'fit', 'detail'],
	data() {
		return {
			isContextmenuShowing: false,
			isDragging: false,
			faFile, faFileAlt, faFileImage, faFileAudio, faFileVideo, faFileCsv, faFilePdf, faFileArchive
		};
	},
	computed: {
		isImage(): boolean {
			return this.file.type.startsWith('image/');
		},
		isVideo(): boolean {
			return this.file.type.startsWith('video/');
		},
		isAudio(): boolean {
			return this.file.type.startsWith('audio/') && this.file.type !== 'audio/midi';
		},
		isThumbnailAvailable(): boolean {
			return this.file.thumbnailUrl.endsWith('?thumbnail') ? (this.isImage || this.isVideo) : true;
		},
		background(): string {
			return this.file.properties.avgColor && this.file.properties.avgColor.length == 3
				? `rgb(${this.file.properties.avgColor.join(',')})`
				: 'transparent';
		},
		isArchive(): boolean {
			return [
				"application/zip",
				"application/x-cpio",
				"application/x-bzip",
				"application/x-bzip2",
				"application/java-archive",
				"application/x-rar-compressed",
				"application/x-tar",
				"application/gzip",
				"application/x-7z-compressed"
			].some(e => e === this.file.type);
		}
	},
	mounted() {
		const audioTag = this.$refs.volumectrl as HTMLAudioElement;
		if (audioTag) audioTag.volume = this.$store.state.device.mediaVolume;
	},
	methods: {
		onThumbnailLoaded() {
			if (this.file.properties.avgColor && this.file.properties.avgColor.length == 3) {
				anime({
					targets: this.$refs.thumbnail,
					backgroundColor: `rgba(${this.file.properties.avgColor.join(',')}, 0)`,
					duration: 100,
					easing: 'linear'
				});
			}
		},
		volumechange() {
			const audioTag = this.$refs.audio as HTMLAudioElement;
			this.$store.commit('device/set', { key: 'mediaVolume', value: audioTag.volume });
		}
	}
});
</script>

<style lang="stylus" scoped>
.aqzdnzwsdgwhmztnueknzkwkjygptfcv
	display flex

	> img
		height 100%
		width 100%
		margin auto
		object-fit cover

	> svg
		color var(--text)
		height 65%
		width 65%
		margin auto

	> video,
	> audio
		width 100%

	&.detail
		> svg
			height 100px
			margin 16px auto
</style>
