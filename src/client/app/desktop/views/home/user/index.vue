<template>
<div class="omechnps" v-if="!fetching">
	<div class="is-suspended" v-if="user.isSuspended" :class="{ shadow: $store.state.device.useShadow, round: $store.state.device.roundedCorners }">
		<fa icon="exclamation-triangle"/> {{ $t('@.user-suspended') }}
	</div>
	<div class="is-remote" v-if="user.host != null" :class="{ shadow: $store.state.device.useShadow, round: $store.state.device.roundedCorners }">
		<fa icon="exclamation-triangle"/> {{ $t('@.is-remote-user') }}<a :href="user.url || user.uri" target="_blank">{{ $t('@.view-on-remote') }}</a>
	</div>
	<div class="main">
		<x-header class="header" :user="user"/>
		<router-view :user="user"></router-view>
	</div>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import i18n from '../../../../i18n';
import parseAcct from '../../../../../../misc/acct/parse';
import Progress from '../../../../common/scripts/loading';
import XHeader from './user.header.vue';

export default Vue.extend({
	i18n: i18n(),
	components: {
		XHeader
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
.omechnps
	width 100%
	margin 0 auto

	> .is-suspended
	> .is-remote
		margin-bottom 16px
		padding 14px 16px
		font-size 14px

		&.round
			border-radius 6px

		&.shadow
			box-shadow 0 3px 8px rgba(0, 0, 0, 0.2)

		&.is-suspended
			color var(--suspendedInfoFg)
			background var(--suspendedInfoBg)

		&.is-remote
			color var(--remoteInfoFg)
			background var(--remoteInfoBg)

		> a
			font-weight bold

	> .main
		> .header
			margin-bottom 16px

</style>
