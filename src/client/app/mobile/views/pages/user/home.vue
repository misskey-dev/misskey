<template>
<div class="wojmldye">
	<x-page class="page" v-if="user.pinnedPage" :page="user.pinnedPage" :key="user.pinnedPage.id" :show-title="!user.pinnedPage.hideTitleWhenPinned"/>
	<mk-note-detail class="note" v-for="n in user.pinnedNotes" :key="n.id" :note="n" :compact="true"/>
	<ui-container :body-togglable="true">
		<template #header><fa :icon="['far', 'comments']"/>{{ $t('recent-notes') }}</template>
		<div>
			<x-notes :user="user"/>
		</div>
	</ui-container>
	<ui-container :body-togglable="true">
		<template #header><fa icon="image"/>{{ $t('images') }}</template>
		<div>
			<x-photos :user="user"/>
		</div>
	</ui-container>
	<ui-container :body-togglable="true">
		<template #header><fa icon="chart-bar"/>{{ $t('activity') }}</template>
		<div style="padding:8px;">
			<x-activity :user="user"/>
		</div>
	</ui-container>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import i18n from '../../../../i18n';
import XNotes from './home.notes.vue';
import XPhotos from './home.photos.vue';

export default Vue.extend({
	i18n: i18n('mobile/views/pages/user/home.vue'),
	components: {
		XNotes,
		XPhotos,
		XPage: () => import('../../../../common/views/components/page/page.vue').then(m => m.default),
		XActivity: () => import('../../../../common/views/components/activity.vue').then(m => m.default)
	},
	props: ['user'],
	data() {
		return {
			makeFrequentlyRepliedUsersPromise: () => this.$root.api('users/get_frequently_replied_users', {
				userId: this.user.id
			}).then(res => res.map(x => x.user)),
			makeFollowersYouKnowPromise: () => this.$root.api('users/followers', {
				userId: this.user.id,
				iknow: true,
				limit: 30
			}).then(res => res.users),
		};
	}
});
</script>

<style lang="stylus" scoped>
.wojmldye
	> .page
		margin 0 0 8px 0

		@media (min-width 500px)
			margin 0 0 16px 0
	
	> .note
		margin 0 0 8px 0

		@media (min-width 500px)
			margin 0 0 16px 0

</style>
