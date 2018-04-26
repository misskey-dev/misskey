<template>
<button class="mk-follow-button"
	:class="{ wait, follow: !user.isFollowing, unfollow: user.isFollowing, big: size == 'big' }"
	@click="onClick"
	:disabled="wait"
	:title="user.isFollowing ? 'フォロー解除' : 'フォローする'"
>
	<template v-if="!wait && user.isFollowing">
		<template v-if="size == 'compact'">%fa:minus%</template>
		<template v-if="size == 'big'">%fa:minus%フォロー解除</template>
	</template>
	<template v-if="!wait && !user.isFollowing">
		<template v-if="size == 'compact'">%fa:plus%</template>
		<template v-if="size == 'big'">%fa:plus%フォロー</template>
	</template>
	<template v-if="wait">%fa:spinner .pulse .fw%</template>
</button>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
	props: {
		user: {
			type: Object,
			required: true
		},
		size: {
			type: String,
			default: 'compact'
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
				this.user.isFollowing = user.isFollowing;
			}
		},

		onUnfollow(user) {
			if (user.id == this.user.id) {
				this.user.isFollowing = user.isFollowing;
			}
		},

		onClick() {
			this.wait = true;
			if (this.user.isFollowing) {
				(this as any).api('following/delete', {
					userId: this.user.id
				}).then(() => {
					this.user.isFollowing = false;
				}).catch(err => {
					console.error(err);
				}).then(() => {
					this.wait = false;
				});
			} else {
				(this as any).api('following/create', {
					userId: this.user.id
				}).then(() => {
					this.user.isFollowing = true;
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

root(isDark)
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
		color isDark ? #fff : #888
		background isDark ? linear-gradient(to bottom, #313543 0%, #282c37 100%) : linear-gradient(to bottom, #ffffff 0%, #f5f5f5 100%)
		border solid 1px isDark ? #1c2023 : #e2e2e2

		&:hover
			background isDark ? linear-gradient(to bottom, #2c2f3c 0%, #22262f 100%) : linear-gradient(to bottom, #f9f9f9 0%, #ececec 100%)
			border-color isDark ? #151a1d : #dcdcdc

		&:active
			background isDark ? #22262f : #ececec
			border-color isDark ? #151a1d : #dcdcdc

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

	&.big
		width 100%
		height 38px
		line-height 38px

		i
			margin-right 8px

.mk-follow-button[data-darkmode]
	root(true)

.mk-follow-button:not([data-darkmode])
	root(false)

</style>
