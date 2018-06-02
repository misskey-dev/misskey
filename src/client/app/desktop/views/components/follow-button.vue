<template>
<button class="mk-follow-button"
	:class="{ wait, active: u.isFollowing || u.hasPendingFollowRequestFromYou, big: size == 'big' }"
	@click="onClick"
	:disabled="wait"
>
	<template v-if="!wait">
		<template v-if="u.hasPendingFollowRequestFromYou">%fa:hourglass-half%<template v-if="size == 'big'"> %i18n:@request-pending%</template></template>
		<template v-else-if="u.isFollowing">%fa:minus%<template v-if="size == 'big'"> %i18n:@unfollow%</template></template>
		<template v-else-if="!u.isFollowing && u.isLocked">%fa:plus%<template v-if="size == 'big'"> %i18n:@follow-request%</template></template>
		<template v-else-if="!u.isFollowing && !u.isLocked">%fa:plus%<template v-if="size == 'big'"> %i18n:@follow%</template></template>
	</template>
	<template v-else>%fa:spinner .pulse .fw%</template>
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
			u: this.user,
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
			if (user.id == this.u.id) {
				this.user.isFollowing = user.isFollowing;
			}
		},

		onUnfollow(user) {
			if (user.id == this.u.id) {
				this.user.isFollowing = user.isFollowing;
			}
		},

		async onClick() {
			this.wait = true;

			try {
				if (this.u.isFollowing) {
					this.u = await (this as any).api('following/delete', {
						userId: this.u.id
					});
				} else {
					if (this.u.isLocked && this.u.hasPendingFollowRequestFromYou) {
						this.u = await (this as any).api('following/requests/cancel', {
							userId: this.u.id
						});
					} else if (this.u.isLocked) {
						this.u = await (this as any).api('following/create', {
							userId: this.u.id
						});
					} else {
						this.u = await (this as any).api('following/create', {
							userId: this.user.id
						});
					}
				}
			} catch (e) {
				console.error(e);
			} finally {
				this.wait = false;
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

	&:not(.active)
		color isDark ? #fff : #888
		background isDark ? linear-gradient(to bottom, #313543 0%, #282c37 100%) : linear-gradient(to bottom, #ffffff 0%, #f5f5f5 100%)
		border solid 1px isDark ? #1c2023 : #e2e2e2

		&:hover
			background isDark ? linear-gradient(to bottom, #2c2f3c 0%, #22262f 100%) : linear-gradient(to bottom, #f9f9f9 0%, #ececec 100%)
			border-color isDark ? #151a1d : #dcdcdc

		&:active
			background isDark ? #22262f : #ececec
			border-color isDark ? #151a1d : #dcdcdc

	&.active
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

.mk-follow-button[data-darkmode]
	root(true)

.mk-follow-button:not([data-darkmode])
	root(false)

</style>
