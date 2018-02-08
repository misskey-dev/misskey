<mk-photo-stream-home-widget data-melt={ data.design == 2 }>
	<template v-if="data.design == 0">
		<p class="title">%fa:camera%%i18n:desktop.tags.mk-photo-stream-home-widget.title%</p>
	</template>
	<p class="initializing" v-if="initializing">%fa:spinner .pulse .fw%%i18n:common.loading%<mk-ellipsis/></p>
	<div class="stream" v-if="!initializing && images.length > 0">
		<template each={ image in images }>
			<div class="img" style={ 'background-image: url(' + image.url + '?thumbnail&size=256)' }></div>
		</template>
	</div>
	<p class="empty" v-if="!initializing && images.length == 0">%i18n:desktop.tags.mk-photo-stream-home-widget.no-photos%</p>
	<style lang="stylus" scoped>
		:scope
			display block
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

			> .initializing
			> .empty
				margin 0
				padding 16px
				text-align center
				color #aaa

				> [data-fa]
					margin-right 4px

	</style>
	<script lang="typescript">
		this.data = {
			design: 0
		};

		this.mixin('widget');

		this.mixin('stream');
		this.connection = this.stream.getConnection();
		this.connectionId = this.stream.use();

		this.images = [];
		this.initializing = true;

		this.on('mount', () => {
			this.connection.on('drive_file_created', this.onStreamDriveFileCreated);

			this.api('drive/stream', {
				type: 'image/*',
				limit: 9
			}).then(images => {
				this.update({
					initializing: false,
					images: images
				});
			});
		});

		this.on('unmount', () => {
			this.connection.off('drive_file_created', this.onStreamDriveFileCreated);
			this.stream.dispose(this.connectionId);
		});

		this.onStreamDriveFileCreated = file => {
			if (/^image\/.+$/.test(file.type)) {
				this.images.unshift(file);
				if (this.images.length > 9) this.images.pop();
				this.update();
			}
		};

		this.func = () => {
			if (++this.data.design == 3) this.data.design = 0;
			this.save();
		};
	</script>
</mk-photo-stream-home-widget>
