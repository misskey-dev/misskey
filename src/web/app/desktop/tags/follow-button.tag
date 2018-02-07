<mk-follow-button>
	<button class={ wait: wait, follow: !user.is_following, unfollow: user.is_following } v-if="!init" @click="onclick" disabled={ wait } title={ user.is_following ? 'フォロー解除' : 'フォローする' }>
		<virtual v-if="!wait && user.is_following">%fa:minus%</virtual>
		<virtual v-if="!wait && !user.is_following">%fa:plus%</virtual>
		<virtual v-if="wait">%fa:spinner .pulse .fw%</virtual>
	</button>
	<div class="init" v-if="init">%fa:spinner .pulse .fw%</div>
	<style lang="stylus" scoped>
		:scope
			display block

			> button
			> .init
				display block
				cursor pointer
				padding 0
				margin 0
				width 32px
				height 32px
				font-size 1em
				outline none
				border-radius 4px

				*
					pointer-events none

				&:focus
					&:after
						content ""
						pointer-events none
						position absolute
						top -5px
						right -5px
						bottom -5px
						left -5px
						border 2px solid rgba($theme-color, 0.3)
						border-radius 8px

				&.follow
					color #888
					background linear-gradient(to bottom, #ffffff 0%, #f5f5f5 100%)
					border solid 1px #e2e2e2

					&:hover
						background linear-gradient(to bottom, #f9f9f9 0%, #ececec 100%)
						border-color #dcdcdc

					&:active
						background #ececec
						border-color #dcdcdc

				&.unfollow
					color $theme-color-foreground
					background linear-gradient(to bottom, lighten($theme-color, 25%) 0%, lighten($theme-color, 10%) 100%)
					border solid 1px lighten($theme-color, 15%)

					&:not(:disabled)
						font-weight bold

					&:hover:not(:disabled)
						background linear-gradient(to bottom, lighten($theme-color, 8%) 0%, darken($theme-color, 8%) 100%)
						border-color $theme-color

					&:active:not(:disabled)
						background $theme-color
						border-color $theme-color

				&.wait
					cursor wait !important
					opacity 0.7

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
