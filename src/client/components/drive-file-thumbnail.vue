<template>
<div class="zdjebgpv" ref="thumbnail">
	<ImgWithBlurhash v-if="isThumbnailAvailable" :hash="file.blurhash" :src="file.thumbnailUrl" :alt="file.name" :title="file.name" :style="`object-fit: ${ fit }`"/>
	<Fa :icon="faFileImage" class="icon" v-else-if="is === 'image'"/>
	<Fa :icon="faFileVideo" class="icon" v-else-if="is === 'video'"/>
	<Fa :icon="faMusic" class="icon" v-else-if="is === 'audio' || is === 'midi'"/>
	<Fa :icon="faFileCsv" class="icon" v-else-if="is === 'csv'"/>
	<Fa :icon="faFilePdf" class="icon" v-else-if="is === 'pdf'"/>
	<Fa :icon="faFileAlt" class="icon" v-else-if="is === 'textfile'"/>
	<Fa :icon="faFileArchive" class="icon" v-else-if="is === 'archive'"/>
	<Fa :icon="faFile" class="icon" v-else/>
	<Fa :icon="faFilm" class="icon-sub" v-if="isThumbnailAvailable && is === 'video'"/>
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
import ImgWithBlurhash from './img-with-blurhash.vue';
import { ColdDeviceStorage } from '@/storage';

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
