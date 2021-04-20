<template>
<div class="zdjebgpv" ref="thumbnail">
	<ImgWithBlurhash v-if="isThumbnailAvailable" :hash="file.blurhash" :src="file.thumbnailUrl" :alt="file.name" :title="file.name" :style="`object-fit: ${ fit }`"/>
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

<script lang="ts">
import { defineComponent } from 'vue';
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
import ImgWithBlurhash from '@client/components/img-with-blurhash.vue';
import { ColdDeviceStorage } from '@client/store';

export default defineComponent({
	components: {
		ImgWithBlurhash
	},
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
	},
	mounted() {
		const audioTag = this.$refs.volumectrl as HTMLAudioElement;
		if (audioTag) audioTag.volume = ColdDeviceStorage.get('mediaVolume');
	},
	methods: {
		volumechange() {
			const audioTag = this.$refs.volumectrl as HTMLAudioElement;
			ColdDeviceStorage.set('mediaVolume', audioTag.volume);
		}
	}
});
</script>

<style lang="scss" scoped>
.zdjebgpv {
	position: relative;

	> .icon-sub {
		position: absolute;
		width: 30%;
		height: auto;
		margin: 0;
		right: 4%;
		bottom: 4%;
	}

	> * {
		margin: auto;
	}

	> .icon {
		pointer-events: none;
		height: 65%;
		width: 65%;
	}
}
</style>
