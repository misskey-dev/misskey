<template>
<mk-ui>
	<template slot="header" v-if="!fetching">
		<img :src="`${user.avatarUrl}?thumbnail&size=64`" alt="">
		{{ '%i18n:@followers-of%'.replace('{}', name) }}
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
import Progress from '../../../common/scripts/loading';
import parseAcct from '../../../../../acct/parse';
import getUserName from '../../../../../renderers/get-user-name';

export default Vue.extend({
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
	mounted() {
		document.documentElement.style.background = '#313a42';
	},
	methods: {
		fetch() {
			Progress.start();
			this.fetching = true;

			(this as any).api('users/show', parseAcct(this.$route.params.user)).then(user => {
				this.user = user;
				this.fetching = false;

				document.title = '%i18n:@followers-of%'.replace('{}', this.name) + ' | Misskey';
			});
		},
		onLoaded() {
			Progress.done();
		},
		fetchUsers(iknow, limit, cursor, cb) {
			(this as any).api('users/followers', {
				userId: this.user.id,
				iknow: iknow,
				limit: limit,
				cursor: cursor ? cursor : undefined
			}).then(cb);
		}
	}
});
</script>
