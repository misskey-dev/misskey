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
		this.mixin('i');
		this.mixin('api');
		this.mixin('stream');

		const stream = this.stream.event;

		const isPromise = require('../../common/scripts/is-promise');

		this.user = null;
		this.userPromise = isPromise(this.opts.user)
			? this.opts.user
			: Promise.resolve(this.opts.user);
		this.init = true;
		this.wait = false;

		this.on('mount', () => {
			this.userPromise.then(user => {
				this.update({
					init: false,
					user: user
				});
				stream.on('follow', this.onStreamFollow);
				stream.on('unfollow', this.onStreamUnfollow);
			});
		});

		this.on('unmount', () => {
			stream.off('follow', this.onStreamFollow);
			stream.off('unfollow', this.onStreamUnfollow);
		});

		this.onStreamFollow = user => {
			if (user.id == this.user.id) {
				this.update({
					user: user
				});
			}
		};

		this.onStreamUnfollow = user => {
			if (user.id == this.user.id) {
				this.update({
					user: user
				});
			}
		};

		this.onclick = () => {
			this.wait = true;
			if (this.user.is_following) {
				this.api('following/delete', {
					user_id: this.user.id
				}).then(() => {
					this.user.is_following = false;
				}).catch(err => {
					console.error(err);
				}).then(() => {
					this.wait = false;
					this.update();
				});
			} else {
				this.api('following/create', {
					user_id: this.user.id
				}).then(() => {
					this.user.is_following = true;
				}).catch(err => {
					console.error(err);
				}).then(() => {
					this.wait = false;
					this.update();
				});
			}
		};
	</script>
</mk-follow-button>
