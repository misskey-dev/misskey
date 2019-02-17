<template>
<div class="syxhndwprovvuqhmyvveewmbqayniwkv" v-if="!fetching">
	<div class="signed-in-as">
		<mfm :text="$t('signed-in-as').replace('{}', myName)" :should-break="false" :plain-text="true" :custom-emojis="$store.state.i.emojis"/>
	</div>
	<main>
		<div class="banner" :style="bannerStyle"></div>
		<mk-avatar class="avatar" :user="user" :disable-preview="true"/>
		<div class="body">
			<router-link :to="user | userPage" class="name">
				<mk-user-name :user="user"/>
			</router-link>
			<span class="username">@{{ user | acct }}</span>
			<div class="description">
				<mfm v-if="user.description" :text="user.description" :is-note="false" :author="user" :i="$store.state.i" :custom-emojis="user.emojis"/>
			</div>
		</div>
	</main>

	<button
			:class="{ wait: followWait, active: user.isFollowing || user.hasPendingFollowRequestFromYou }"
			@click="onClick"
			:disabled="followWait">
		<template v-if="!followWait">
			<template v-if="user.hasPendingFollowRequestFromYou && user.isLocked"><fa icon="hourglass-half"/> {{ $t('request-pending') }}</template>
			<template v-else-if="user.hasPendingFollowRequestFromYou && !user.isLocked"><fa icon="spinner"/> {{ $t('follow-processing') }}</template>
			<template v-else-if="user.isFollowing"><fa icon="minus"/> {{ $t('following') }}</template>
			<template v-else-if="!user.isFollowing && user.isLocked"><fa icon="plus"/> {{ $t('follow-request') }}</template>
			<template v-else-if="!user.isFollowing && !user.isLocked"><fa icon="plus"/> {{ $t('follow') }}</template>
		</template>
		<template v-else><fa icon="spinner" pulse fixed-width/></template>
	</button>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import i18n from '../../../i18n';
import parseAcct from '../../../../../misc/acct/parse';
import Progress from '../../../common/scripts/loading';

export default Vue.extend({
	i18n: i18n('common/views/pages/follow.vue'),
	data() {
		return {
			fetching: true,
			user: null,
			followWait: false
		};
	},

	computed: {
		myName(): string {
			return Vue.filter('userName')(this.$store.state.i);
		},

		bannerStyle(): any {
			if (this.user.bannerUrl == null) return {};
			return {
				backgroundColor: this.user.bannerColor && this.user.bannerColor.length == 3 ? `rgb(${ this.user.bannerColor.join(',') })` : null,
				backgroundImage: `url(${ this.user.bannerUrl })`
			};
		}
	},

	created() {
		this.fetch();
	},

	methods: {
		fetch() {
			const acct = new URL(location.href).searchParams.get('acct');
			this.fetching = true;
			Progress.start();
			this.$root.api('users/show', parseAcct(acct)).then(user => {
				this.user = user;
				this.fetching = false;
				Progress.done();
			});
		},

		async onClick() {
			this.followWait = true;

			try {
				if (this.user.isFollowing) {
					this.user = await this.$root.api('following/delete', {
						userId: this.user.id
					});
				} else {
					if (this.user.hasPendingFollowRequestFromYou) {
						this.user = await this.$root.api('following/requests/cancel', {
							userId: this.user.id
						});
					} else if (this.user.isLocked) {
						this.user = await this.$root.api('following/create', {
							userId: this.user.id
						});
					} else {
						this.user = await this.$root.api('following/create', {
							userId: this.user.id
						});
					}
				}
			} catch (e) {
				console.error(e);
			} finally {
				this.followWait = false;
			}
		}
	}
});
</script>

<style lang="stylus" scoped>
.syxhndwprovvuqhmyvveewmbqayniwkv
	padding 32px
	max-width 500px
	margin 0 auto
	text-align center
	color var(--text)

	$bg = var(--face)

	@media (max-width 400px)
		padding 16px

	> .signed-in-as
		margin-bottom 16px
		font-size 14px
		font-weight bold

	> main
		margin-bottom 16px
		background $bg
		border-radius 8px
		box-shadow 0 4px 12px rgba(#000, 0.1)
		overflow hidden

		> .banner
			height 128px
			background-position center
			background-size cover

		> .avatar
			display block
			margin -50px auto 0 auto
			width 100px
			height 100px
			border-radius 100%
			border solid 4px $bg

		> .body
			padding 4px 32px 32px 32px

			@media (max-width 400px)
				padding 4px 16px 16px 16px

			> .name
				font-size 20px
				font-weight bold

			> .username
				display block
				opacity 0.7

			> .description
				margin-top 16px

	> button
		display block
		user-select none
		cursor pointer
		padding 10px 16px
		margin 0
		width 100%
		min-width 150px
		font-size 14px
		font-weight bold
		color var(--primary)
		background transparent
		outline none
		border solid 1px var(--primary)
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
