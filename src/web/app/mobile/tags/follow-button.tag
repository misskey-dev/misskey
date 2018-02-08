<mk-follow-button>
	<button :class="{ wait: wait, follow: !user.is_following, unfollow: user.is_following }" v-if="!init" @click="onclick" disabled={ wait }>
		<virtual v-if="!wait && user.is_following">%fa:minus%</virtual>
		<virtual v-if="!wait && !user.is_following">%fa:plus%</virtual>
		<virtual v-if="wait">%fa:spinner .pulse .fw%</virtual>{ user.is_following ? '%i18n:mobile.tags.mk-follow-button.unfollow%' : '%i18n:mobile.tags.mk-follow-button.follow%' }
	</button>
	<div class="init" v-if="init">%fa:spinner .pulse .fw%</div>
	<style lang="stylus" scoped>
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

				> [data-fa]
					margin-right 4px

	</style>
	<script lang="typescript">
		import isPromise from '../../common/scripts/is-promise';

		this.mixin('i');
		this.mixin('api');

		this.mixin('stream');
		this.connection = this.stream.getConnection();
		this.connectionId = this.stream.use();

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
				this.connection.on('follow', this.onStreamFollow);
				this.connection.on('unfollow', this.onStreamUnfollow);
			});
		});

		this.on('unmount', () => {
			this.connection.off('follow', this.onStreamFollow);
			this.connection.off('unfollow', this.onStreamUnfollow);
			this.stream.dispose(this.connectionId);
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
