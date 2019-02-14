<template>
<button class="wfliddvnhxvyusikowhxozkyxyenqxqr"
	:class="{ wait, block, inline, mini, active: isFollowing || hasPendingFollowRequestFromYou }"
	@click="onClick"
	:disabled="wait"
	:inline="inline"
>
	<template v-if="!wait">
		<fa :icon="iconAndText[0]"/> <template v-if="!mini">{{ iconAndText[1] }}</template>
	</template>
	<template v-else><fa icon="spinner" pulse fixed-width/></template>
</button>
</template>

<script lang="ts">
import Vue from 'vue';
import i18n from '../../../i18n';

export default Vue.extend({
	i18n: i18n('common/views/components/follow-button.vue'),

	props: {
		user: {
			type: Object,
			required: true
		},
		block: {
			type: Boolean,
			required: false,
			default: false
		},
		inline: {
			type: Boolean,
			required: false,
			default: false
		},
		mini: {
			type: Boolean,
			required: false,
			default: false
		}
	},

	data() {
		return {
			isFollowing: this.user.isFollowing,
			hasPendingFollowRequestFromYou: this.user.hasPendingFollowRequestFromYou,
			wait: false,
			connection: null
		};
	},

	computed: {
		iconAndText(): any[] {
			return (
				(this.hasPendingFollowRequestFromYou && this.user.isLocked) ? ['hourglass-half', this.$t('request-pending')] :
				(this.hasPendingFollowRequestFromYou && !this.user.isLocked) ? ['spinner', this.$t('follow-processing')] :
				(this.isFollowing) ? ['minus', this.$t('following')] :
				(!this.isFollowing && this.user.isLocked) ? ['plus', this.$t('follow-request')] :
				(!this.isFollowing && !this.user.isLocked) ? ['plus', this.$t('follow')] :
				[]
			);
		}
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
			if (user.id == this.user.id) {
				this.isFollowing = user.isFollowing;
				this.hasPendingFollowRequestFromYou = user.hasPendingFollowRequestFromYou;
			}
		},

		async onClick() {
			this.wait = true;

			try {
				if (this.isFollowing) {
					await this.$root.api('following/delete', {
						userId: this.user.id
					});
				} else {
					if (this.hasPendingFollowRequestFromYou) {
						await this.$root.api('following/requests/cancel', {
							userId: this.user.id
						});
					} else if (this.user.isLocked) {
						await this.$root.api('following/create', {
							userId: this.user.id
						});
						this.hasPendingFollowRequestFromYou = true;
					} else {
						await this.$root.api('following/create', {
							userId: this.user.id
						});
						this.hasPendingFollowRequestFromYou = true;
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
.wfliddvnhxvyusikowhxozkyxyenqxqr
	display block
	user-select none
	cursor pointer
	padding 0 16px
	margin 0
	min-width 100px
	line-height 36px
	font-size 14px
	font-weight bold
	color var(--primary)
	background transparent
	outline none
	border solid 1px var(--primary)
	border-radius 36px

	&.inline
		display inline-block

	&.mini
		padding 0
		min-width 0
		width 32px
		height 32px
		font-size 16px
		border-radius 4px
		line-height 32px

		&:focus
			&:after
				border-radius 8px

	&.block
		width 100%

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
			border-radius 36px

	&:hover
		background var(--primaryAlpha01)

	&:active
		background var(--primaryAlpha02)

	&.active
		color var(--primaryForeground)
		background var(--primary)

		&:hover
			background var(--primaryLighten10)
			border-color var(--primaryLighten10)

		&:active
			background var(--primaryDarken10)
			border-color var(--primaryDarken10)

	&.wait
		cursor wait !important
		opacity 0.7

	*
		pointer-events none

</style>
