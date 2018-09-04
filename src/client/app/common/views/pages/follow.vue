<template>
<div class="syxhndwprovvuqhmyvveewmbqayniwkv" v-if="!fetching" :data-darkmode="$store.state.device.darkmode">
	<div class="signed-in-as" v-html="'%i18n:@signed-in-as%'.replace('{}', `<b>${myName}`)"></div>

	<main>
		<div class="banner" :style="bannerStyle"></div>
		<mk-avatar class="avatar" :user="user" :disable-preview="true"/>
		<div class="body">
			<router-link :to="user | userPage" class="name">{{ user | userName }}</router-link>
			<span class="username">@{{ user | acct }}</span>
			<div class="description">
				<misskey-flavored-markdown v-if="user.description" :text="user.description" :i="$store.state.i"/>
			</div>
		</div>
	</main>

	<button
			:class="{ wait: followWait, active: user.isFollowing || user.hasPendingFollowRequestFromYou }"
			@click="onClick"
			:disabled="followWait">
		<template v-if="!followWait">
			<template v-if="user.hasPendingFollowRequestFromYou">%fa:hourglass-half% %i18n:@request-pending%</template>
			<template v-else-if="user.isFollowing">%fa:minus% %i18n:@following%</template>
			<template v-else-if="!user.isFollowing && user.isLocked">%fa:plus% %i18n:@follow-request%</template>
			<template v-else-if="!user.isFollowing && !user.isLocked">%fa:plus% %i18n:@follow%</template>
		</template>
		<template v-else>%fa:spinner .pulse .fw%</template>
	</button>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import parseAcct from '../../../../../misc/acct/parse';
import getUserName from '../../../../../misc/get-user-name';
import Progress from '../../../common/scripts/loading';

export default Vue.extend({
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
			(this as any).api('users/show', parseAcct(acct)).then(user => {
				this.user = user;
				this.fetching = false;
				Progress.done();
			});
		},

		async onClick() {
			this.followWait = true;

			try {
				if (this.user.isFollowing) {
					this.user = await (this as any).api('following/delete', {
						userId: this.user.id
					});
				} else {
					if (this.user.hasPendingFollowRequestFromYou) {
						this.user = await (this as any).api('following/requests/cancel', {
							userId: this.user.id
						});
					} else if (this.user.isLocked) {
						this.user = await (this as any).api('following/create', {
							userId: this.user.id
						});
					} else {
						this.user = await (this as any).api('following/create', {
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
@import '~const.styl'

root(isDark)
	padding 32px
	max-width 500px
	margin 0 auto
	text-align center
	color isDark ? #9baec8 : #868c8c

	$bg = isDark ? #282C37 : #fff

	@media (max-width 400px)
		padding 16px

	> .signed-in-as
		margin-bottom 16px
		font-size 14px
		color isDark ? #9baec8 : #9daab3

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
		color $theme-color
		background transparent
		outline none
		border solid 1px $theme-color
		border-radius 36px

		&:hover
			background rgba($theme-color, 0.1)

		&:active
			background rgba($theme-color, 0.2)

		&.active
			color $theme-color-foreground
			background $theme-color

			&:hover
				background lighten($theme-color, 10%)
				border-color lighten($theme-color, 10%)

			&:active
				background darken($theme-color, 10%)
				border-color darken($theme-color, 10%)

		&.wait
			cursor wait !important
			opacity 0.7

		*
			pointer-events none

.syxhndwprovvuqhmyvveewmbqayniwkv[data-darkmode]
	root(true)

.syxhndwprovvuqhmyvveewmbqayniwkv:not([data-darkmode])
	root(false)

</style>
