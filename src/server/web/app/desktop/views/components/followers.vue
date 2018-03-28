<template>
<mk-users-list
	:fetch="fetch"
	:count="user.followers_count"
	:you-know-count="user.followers_you_know_count"
>
	フォロワーはいないようです。
</mk-users-list>
</template>

<script lang="ts">
import Vue from 'vue';
export default Vue.extend({
	props: ['user'],
	methods: {
		fetch(iknow, limit, cursor, cb) {
			(this as any).api('users/followers', {
				user_id: this.user.id,
				iknow: iknow,
				limit: limit,
				cursor: cursor ? cursor : undefined
			}).then(cb);
		}
	}
});
</script>
