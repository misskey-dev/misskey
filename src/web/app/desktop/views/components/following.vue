<template>
<mk-users-list
	:fetch="fetch"
	:count="user.followingCount"
	:you-know-count="user.following_you_know_count"
>
	フォロー中のユーザーはいないようです。
</mk-users-list>
</template>

<script lang="ts">
import Vue from 'vue';
export default Vue.extend({
	props: ['user'],
	methods: {
		fetch(iknow, limit, cursor, cb) {
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
