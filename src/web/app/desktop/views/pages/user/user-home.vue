<template>
<div class="mk-user-home">
	<div>
		<div ref="left">
			<mk-user-profile :user="user"/>
			<mk-user-photos :user="user"/>
			<mk-user-followers-you-know v-if="os.isSignedIn && os.i.id != user.id" :user="user"/>
			<p>%i18n:desktop.tags.mk-user.last-used-at%: <b><mk-time :time="user.last_used_at"/></b></p>
		</div>
	</div>
	<main>
		<mk-post-detail v-if="user.pinned_post" :post="user.pinned_post" compact/>
		<mk-user-timeline ref="tl" :user="user"/>
	</main>
	<div>
		<div ref="right">
			<mk-calendar @chosen="warp" :start="new Date(user.created_at)"/>
			<mk-activity :user="user"/>
			<mk-user-friends :user="user"/>
			<div class="nav"><mk-nav/></div>
		</div>
	</div>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import MkUserTimeline from './user-timeline.vue';
import MkUserProfile from './user-profile.vue';
import MkUserPhotos from './user-photos.vue';
import MkUserFollowersYouKnow from './user-followers-you-know.vue';
import MkUserFriends from './user-friends.vue';

export default Vue.extend({
	components: {
		'mk-user-timeline': MkUserTimeline,
		'mk-user-profile': MkUserProfile,
		'mk-user-photos': MkUserPhotos,
		'mk-user-followers-you-know': MkUserFollowersYouKnow,
		'mk-user-friends': MkUserFriends
	},
	props: ['user'],
	methods: {
		warp(date) {
			(this.$refs.tl as any).warp(date);
		}
	}
});
</script>

<style lang="stylus" scoped>
.mk-user-home
	display flex
	justify-content center
	margin 0 auto
	max-width 1200px

	> main
	> div > div
		> *:not(:last-child)
			margin-bottom 16px

	> main
		padding 16px
		width calc(100% - 275px * 2)

		> .mk-user-timeline
			border solid 1px rgba(0, 0, 0, 0.075)
			border-radius 6px

	> div
		width 275px
		margin 0

		&:first-child > div
			padding 16px 0 16px 16px

			> p
				display block
				margin 0
				padding 0 12px
				text-align center
				font-size 0.8em
				color #aaa

		&:last-child > div
			padding 16px 16px 16px 0

			> .nav
				padding 16px
				font-size 12px
				color #aaa
				background #fff
				border solid 1px rgba(0, 0, 0, 0.075)
				border-radius 6px

				a
					color #999

				i
					color #ccc

</style>
