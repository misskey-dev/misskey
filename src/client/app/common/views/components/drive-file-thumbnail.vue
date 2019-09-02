<template>
<div class="zdjebgpv" :class="{ detail }" ref="thumbnail" :style="`background-color: ${ background }`">
	<img
		:src="file.url"
		:alt="file.name"
		:title="file.name"
		@load="onThumbnailLoaded"
		v-if="detail && is === 'image'"/>
	<video
		:src="file.url"
		ref="volumectrl"
		preload="metadata"
		controls
		v-else-if="detail && is === 'video'"/>
	<img :src="file.thumbnailUrl" alt="" @load="onThumbnailLoaded" :style="`object-fit: ${ fit }`" v-else-if="isThumbnailAvailable"/>
	<fa :icon="faFileImage" class="icon" v-else-if="is === 'image'"/>
	<fa :icon="faFileVideo" class="icon" v-else-if="is === 'video'"/>

	<audio
		:src="file.url"
		ref="volumectrl"
		preload="metadata"
		controls
		v-else-if="detail && is === 'audio'"/>
	<fa :icon="faMusic" class="icon" v-else-if="is === 'audio' || is === 'midi'"/>

	<fa :icon="faFileCsv" class="icon" v-else-if="is === 'csv'"/>
	<fa :icon="faFilePdf" class="icon" v-else-if="is === 'pdf'"/>
	<fa :icon="faFileAlt" class="icon" v-else-if="is === 'textfile'"/>
	<fa :icon="faFileArchive" class="icon" v-else-if="is === 'archive'"/>
	<fa :icon="faFile" class="icon" v-else/>

	<fa :icon="faFilm" class="icon-sub" v-if="!detail && isThumbnailAvailable && is === 'video'"/>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import anime from 'animejs';
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
	props: {
		file: {
			type: Object,
			required: true
		},
		fit: {
			type: String,
			required: false,
			default: 'cover'
		},
		detail: {
			type: Boolean,
			required: false,
			default: false
		}
	},
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
			return this.file.thumbnailUrl
				? (this.is === 'image' || this.is === 'video')
				: false;
		},
		background(): string {
			return this.file.properties.avgColor || 'transparent';
		}
	},
	mounted() {
		const audioTag = this.$refs.volumectrl as HTMLAudioElement;
		if (audioTag) audioTag.volume = this.$store.state.device.mediaVolume;
	},
	methods: {
		onThumbnailLoaded() {
			if (this.file.properties.avgColor) {
				anime({
					targets: this.$refs.thumbnail,
					backgroundColor: 'transparent', // TODO fade
					duration: 100,
					easing: 'linear'
				});
			}
		},
		volumechange() {
			const audioTag = this.$refs.volumectrl as HTMLAudioElement;
			this.$store.commit('device/set', { key: 'mediaVolume', value: audioTag.volume });
		}
	}
});
</script>

<style lang="stylus" scoped>
.zdjebgpv
	display flex

	> img,
	> .icon
		pointer-events none

	> .icon-sub
		position absolute
		width 30%
		height auto
		margin 0
		right 4%
		bottom 4%

	> *
		margin auto

	&:not(.detail)
		> img
			height 100%
			width 100%
			object-fit cover

		> .icon
			height 65%
			width 65%

		> video,
		> audio
			width 100%

	&.detail
		> .icon
			height 100px
			width 100px
			margin 16px

		> *:not(.icon)
			max-height 300px
			max-width 100%
			height 100%
			object-fit contain

</style>
