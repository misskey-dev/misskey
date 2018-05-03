<template>
<div class="home">
	<div>
		<div ref="left">
			<x-profile :user="user"/>
			<x-photos :user="user"/>
			<x-followers-you-know v-if="os.isSignedIn && os.i.id != user.id" :user="user"/>
			<p v-if="user.host === null">%i18n:@last-used-at%: <b><mk-time :time="user.lastUsedAt"/></b></p>
		</div>
	</div>
	<main>
		<mk-note-detail v-if="user.pinnedNote" :note="user.pinnedNote" :compact="true"/>
		<x-timeline class="timeline" ref="tl" :user="user"/>
	</main>
	<div>
		<div ref="right">
			<mk-calendar @chosen="warp" :start="new Date(user.createdAt)"/>
			<mk-activity :user="user"/>
			<x-friends :user="user"/>
			<div class="nav"><mk-nav/></div>
		</div>
	</div>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import XTimeline from './user.timeline.vue';
import XProfile from './user.profile.vue';
import XPhotos from './user.photos.vue';
import XFollowersYouKnow from './user.followers-you-know.vue';
import XFriends from './user.friends.vue';

export default Vue.extend({
	components: {
		XTimeline,
		XProfile,
		XPhotos,
		XFollowersYouKnow,
		XFriends
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
.home
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

		> .timeline
			border solid 1px rgba(#000, 0.075)
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
				border solid 1px rgba(#000, 0.075)
				border-radius 6px

				a
					color #999

				i
					color #ccc

</style>
