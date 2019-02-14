<template>
<div class="xygkxeaeontfaokvqmiblezmhvhostak" v-if="!fetching">
	<div class="is-suspended" v-if="user.isSuspended"><fa icon="exclamation-triangle"/> {{ $t('@.user-suspended') }}</div>
	<div class="is-remote" v-if="user.host != null"><fa icon="exclamation-triangle"/> {{ $t('@.is-remote-user') }}<a :href="user.url || user.uri" target="_blank">{{ $t('@.view-on-remote') }}</a></div>
	<div class="main">
		<x-header :user="user"/>
		<mk-note-detail v-for="n in user.pinnedNotes" :key="n.id" :note="n" :compact="true"/>
		<x-timeline class="timeline" ref="tl" :user="user"/>
		<div class="instance" v-if="!$store.getters.isSignedIn"><mk-instance/></div>
		<x-integrations :user="user"/>
		<!--<mk-calendar @chosen="warp" :start="new Date(user.createdAt)"/>-->
		<mk-activity :user="user"/>
		<x-photos :user="user"/>
		<x-friends :user="user"/>
		<x-followers-you-know v-if="$store.getters.isSignedIn && $store.state.i.id != user.id" :user="user"/>
	</div>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import i18n from '../../../../i18n';
import parseAcct from '../../../../../../misc/acct/parse';
import Progress from '../../../../common/scripts/loading';
import XHeader from './user.header.vue';
import XTimeline from './user.timeline.vue';
import XPhotos from './user.photos.vue';
import XFollowersYouKnow from './user.followers-you-know.vue';
import XFriends from './user.friends.vue';
import XIntegrations from './user.integrations.vue';

export default Vue.extend({
	i18n: i18n(),
	components: {
		XHeader,
		XTimeline,
		XPhotos,
		XFollowersYouKnow,
		XFriends,
		XIntegrations
	},
	data() {
		return {
			fetching: true,
			user: null
		};
	},
	watch: {
		$route: 'fetch'
	},
	created() {
		this.fetch();
	},
	methods: {
		fetch() {
			this.fetching = true;
			Progress.start();
			this.$root.api('users/show', parseAcct(this.$route.params.user)).then(user => {
				this.user = user;
				this.fetching = false;
				Progress.done();
			});
		},

		warp(date) {
			(this.$refs.tl as any).warp(date);
		}
	}
});
</script>

<style lang="stylus" scoped>
.xygkxeaeontfaokvqmiblezmhvhostak
	width 100%
	margin 0 auto

	> .is-suspended
	> .is-remote
		margin-bottom 16px
		padding 14px 16px
		font-size 14px
		box-shadow var(--shadow)
		border-radius var(--round)

		&.is-suspended
			color var(--suspendedInfoFg)
			background var(--suspendedInfoBg)

		&.is-remote
			color var(--remoteInfoFg)
			background var(--remoteInfoBg)

		> a
			font-weight bold

	> .main
		> *
			margin-bottom 16px

		> .timeline
			box-shadow var(--shadow)

</style>
