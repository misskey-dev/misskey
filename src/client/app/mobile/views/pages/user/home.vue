<template>
<div class="root home">
	<mk-note-detail v-for="n in user.pinnedNotes" :key="n.id" :note="n" :compact="true"/>
	<section class="recent-notes">
		<h2><fa :icon="['far', 'comments']"/>{{ $t('recent-notes') }}</h2>
		<div>
			<x-notes :user="user"/>
		</div>
	</section>
	<section class="images">
		<h2><fa icon="image"/>{{ $t('images') }}</h2>
		<div>
			<x-photos :user="user"/>
		</div>
	</section>
	<section class="activity">
		<h2><fa icon="chart-bar"/>{{ $t('activity') }}</h2>
		<div>
			<x-activity :user="user"/>
		</div>
	</section>
	<section class="frequently-replied-users">
		<h2><fa icon="users"/>{{ $t('frequently-replied-users') }}</h2>
		<div>
			<x-friends :user="user"/>
		</div>
	</section>
	<section class="followers-you-know" v-if="$store.getters.isSignedIn && $store.state.i.id !== user.id">
		<h2><fa icon="users"/>{{ $t('followers-you-know') }}</h2>
		<div>
			<x-followers-you-know :user="user"/>
		</div>
	</section>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import i18n from '../../../../i18n';
import XNotes from './home.notes.vue';
import XPhotos from './home.photos.vue';
import XFriends from './home.friends.vue';
import XFollowersYouKnow from './home.followers-you-know.vue';

export default Vue.extend({
	i18n: i18n('mobile/views/pages/user/home.vue'),
	components: {
		XNotes,
		XPhotos,
		XFriends,
		XFollowersYouKnow,
		XActivity: () => import('../../../../common/views/components/activity.vue').then(m => m.default)
	},
	props: ['user']
});
</script>

<style lang="stylus" scoped>
.root.home
	margin 0 auto

	> .mk-note-detail
		margin 0 0 8px 0

		@media (min-width 500px)
			margin 0 0 16px 0

	> section
		background var(--face)
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
			color var(--text)
			background var(--faceHeader)
			border-radius 8px 8px 0 0

			@media (min-width 500px)
				padding 10px 16px

			> [data-icon]
				margin-right 6px

	> .activity
		> div
			padding 8px

	> p
		display block
		margin 16px
		text-align center
		color var(--text)

</style>
