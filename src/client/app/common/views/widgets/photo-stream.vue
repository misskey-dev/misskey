<template>
<div class="mkw-photo-stream" :class="$style.root" :data-melt="props.design == 2">
	<mk-widget-container :show-header="props.design == 0" :naked="props.design == 2">
		<template slot="header">%fa:camera%%i18n:@title%</template>

		<p :class="$style.fetching" v-if="fetching">%fa:spinner .pulse .fw%%i18n:common.loading%<mk-ellipsis/></p>
		<div :class="$style.stream" v-if="!fetching && images.length > 0">
			<div v-for="image in images" :class="$style.img" :style="`background-image: url(${image.url}?thumbnail&size=256)`"></div>
		</div>
		<p :class="$style.empty" v-if="!fetching && images.length == 0">%i18n:@no-photos%</p>
	</mk-widget-container>
</div>
</template>

<script lang="ts">
import define from '../../../common/define-widget';
export default define({
	name: 'photo-stream',
	props: () => ({
		design: 0
	})
}).extend({
	data() {
		return {
			images: [],
			fetching: true,
			connection: null,
			connectionId: null
		};
	},
	mounted() {
		this.connection = (this as any).os.stream.getConnection();
		this.connectionId = (this as any).os.stream.use();

		this.connection.on('drive_file_created', this.onDriveFileCreated);

		(this as any).api('drive/stream', {
			type: 'image/*',
			limit: 9
		}).then(images => {
			this.images = images;
			this.fetching = false;
		});
	},
	beforeDestroy() {
		this.connection.off('drive_file_created', this.onDriveFileCreated);
		(this as any).os.stream.dispose(this.connectionId);
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
		}
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
	display -webkit-flex
	display -moz-flex
	display -ms-flex
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
	color #aaa

	> [data-fa]
		margin-right 4px

</style>
