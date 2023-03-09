<template>
<div>
	<XBanner v-for="media in mediaList.filter(media => !previewable(media))" :key="media.id" :media="media"/>
	<div v-if="mediaList.filter(media => previewable(media)).length > 0" :class="$style.container">
		<div ref="gallery" :class="[$style.medias, count <= 4 ? $style['n' + count] : $style.nMany]">
			<template v-for="media in mediaList.filter(media => previewable(media))">
				<XVideo v-if="media.type.startsWith('video')" :key="media.id" :class="$style.media" :video="media"/>
				<XImage v-else-if="media.type.startsWith('image')" :key="media.id" :class="$style.media" class="image" :data-id="media.id" :image="media" :raw="raw"/>
			</template>
		</div>
	</div>
</div>
</template>

<script lang="ts" setup>
import { onMounted, ref, useCssModule } from 'vue';
import * as misskey from 'misskey-js';
import PhotoSwipeLightbox from 'photoswipe/lightbox';
import PhotoSwipe from 'photoswipe';
import 'photoswipe/style.css';
import XBanner from '@/components/MkMediaBanner.vue';
import XImage from '@/components/MkMediaImage.vue';
import XVideo from '@/components/MkMediaVideo.vue';
import * as os from '@/os';
import { FILE_TYPE_BROWSERSAFE } from '@/const';

const props = defineProps<{
	mediaList: misskey.entities.DriveFile[];
	raw?: boolean;
}>();

const $style = useCssModule();

const gallery = ref(null);
const pswpZIndex = os.claimZIndex('middle');
document.documentElement.style.setProperty('--mk-pswp-root-z-index', pswpZIndex.toString());
const count = $computed(() => props.mediaList.filter(media => previewable(media)).length);

onMounted(() => {
	const lightbox = new PhotoSwipeLightbox({
		dataSource: props.mediaList
			.filter(media => {
				if (media.type === 'image/svg+xml') return true; // svgのwebpublicはpngなのでtrue
				return media.type.startsWith('image') && FILE_TYPE_BROWSERSAFE.includes(media.type);
			})
			.map(media => {
				const item = {
					src: media.url,
					w: media.properties.width,
					h: media.properties.height,
					alt: media.comment ?? media.name,
					comment: media.comment ?? media.name,
				};
				if (media.properties.orientation != null && media.properties.orientation >= 5) {
					[item.w, item.h] = [item.h, item.w];
				}
				return item;
			}),
		gallery: gallery.value,
		mainClass: $style.pswp,
		children: '.image',
		thumbSelector: '.image',
		loop: false,
		padding: window.innerWidth > 500 ? {
			top: 32,
			bottom: 90,
			left: 32,
			right: 32,
		} : {
			top: 0,
			bottom: 78,
			left: 0,
			right: 0,
		},
		imageClickAction: 'close',
		tapAction: 'toggle-controls',
		bgOpacity: 1,
		pswpModule: PhotoSwipe,
	});

	lightbox.on('itemData', (ev) => {
		const { itemData } = ev;

		// element is children
		const { element } = itemData;

		const id = element.dataset.id;
		const file = props.mediaList.find(media => media.id === id);
		if (!file) return;

		itemData.src = file.url;
		itemData.w = Number(file.properties.width);
		itemData.h = Number(file.properties.height);
		if (file.properties.orientation != null && file.properties.orientation >= 5) {
			[itemData.w, itemData.h] = [itemData.h, itemData.w];
		}
		itemData.msrc = file.thumbnailUrl;
		itemData.alt = file.comment ?? file.name;
		itemData.comment = file.comment ?? file.name;
		itemData.thumbCropped = true;
	});

	lightbox.on('uiRegister', () => {
		lightbox.pswp.ui.registerElement({
			name: 'altText',
			className: 'pwsp__alt-text-container',
			appendTo: 'wrapper',
			onInit: (el, pwsp) => {
				let textBox = document.createElement('p');
				textBox.className = 'pwsp__alt-text _acrylic';
				el.appendChild(textBox);

				pwsp.on('change', (a) => {
					textBox.textContent = pwsp.currSlide.data.comment;
				});
			},
		});
	});

	lightbox.init();

	window.addEventListener('popstate', () => {
		if (lightbox.pswp && lightbox.pswp.isOpen === true) {
			lightbox.pswp.close();
			return;
		}
	});

	lightbox.on('beforeOpen', () => {
		history.pushState(null, '', '#pswp');
	});

	lightbox.on('close', () => {
		if (window.location.hash === '#pswp') {
			history.back();
		}
	});
});

const previewable = (file: misskey.entities.DriveFile): boolean => {
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

	// for webkit
	height: 100%;

	&.n1 {
		aspect-ratio: 16/9;
		grid-template-rows: 1fr;
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
}

.pswp {
	--pswp-root-z-index: var(--mk-pswp-root-z-index, 2000700) !important;
	--pswp-bg: var(--modalBg) !important;
}
</style>

<style lang="scss">
.pswp__bg {
	background: var(--modalBg);
	backdrop-filter: var(--modalBgFilter);
}

.pwsp__alt-text-container {
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

.pwsp__alt-text {
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
