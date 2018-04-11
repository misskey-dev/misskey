<template>
<div class="root home">
	<mk-note-detail v-if="user.pinnedNote" :note="user.pinnedNote" :compact="true"/>
	<section class="recent-notes">
		<h2>%fa:R comments%%i18n:mobile.tags.mk-user-overview.recent-notes%</h2>
		<div>
			<x-notes :user="user"/>
		</div>
	</section>
	<section class="images">
		<h2>%fa:image%%i18n:mobile.tags.mk-user-overview.images%</h2>
		<div>
			<x-photos :user="user"/>
		</div>
	</section>
	<section class="activity">
		<h2>%fa:chart-bar%%i18n:mobile.tags.mk-user-overview.activity%</h2>
		<div>
			<mk-activity :user="user"/>
		</div>
	</section>
	<section class="frequently-replied-users">
		<h2>%fa:users%%i18n:mobile.tags.mk-user-overview.frequently-replied-users%</h2>
		<div>
			<x-friends :user="user"/>
		</div>
	</section>
	<section class="followers-you-know" v-if="os.isSignedIn && os.i.id !== user.id">
		<h2>%fa:users%%i18n:mobile.tags.mk-user-overview.followers-you-know%</h2>
		<div>
			<x-followers-you-know :user="user"/>
		</div>
	</section>
	<p v-if="user.host === null">%i18n:mobile.tags.mk-user-overview.last-used-at%: <b><mk-time :time="user.lastUsedAt"/></b></p>
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
.root.home
	max-width 600px
	margin 0 auto

	> .mk-note-detail
		margin 0 0 8px 0

	> section
		background #eee
		border-radius 8px
		box-shadow 0 0 0 1px rgba(0, 0, 0, 0.2)

		&:not(:last-child)
			margin-bottom 8px

		> h2
			margin 0
			padding 8px 10px
			font-size 15px
			font-weight normal
			color #465258
			background #fff
			border-radius 8px 8px 0 0

			> i
				margin-right 6px

	> .activity
		> div
			padding 8px

	> p
		display block
		margin 16px
		text-align center
		color #cad2da

</style>
