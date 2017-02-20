<mk-photo-stream-home-widget>
	<p class="title"><i class="fa fa-camera"></i>フォトストリーム</p>
	<p class="initializing" if={ initializing }><i class="fa fa-spinner fa-pulse fa-fw"></i>読み込んでいます
		<mk-ellipsis></mk-ellipsis>
	</p>
	<div class="stream" if={ !initializing && images.length > 0 }>
		<virtual each={ image in images }>
			<div class="img" style={ 'background-image: url(' + image.url + '?thumbnail&size=256)' }></div>
		</virtual>
	</div>
	<p class="empty" if={ !initializing && images.length == 0 }>写真はありません</p>
	<style>
		:scope
			display block
			background #fff

			> .title
				z-index 1
				margin 0
				padding 0 16px
				line-height 42px
				font-size 0.9em
				font-weight bold
				color #888
				box-shadow 0 1px rgba(0, 0, 0, 0.07)

				> i
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
					background-clip content-box
					border solid 2px transparent

			> .initializing
			> .empty
				margin 0
				padding 16px
				text-align center
				color #aaa

				> i
					margin-right 4px

	</style>
	<script>
		this.mixin('api');
		this.mixin('stream');

		this.images = []
		this.initializing = true

		this.on('mount', () => {
			this.stream.on 'drive_file_created' this.on-stream-drive-file-created

			this.api 'drive/stream' do
				type: 'image/*'
				limit: 9images
			.then (images) =>
				this.initializing = false
				this.images = images
				this.update();

		this.on('unmount', () => {
			this.stream.off 'drive_file_created' this.on-stream-drive-file-created

		this.on-stream-drive-file-created = (file) => {
			if /^image\/.+$/.test file.type
				@images.unshift file
				if @images.length > 9
					@images.pop!
				this.update();
	</script>
</mk-photo-stream-home-widget>
