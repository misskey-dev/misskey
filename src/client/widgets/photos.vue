<template>
<MkContainer :show-header="props.showHeader" :naked="props.transparent" :class="$style.root" :data-transparent="props.transparent ? true : null">
	<template #header><Fa :icon="faCamera"/>{{ $ts._widgets.photos }}</template>

	<div class="">
		<MkLoading v-if="fetching"/>
		<div v-else :class="$style.stream">
			<div v-for="(image, i) in images" :key="i"
				:class="$style.img"
				:style="`background-image: url(${thumbnail(image)})`"
			></div>
		</div>
	</div>
</MkContainer>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { faCamera } from '@fortawesome/free-solid-svg-icons';
import MkContainer from '@client/components/ui/container.vue';
import define from './define';
import { getStaticImageUrl } from '@client/scripts/get-static-image-url';
import * as os from '@client/os';

const widget = define({
	name: 'photos',
	props: () => ({
		showHeader: {
			type: 'boolean',
			default: true,
		},
		transparent: {
			type: 'boolean',
			default: false,
		},
	})
});

export default defineComponent({
	extends: widget,
	components: {
		MkContainer,
	},
	data() {
		return {
			images: [],
			fetching: true,
			connection: null,
			faCamera
		};
	},
	mounted() {
		this.connection = os.stream.useSharedConnection('main');

		this.connection.on('driveFileCreated', this.onDriveFileCreated);

		os.api('drive/stream', {
			type: 'image/*',
			limit: 9
		}).then(images => {
			this.images = images;
			this.fetching = false;
		});
	},
	beforeUnmount() {
		this.connection.dispose();
	},
	methods: {
		onDriveFileCreated(file) {
			if (/^image\/.+$/.test(file.type)) {
				this.images.unshift(file);
				if (this.images.length > 9) this.images.pop();
			}
		},

		thumbnail(image: any): string {
			return this.$store.state.disableShowingAnimatedImages
				? getStaticImageUrl(image.thumbnailUrl)
				: image.thumbnailUrl;
		},
	}
});
</script>

<style lang="scss" module>
.root[data-transparent] {
	.stream {
		padding: 0;
	}

	.img {
		border: solid 4px transparent;
		border-radius: 8px;
	}
}

.stream {
	display: flex;
	justify-content: center;
	flex-wrap: wrap;
	padding: 8px;

	.img {
		flex: 1 1 33%;
		width: 33%;
		height: 80px;
		box-sizing: border-box;
		background-position: center center;
		background-size: cover;
		background-clip: content-box;
		border: solid 2px transparent;
		border-radius: 4px;
	}
}
</style>
