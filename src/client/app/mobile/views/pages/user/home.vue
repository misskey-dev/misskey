<template>
<div class="root home">
	<mk-note-detail v-if="user.pinnedNote" :note="user.pinnedNote" :compact="true"/>
	<section class="recent-notes">
		<h2>%fa:R comments%%i18n:@recent-notes%</h2>
		<div>
			<x-notes :user="user"/>
		</div>
	</section>
	<section class="images">
		<h2>%fa:image%%i18n:@images%</h2>
		<div>
			<x-photos :user="user"/>
		</div>
	</section>
	<section class="activity">
		<h2>%fa:chart-bar%%i18n:@activity%</h2>
		<div>
			<mk-activity :user="user"/>
		</div>
	</section>
	<section class="frequently-replied-users">
		<h2>%fa:users%%i18n:@frequently-replied-users%</h2>
		<div>
			<x-friends :user="user"/>
		</div>
	</section>
	<section class="followers-you-know" v-if="os.isSignedIn && os.i.id !== user.id">
		<h2>%fa:users%%i18n:@followers-you-know%</h2>
		<div>
			<x-followers-you-know :user="user"/>
		</div>
	</section>
	<p v-if="user.host === null">%i18n:@last-used-at%: <b><mk-time :time="user.lastUsedAt"/></b></p>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import XNotes from './home.notes.vue';
import XPhotos from './home.photos.vue';
import XFriends from './home.friends.vue';
import XFollowersYouKnow from './home.followers-you-know.vue';

export default Vue.extend({
	components: {
		XNotes,
		XPhotos,
		XFriends,
		XFollowersYouKnow
	},
	props: ['user']
});
</script>

<style lang="stylus" scoped>
root(isDark)
	max-width 600px
	margin 0 auto

	> .mk-note-detail
		margin 0 0 8px 0

		@media (min-width 500px)
			margin 0 0 16px 0

	> section
		background isDark ? #21242f : #eee
		border-radius 8px
		box-shadow 0 4px 16px rgba(#000, 0.1)

		&:not(:last-child)
			margin-bottom 8px

			@media (min-width 500px)
				margin-bottom 16px

		> h2
			margin 0
			padding 8px 10px
			font-size 15px
			font-weight normal
			color isDark ? #b8c5cc : #465258
			background isDark ? #282c37 : #fff
			border-radius 8px 8px 0 0

			@media (min-width 500px)
				padding 10px 16px

			> i
				margin-right 6px

	> .activity
		> div
			padding 8px

	> p
		display block
		margin 16px
		text-align center
		color isDark ? #cad2da : #929aa0

.root.home[data-darkmode]
	root(true)

.root.home:not([data-darkmode])
	root(false)

</style>
