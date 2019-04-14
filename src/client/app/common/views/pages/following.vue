<template>
<div>
	<mk-user-list :make-promise="makePromise">{{ $t('@.following') }}</mk-user-list>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import parseAcct from '../../../../../misc/acct/parse';
import i18n from '../../../i18n';

const fetchLimit = 30;

export default Vue.extend({
	i18n: i18n(),

	data() {
		return {
			makePromise: cursor => this.$root.api('users/following', {
				...parseAcct(this.$route.params.user),
				limit: fetchLimit + 1,
				untilId: cursor ? cursor : undefined,
			}).then(followings => {
				if (followings.length == fetchLimit + 1) {
					followings.pop();
					return {
						users: followings.map(following => following.followee),
						cursor: followings[followings.length - 1].id
					};
				} else {
					return {
						users: followings.map(following => following.followee),
						more: false
					};
				}
			}),
		};
	},
});
</script>
