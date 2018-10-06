<template>
<button class="mk-follow-button"
	:class="{ wait, active: u.isFollowing || u.hasPendingFollowRequestFromYou, big: size == 'big' }"
	@click="onClick"
	:disabled="wait"
>
	<template v-if="!wait">
		<template v-if="u.hasPendingFollowRequestFromYou && u.isLocked">%fa:hourglass-half%<template v-if="size == 'big'"> %i18n:@request-pending%</template></template>
		<template v-else-if="u.hasPendingFollowRequestFromYou && !u.isLocked">%fa:hourglass-start%<template v-if="size == 'big'"> %i18n:@follow-processing%</template></template>
		<template v-else-if="u.isFollowing">%fa:minus%<template v-if="size == 'big'"> %i18n:@following%</template></template>
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
			connection: null
		};
	},

	mounted() {
		this.connection = (this as any).os.stream.useSharedConnection('main');
		this.connection.on('follow', this.onFollow);
		this.connection.on('unfollow', this.onUnfollow);
	},

	beforeDestroy() {
		this.connection.dispose();
	},

	methods: {
		onFollow(user) {
			if (user.id == this.u.id) {
				this.u.isFollowing = user.isFollowing;
				this.u.hasPendingFollowRequestFromYou = user.hasPendingFollowRequestFromYou;
			}
		},

		onUnfollow(user) {
			if (user.id == this.u.id) {
				this.u.isFollowing = user.isFollowing;
				this.u.hasPendingFollowRequestFromYou = user.hasPendingFollowRequestFromYou;
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
					if (this.u.hasPendingFollowRequestFromYou) {
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
.mk-follow-button
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
			border 2px solid var(--primaryAlpha03)
			border-radius 8px

	&:not(.active)
		color var(--primary)
		border solid 1px var(--primary)

		&:hover
			background var(--primaryAlpha03)

		&:active
			background var(--primaryAlpha05)

	&.active
		color var(--primaryForeground)
		background var(--primary)
		border solid 1px var(--primary)

		&:not(:disabled)
			font-weight bold

		&:hover:not(:disabled)
			background var(--primaryLighten5)
			border-color var(--primaryLighten5)

		&:active:not(:disabled)
			background var(--primaryDarken5)
			border-color var(--primaryDarken5)

	&.wait
		cursor wait !important
		opacity 0.7

	&.big
		width 100%
		height 38px
		line-height 38px

</style>
