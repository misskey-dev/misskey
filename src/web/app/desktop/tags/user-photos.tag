<mk-user-photos>
	<p class="title"><i class="fa fa-camera"></i>フォト</p>
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
		this.mixin('is-promise');

		this.images = []
		this.initializing = true

		this.user = null
		this.user-promise = if @is-promise this.opts.user then this.opts.user else Promise.resolve this.opts.user

		this.on('mount', () => {
			@user-promise.then (user) =>
				this.user = user
				this.update();

				this.api 'users/posts' do
					user_id: @user.id
					with_media: true
					limit: 9posts
				.then (posts) =>
					this.initializing = false
					posts.forEach (post) =>
						post.media.forEach (image) =>
							if @images.length < 9
								@images.push image
					this.update();
	</script>
</mk-user-photos>
