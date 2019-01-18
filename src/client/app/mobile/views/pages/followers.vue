<template>
<mk-ui>
	<template slot="header" v-if="!fetching">
		<img :src="user.avatarUrl" alt="">
		<mfm :text="$t('followers-of', { name })" :should-break="false" :plain-text="true" :custom-emojis="user.emojis"/>
	</template>
	<mk-users-list
		v-if="!fetching"
		:fetch="fetchUsers"
		:count="user.followersCount"
		:you-know-count="user.followersYouKnowCount"
		@loaded="onLoaded"
	>
		%i18n:@no-users%
	</mk-users-list>
</mk-ui>
</template>

<script lang="ts">
import Vue from 'vue';
import i18n from '../../../i18n';
import Progress from '../../../common/scripts/loading';
import parseAcct from '../../../../../misc/acct/parse';
import getUserName from '../../../../../misc/get-user-name';

export default Vue.extend({
	i18n: i18n('mobile/views/pages/followers.vue'),
	data() {
		return {
			fetching: true,
			user: null
		};
	},
	computed: {
		name() {
			return getUserName(this.user);
		}
	},
	watch: {
		$route: 'fetch'
	},
	created() {
		this.fetch();
	},
	methods: {
		fetch() {
			Progress.start();
			this.fetching = true;

			this.$root.api('users/show', parseAcct(this.$route.params.user)).then(user => {
				this.user = user;
				this.fetching = false;

				document.title = `${this.$t('followers-of').replace('{}', this.name)} | ${this.$root.instanceName}`;
			});
		},
		onLoaded() {
			Progress.done();
		},
		fetchUsers(iknow, limit, cursor, cb) {
			this.$root.api('users/followers', {
				userId: this.user.id,
				iknow: iknow,
				limit: limit,
				cursor: cursor ? cursor : undefined
			}).then(cb);
		}
	}
});
</script>
