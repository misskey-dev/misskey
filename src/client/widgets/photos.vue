<template>
<div>
	<mk-container :show-header="props.design === 0" :naked="props.design === 2" :class="$style.root" :data-melt="props.design === 2">
		<template #header><fa :icon="faCamera"/>{{ $t('_widgets.photos') }}</template>

		<div class="">
			<mk-loading v-if="fetching"/>
			<div v-else :class="$style.stream">
				<div v-for="(image, i) in images" :key="i"
					:class="$style.img"
					:style="`background-image: url(${thumbnail(image)})`"
				></div>
			</div>
		</div>
	</mk-container>
</div>
</template>

<script lang="ts">
import { faCamera } from '@fortawesome/free-solid-svg-icons';
import MkContainer from '../components/ui/container.vue';
import define from './define';
import i18n from '../i18n';
import { getStaticImageUrl } from '../scripts/get-static-image-url';

export default define({
	name: 'photos',
	props: () => ({
		design: 0,
	})
}).extend({
	i18n,
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
		this.connection = this.$root.stream.useSharedConnection('main');

		this.connection.on('driveFileCreated', this.onDriveFileCreated);

		this.$root.api('drive/stream', {
			type: 'image/*',
			limit: 9
		}).then(images => {
			this.images = images;
			this.fetching = false;
		});
	},
	beforeDestroy() {
		this.connection.dispose();
	},
	methods: {
		onDriveFileCreated(file) {
			if (/^image\/.+$/.test(file.type)) {
				this.images.unshift(file);
				if (this.images.length > 9) this.images.pop();
			}
		},

		func() {
			if (this.props.design === 2) {
				this.props.design = 0;
			} else {
				this.props.design++;
			}
			this.save();
		},

		thumbnail(image: any): string {
			return this.$store.state.device.disableShowingAnimatedImages
				? getStaticImageUrl(image.thumbnailUrl)
				: image.thumbnailUrl;
		},
	}
});
</script>

<style lang="scss" module>
.root[data-melt] {
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
