<template>
<button class="mk-follow-button"
	:class="{ wait: wait, follow: !user.is_following, unfollow: user.is_following }"
	@click="onClick"
	:disabled="wait"
>
	<template v-if="!wait && user.is_following">%fa:minus%</template>
	<template v-if="!wait && !user.is_following">%fa:plus%</template>
	<template v-if="wait">%fa:spinner .pulse .fw%</template>
	{{ user.is_following ? '%i18n:mobile.tags.mk-follow-button.unfollow%' : '%i18n:mobile.tags.mk-follow-button.follow%' }}
</button>
</template>

<script lang="ts">
import Vue from 'vue';
export default Vue.extend({
	props: {
		user: {
			type: Object,
			required: true
		}
	},
	data() {
		return {
			wait: false,
			connection: null,
			connectionId: null
		};
	},
	mounted() {
		this.connection = (this as any).os.stream.getConnection();
		this.connectionId = (this as any).os.stream.use();

		this.connection.on('follow', this.onFollow);
		this.connection.on('unfollow', this.onUnfollow);
	},
	beforeDestroy() {
		this.connection.off('follow', this.onFollow);
		this.connection.off('unfollow', this.onUnfollow);
		(this as any).os.stream.dispose(this.connectionId);
	},
	methods: {

		onFollow(user) {
			if (user.id == this.user.id) {
				this.user.is_following = user.is_following;
			}
		},

		onUnfollow(user) {
			if (user.id == this.user.id) {
				this.user.is_following = user.is_following;
			}
		},

		onClick() {
			this.wait = true;
			if (this.user.is_following) {
				(this as any).api('following/delete', {
					user_id: this.user.id
				}).then(() => {
					this.user.is_following = false;
				}).catch(err => {
					console.error(err);
				}).then(() => {
					this.wait = false;
				});
			} else {
				(this as any).api('following/create', {
					user_id: this.user.id
				}).then(() => {
					this.user.is_following = true;
				}).catch(err => {
					console.error(err);
				}).then(() => {
					this.wait = false;
				});
			}
		}
	}
});
</script>

<style lang="stylus" scoped>
@import '~const.styl'

.mk-follow-button
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

	> [data-fa]
		margin-right 4px

</style>
