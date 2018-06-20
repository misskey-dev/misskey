<template>
<mk-ui>
	<div class="zwwan0di1v4356rmdbjmwnn32tptpdp2" v-if="!fetching">
		<div class="main">
			<x-header :user="user"/>
			<mk-note-detail v-if="user.pinnedNote" :note="user.pinnedNote" :compact="true"/>
			<x-timeline class="timeline" ref="tl" :user="user"/>
		</div>
		<div class="side">
			<x-profile :user="user"/>
			<mk-calendar @chosen="warp" :start="new Date(user.createdAt)"/>
			<mk-activity :user="user"/>
			<x-photos :user="user"/>
			<x-friends :user="user"/>
			<x-followers-you-know v-if="$store.getters.isSignedIn && $store.state.i.id != user.id" :user="user"/>
			<div class="nav"><mk-nav/></div>
			<p v-if="user.host === null">%i18n:@last-used-at%: <b><mk-time :time="user.lastUsedAt"/></b></p>
		</div>
	</div>
</mk-ui>
</template>

<script lang="ts">
import Vue from 'vue';
import parseAcct from '../../../../../../acct/parse';
import getUserName from '../../../../../../renderers/get-user-name';
import Progress from '../../../../common/scripts/loading';
import XHeader from './user.header.vue';
import XTimeline from './user.timeline.vue';
import XProfile from './user.profile.vue';
import XPhotos from './user.photos.vue';
import XFollowersYouKnow from './user.followers-you-know.vue';
import XFriends from './user.friends.vue';

export default Vue.extend({
	components: {
		XHeader,
		XTimeline,
		XProfile,
		XPhotos,
		XFollowersYouKnow,
		XFriends
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
			(this as any).api('users/show', parseAcct(this.$route.params.user)).then(user => {
				this.user = user;
				this.fetching = false;
				Progress.done();
				document.title = getUserName(this.user) + ' | Misskey';
			});
		},

		warp(date) {
			(this.$refs.tl as any).warp(date);
		}
	}
});
</script>

<style lang="stylus" scoped>
.zwwan0di1v4356rmdbjmwnn32tptpdp2
	display flex
	justify-content center
	width 980px
	padding 16px
	margin 0 auto

	> .main
	> .side
		> *:not(:last-child)
			margin-bottom 16px

	> .main
		flex 1
		margin-right 16px

		> .timeline
			border 1px solid rgba(#000, 0.075)
			border-radius 6px

	> .side
		width 275px

		> p
			display block
			margin 0
			padding 0 12px
			text-align center
			font-size 0.8em
			color #aaa

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
