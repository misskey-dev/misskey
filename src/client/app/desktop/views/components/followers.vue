<template>
<mk-users-list
	:fetch="fetch"
	:count="user.followersCount"
	:you-know-count="user.followersYouKnowCount"
>
	%i18n:@empty%
</mk-users-list>
</template>

<script lang="ts">
import Vue from 'vue';
export default Vue.extend({
	props: ['user'],
	methods: {
		fetch(iknow, limit, cursor, cb) {
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
