<mk-follow-button>
	<button class={ wait: wait, follow: !user.is_following, unfollow: user.is_following } if={ !init } onclick={ onclick } disabled={ wait }><i class="fa fa-minus" if={ !wait && user.is_following }></i><i class="fa fa-plus" if={ !wait && !user.is_following }></i><i class="fa fa-spinner fa-pulse fa-fw" if={ wait }></i>{ user.is_following ? 'フォロー解除' : 'フォロー' }</button>
	<div class="init" if={ init }><i class="fa fa-spinner fa-pulse fa-fw"></i></div>
	<style>
		:scope
			display block

			> button
			> .init
				display block
				user-select none
				cursor pointer
				padding 0 16px
				margin 0
				height inherit
				font-size 16px
				outline none
				border solid 1px $theme-color
				border-radius 4px

				*
					pointer-events none

				&.follow
					color $theme-color
					background transparent

					&:hover
						background rgba($theme-color, 0.1)

					&:active
						background rgba($theme-color, 0.2)

				&.unfollow
					color $theme-color-foreground
					background $theme-color

				&.wait
					cursor wait !important
					opacity 0.7

				&.init
					cursor wait !important
					opacity 0.7

				> i
					margin-right 4px

	</style>
	<script>
		this.mixin('api');
		this.mixin('is-promise');
		this.mixin('stream');

		this.user = null
		this.user-promise = if @is-promise this.opts.user then this.opts.user else Promise.resolve this.opts.user
		this.init = true
		this.wait = false

		this.on('mount', () => {
			this.user-promise.then (user) =>
				this.user = user
				this.init = false
				this.update();
				this.stream.on 'follow' this.on-stream-follow
				this.stream.on 'unfollow' this.on-stream-unfollow

		this.on('unmount', () => {
			this.stream.off 'follow' this.on-stream-follow
			this.stream.off 'unfollow' this.on-stream-unfollow

		this.on-stream-follow = (user) => {
			if user.id == this.user.id
				this.user = user
				this.update();

		this.on-stream-unfollow = (user) => {
			if user.id == this.user.id
				this.user = user
				this.update();

		this.onclick = () => {
			this.wait = true
			if this.user.is_following
				this.api 'following/delete' do
					user_id: this.user.id
				.then =>
					this.user.is_following = false
				.catch (err) ->
					console.error err
				.then =>
					this.wait = false
					this.update();
			else
				this.api 'following/create' do
					user_id: this.user.id
				.then =>
					this.user.is_following = true
				.catch (err) ->
					console.error err
				.then =>
					this.wait = false
					this.update();
	</script>
</mk-follow-button>
