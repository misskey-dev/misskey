<template>
<button class="mk-follow-button"
	:class="{ wait, active: u.isFollowing || u.hasPendingFollowRequestFromYou, big: size == 'big' }"
	@click="onClick"
	:disabled="wait"
>
	<template v-if="!wait">
		<template v-if="u.hasPendingFollowRequestFromYou && u.isLocked"><fa icon="hourglass-half"/><template v-if="size == 'big'"> {{ $t('request-pending') }}</template></template>
		<template v-else-if="u.hasPendingFollowRequestFromYou && !u.isLocked"><fa icon="hourglass-start"/><template v-if="size == 'big'"> {{ $t('follow-processing') }}</template></template>
		<template v-else-if="u.isFollowing"><fa icon="minus"/><template v-if="size == 'big'"> {{ $t('following') }}</template></template>
		<template v-else-if="!u.isFollowing && u.isLocked"><fa icon="plus"/><template v-if="size == 'big'"> {{ $t('follow-request') }}</template></template>
		<template v-else-if="!u.isFollowing && !u.isLocked"><fa icon="plus"/><template v-if="size == 'big'"> {{ $t('follow') }}</template></template>
	</template>
	<template v-else><fa icon="spinner .pulse" fixed-width/></template>
</button>
</template>

<script lang="ts">
import Vue from 'vue';
import i18n from '../../../i18n';

export default Vue.extend({
	i18n: i18n('desktop/views/components/follow-button.vue'),
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
		this.connection = this.$root.stream.useSharedConnection('main');
		this.connection.on('follow', this.onFollowChange);
		this.connection.on('unfollow', this.onFollowChange);
	},

	beforeDestroy() {
		this.connection.dispose();
	},

	methods: {
		onFollowChange(user) {
			if (user.id == this.u.id) {
				this.u.isFollowing = user.isFollowing;
				this.u.hasPendingFollowRequestFromYou = user.hasPendingFollowRequestFromYou;
				this.$forceUpdate();
			}
		},

		async onClick() {
			this.wait = true;

			try {
				if (this.u.isFollowing) {
					this.u = await this.$root.api('following/delete', {
						userId: this.u.id
					});
				} else {
					if (this.u.hasPendingFollowRequestFromYou) {
						this.u = await this.$root.api('following/requests/cancel', {
							userId: this.u.id
						});
					} else if (this.u.isLocked) {
						this.u = await this.$root.api('following/create', {
							userId: this.u.id
						});
					} else {
						this.u = await this.$root.api('following/create', {
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
