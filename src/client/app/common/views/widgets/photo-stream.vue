<template>
<div class="mkw-photo-stream" :class="$style.root" :data-melt="props.design == 2">
	<ui-container :show-header="props.design == 0" :naked="props.design == 2">
		<template slot="header"><fa icon="camera"/>{{ $t('title') }}</template>

		<p :class="$style.fetching" v-if="fetching"><fa icon="spinner" pulse fixed-width/>{{ $t('@.loading') }}<mk-ellipsis/></p>
		<div :class="$style.stream" v-if="!fetching && images.length > 0">
			<div v-for="(image, i) in images" :key="i"
				:class="$style.img"
				:style="`background-image: url(${thumbnail(image)})`"
				draggable="true"
				@dragstart="onDragstart(image, $event)"
			></div>
		</div>
		<p :class="$style.empty" v-if="!fetching && images.length == 0">{{ $t('no-photos') }}</p>
	</ui-container>
</div>
</template>

<script lang="ts">
import define from '../../../common/define-widget';
import i18n from '../../../i18n';
import { getStaticImageUrl } from '../../scripts/get-static-image-url';

export default define({
	name: 'photo-stream',
	props: () => ({
		design: 0
	})
}).extend({
	i18n: i18n('common/views/widgets/photo-stream.vue'),

	data() {
		return {
			images: [],
			fetching: true,
			connection: null
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
			if (this.props.design == 2) {
				this.props.design = 0;
			} else {
				this.props.design++;
			}

			this.save();
		},

		onDragstart(file, e) {
			e.dataTransfer.effectAllowed = 'move';
			e.dataTransfer.setData('mk_drive_file', JSON.stringify(file));
		},

		thumbnail(image: any): string {
			return this.$store.state.device.disableShowingAnimatedImages
				? getStaticImageUrl(image.thumbnailUrl)
				: image.thumbnailUrl;
		},
	}
});
</script>

<style lang="stylus" module>
.root[data-melt]
	.stream
		padding 0

	.img
		border solid 4px transparent
		border-radius 8px

.stream
	display flex
	justify-content center
	flex-wrap wrap
	padding 8px

	.img
		flex 1 1 33%
		width 33%
		height 80px
		background-position center center
		background-size cover
		border solid 2px transparent
		border-radius 4px

.fetching
.empty
	margin 0
	padding 16px
	text-align center
	color var(--text)

	> [data-icon]
		margin-right 4px

</style>
