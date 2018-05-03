<template>
<mk-ui>
	<template slot="header" v-if="!fetching">
		<img :src="`${user.avatarUrl}?thumbnail&size=64`" alt="">
		{{ '%i18n:!@following-of%'.replace('{}', name) }}
	</template>
	<mk-users-list
		v-if="!fetching"
		:fetch="fetchUsers"
		:count="user.followingCount"
		:you-know-count="user.followingYouKnowCount"
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

export default Vue.extend({
	data() {
		return {
			fetching: true,
			user: null
		};
	},
	computed: {
		name(): string {
			return Vue.filter('userName')(this.user);
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

			(this as any).api('users/show', parseAcct(this.$route.params.user)).then(user => {
				this.user = user;
				this.fetching = false;

				document.title = '%i18n:!@followers-of%'.replace('{}', this.name) + ' | Misskey';
			});
		},
		onLoaded() {
			Progress.done();
		},
		fetchUsers(iknow, limit, cursor, cb) {
			(this as any).api('users/following', {
				userId: this.user.id,
				iknow: iknow,
				limit: limit,
				cursor: cursor ? cursor : undefined
			}).then(cb);
		}
	}
});
</script>
