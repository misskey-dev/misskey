<template>
<div class="hoawjimk">
	<XBanner v-for="media in mediaList.filter(media => !previewable(media))" :key="media.id" :media="media"/>
	<div v-if="mediaList.filter(media => previewable(media)).length > 0" class="gird-container">
		<div ref="gallery" :data-count="mediaList.filter(media => previewable(media)).length">
			<template v-for="media in mediaList">
				<XVideo v-if="media.type.startsWith('video')" :key="media.id" :video="media"/>
				<XImage v-else-if="media.type.startsWith('image')" :key="media.id" class="image" :data-id="media.id" :image="media" :raw="raw"/>
			</template>
		</div>
	</div>
</div>
</template>

<script lang="ts">
import { defineComponent, onMounted, PropType, ref } from 'vue';
import * as misskey from 'misskey-js';
import PhotoSwipeLightbox from 'photoswipe/dist/photoswipe-lightbox.esm.js';
import PhotoSwipe from 'photoswipe/dist/photoswipe.esm.js';
import 'photoswipe/dist/photoswipe.css';
import XBanner from './media-banner.vue';
import XImage from './media-image.vue';
import XVideo from './media-video.vue';
import * as os from '@/os';
import { defaultStore } from '@/store';

export default defineComponent({
	components: {
		XBanner,
		XImage,
		XVideo,
	},
	props: {
		mediaList: {
			type: Array as PropType<misskey.entities.DriveFile[]>,
			required: true,
		},
		raw: {
			default: false
		},
	},
	setup(props) {
		const gallery = ref(null);

		onMounted(() => {
			const lightbox = new PhotoSwipeLightbox({
				dataSource: props.mediaList.filter(media => media.type.startsWith('image')).map(media => ({
					src: media.url,
					w: media.properties.width,
					h: media.properties.height,
					alt: media.name,
				})),
				gallery: gallery.value,
				children: '.image',
				thumbSelector: '.image',
				pswpModule: PhotoSwipe
			});

			lightbox.on('itemData', (e) => {
				const { itemData } = e;

				// element is children
				const { element } = itemData;

				const id = element.dataset.id;
				const file = props.mediaList.find(media => media.id === id);

				itemData.src = file.url;
				itemData.w = Number(file.properties.width);
				itemData.h = Number(file.properties.height);
				itemData.msrc = file.thumbnailUrl;
				itemData.thumbCropped = true;
			});

			lightbox.init();
		});

		const previewable = (file: misskey.entities.DriveFile): boolean => {
			return file.type.startsWith('video') || file.type.startsWith('image');
		};

		return {
			previewable,
			gallery,
		};
	},
});
</script>

<style lang="scss" scoped>
.hoawjimk {
	> .gird-container {
		position: relative;
		width: 100%;
		margin-top: 4px;

		&:before {
			content: '';
			display: block;
			padding-top: 56.25% // 16:9;
		}

		> div {
			position: absolute;
			top: 0;
			right: 0;
			bottom: 0;
			left: 0;
			display: grid;
			grid-gap: 4px;

			> * {
				overflow: hidden;
				border-radius: 6px;
			}

			&[data-count="1"] {
				grid-template-rows: 1fr;
			}

			&[data-count="2"] {
				grid-template-columns: 1fr 1fr;
				grid-template-rows: 1fr;
			}

			&[data-count="3"] {
				grid-template-columns: 1fr 0.5fr;
				grid-template-rows: 1fr 1fr;

				> *:nth-child(1) {
					grid-row: 1 / 3;
				}

				> *:nth-child(3) {
					grid-column: 2 / 3;
					grid-row: 2 / 3;
				}
			}

			&[data-count="4"] {
				grid-template-columns: 1fr 1fr;
				grid-template-rows: 1fr 1fr;
			}

			> *:nth-child(1) {
				grid-column: 1 / 2;
				grid-row: 1 / 2;
			}

			> *:nth-child(2) {
				grid-column: 2 / 3;
				grid-row: 1 / 2;
			}

			> *:nth-child(3) {
				grid-column: 1 / 2;
				grid-row: 2 / 3;
			}

			> *:nth-child(4) {
				grid-column: 2 / 3;
				grid-row: 2 / 3;
			}
		}
	}
}
</style>
