<template>
<div class="mkw-photo-stream" :data-melt="props.design == 2">
	<p class="title" v-if="props.design == 0">%fa:camera%%i18n:desktop.tags.mk-photo-stream-home-widget.title%</p>
	<p class="fetching" v-if="fetching">%fa:spinner .pulse .fw%%i18n:common.loading%<mk-ellipsis/></p>
	<div class="stream" v-if="!fetching && images.length > 0">
		<div v-for="image in images" :key="image.id" class="img" :style="`background-image: url(${image.url}?thumbnail&size=256)`"></div>
	</div>
	<p class="empty" v-if="!fetching && images.length == 0">%i18n:desktop.tags.mk-photo-stream-home-widget.no-photos%</p>
</div>
</template>

<script lang="ts">
import define from '../../../define-widget';
export default define({
	name: 'photo-stream',
	props: {
		design: 0
	}
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
		this.connection = this.$root.$data.os.stream.getConnection();
		this.connectionId = this.$root.$data.os.stream.use();

		this.connection.on('drive_file_created', this.onDriveFileCreated);

		this.$root.$data.os.api('drive/stream', {
			type: 'image/*',
			limit: 9
		}).then(images => {
			this.fetching = false;
			this.images = images;
		});
	},
	beforeDestroy() {
		this.connection.off('drive_file_created', this.onDriveFileCreated);
		this.$root.$data.os.stream.dispose(this.connectionId);
	},
	methods: {
		onStreamDriveFileCreated(file) {
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

<style lang="stylus" scoped>
.mkw-photo-stream
	background #fff
	border solid 1px rgba(0, 0, 0, 0.075)
	border-radius 6px

	&[data-melt]
		background transparent !important
		border none !important

		> .stream
			padding 0

			> .img
				border solid 4px transparent
				border-radius 8px

	> .title
		z-index 1
		margin 0
		padding 0 16px
		line-height 42px
		font-size 0.9em
		font-weight bold
		color #888
		box-shadow 0 1px rgba(0, 0, 0, 0.07)

		> [data-fa]
			margin-right 4px

	> .stream
		display -webkit-flex
		display -moz-flex
		display -ms-flex
		display flex
		justify-content center
		flex-wrap wrap
		padding 8px

		> .img
			flex 1 1 33%
			width 33%
			height 80px
			background-position center center
			background-size cover
			border solid 2px transparent
			border-radius 4px

	> .fetching
	> .empty
		margin 0
		padding 16px
		text-align center
		color #aaa

		> [data-fa]
			margin-right 4px

</style>
