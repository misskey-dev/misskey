<template>
<div class="lnctpgve">
	<x-integrations :user="user" v-if="user.twitter || user.github || user.discord"/>
	<mk-note-detail v-for="n in user.pinnedNotes" :key="n.id" :note="n" :compact="true"/>
	<!--<mk-calendar @chosen="warp" :start="new Date(user.createdAt)"/>-->
	<div class="activity">
		<ui-container :body-togglable="true">
			<template slot="header"><fa icon="chart-bar"/>{{ $t('activity') }}</template>
			<x-activity :user="user" :limit="35" style="padding: 16px;"/>
		</ui-container>
	</div>
	<x-photos :user="user"/>
	<x-friends :user="user"/>
	<x-followers-you-know v-if="$store.getters.isSignedIn && $store.state.i.id != user.id" :user="user"/>
	<x-timeline class="timeline" ref="tl" :user="user"/>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import i18n from '../../../../i18n';
import parseAcct from '../../../../../../misc/acct/parse';
import Progress from '../../../../common/scripts/loading';
import XTimeline from './user.timeline.vue';
import XPhotos from './user.photos.vue';
import XFollowersYouKnow from './user.followers-you-know.vue';
import XFriends from './user.friends.vue';
import XIntegrations from './user.integrations.vue';
import XActivity from '../../../../common/views/components/activity.vue';

export default Vue.extend({
	i18n: i18n(),
	components: {
		XTimeline,
		XPhotos,
		XFollowersYouKnow,
		XFriends,
		XIntegrations,
		XActivity
	},
	props: {
		user: {
			type: Object,
			required: true
		}
	},
	methods: {
		warp(date) {
			(this.$refs.tl as any).warp(date);
		}
	}
});
</script>

<style lang="stylus" scoped>
.lnctpgve
	> *
		margin-bottom 16px

	> .timeline
		box-shadow var(--shadow)

</style>
