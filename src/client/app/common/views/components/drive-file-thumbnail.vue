<template>
<div class="aqzdnzwsdgwhmztnueknzkwkjygptfcv" :class="{ detail, isSelected }" ref="thumbnail" :style="`background-color: ${ background }`">
	<img
		:src="file.url"
		:alt="file.name"
		:title="file.name"
		v-if="detail && is === 'image'"/>
	<video
		:src="file.url"
		ref="volumectrl"
		preload="metadata"
		controls
		v-else-if="detail && is === 'video'"/>
	<img :src="file.thumbnailUrl" alt="" @load="onThumbnailLoaded" :style="`object-fit: ${ fit }`" v-else-if="isThumbnailAvailable"/>
	<fa :icon="faFileImage" v-else-if="is === 'image'"/>
	<fa :icon="faFileVideo" v-else-if="is === 'video'"/>

	<audio
		:src="file.url"
		ref="volumectrl"
		preload="metadata"
		controls
		v-else-if="detail && is === 'audio'"/>
	<fa :icon="faMusic" v-else-if="is === 'audio' || is === 'midi'"/>

	<fa :icon="faFileCsv" v-else-if="is === 'csv'"/>
	<fa :icon="faFilePdf" v-else-if="is === 'pdf'"/>
	<fa :icon="faFileAlt" v-else-if="is === 'textfile'"/>
	<fa :icon="faFileArchive" v-else-if="is === 'archive'"/>
	<fa :icon="faFile" v-else/>

	<fa :icon="faFilm" class='file-icon-sub' v-if="!detail && isThumbnailAvailable && is === 'video'"/>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import anime from 'animejs';
import i18n from '../../../i18n';
import {
	faFile,
	faFileAlt,
	faFileImage,
	faMusic,
	faFileVideo,
	faFileCsv,
	faFilePdf,
	faFileArchive,
	faFilm
	} from '@fortawesome/free-solid-svg-icons';

export default Vue.extend({
	i18n: i18n('common/views/components/drive-file-icon.vue'),
	props: ['file', 'fit', 'detail', 'isSelected'],
	data() {
		return {
			isContextmenuShowing: false,
			isDragging: false,
			
			faFile,
			faFileAlt,
			faFileImage,
			faMusic,
			faFileVideo,
			faFileCsv,
			faFilePdf,
			faFileArchive,
			faFilm
		};
	},
	computed: {
		is(): 'image' | 'video' | 'midi' | 'audio' | 'csv' | 'pdf' | 'textfile' | 'archive' | 'unknown' {
			if (this.file.type.startsWith('image/')) return 'image';
			if (this.file.type.startsWith('video/')) return 'video';
			if (this.file.type === 'audio/midi') return 'midi';
			if (this.file.type.startsWith('audio/')) return 'audio';
			if (this.file.type.endsWith('/csv')) return 'csv';
			if (this.file.type.endsWith('/pdf')) return 'pdf';
			if (this.file.type.startsWith('text/')) return 'textfile';
			if ([
					"application/zip",
					"application/x-cpio",
					"application/x-bzip",
					"application/x-bzip2",
					"application/java-archive",
					"application/x-rar-compressed",
					"application/x-tar",
					"application/gzip",
					"application/x-7z-compressed"
				].some(e => e === this.file.type)) return 'archive';
			return 'unknown';
		},
		isThumbnailAvailable(): boolean {
			return this.file.thumbnailUrl.endsWith('?thumbnail') ? (this.is === 'image' || this.is === 'video') : true;
		},
		background(): string {
			return this.file.properties.avgColor && this.file.properties.avgColor.length == 3
				? `rgb(${this.file.properties.avgColor.join(',')})`
				: 'transparent';
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

	> svg.svg-inline--fa
		color var(--driveFileIcon)

	> svg.svg-inline--fa:not(.file-icon-sub)
		height 65%
		width 65%
		margin auto

	> video,
	> audio
		width 100%

	> svg.svg-inline--fa.file-icon-sub
		position absolute
		width 30%
		height auto
		margin 0
		right 4%
		bottom 4%
		filter drop-shadow(0 0 2px var(--driveFileThumbnailPlayIconShadow))

	&.detail
		> svg.svg-inline--fa
			height 100px
			margin 16px auto

	&.isSelected
		> svg.svg-inline--fa
			color var(--primaryForeground) !important
			
</style>
