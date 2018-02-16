<template>
<mk-users-list
	:fetch="fetch"
	:count="user.following_count"
	:you-know-count="user.following_you_know_count"
>
	%i18n:mobile.tags.mk-user-following.no-users%
</mk-users-list>
</template>

<script lang="ts">
import Vue from 'vue';
export default Vue.extend({
	props: ['user'],
	methods: {
		fetch(iknow, limit, cursor, cb) {
			this.$root.$data.os.api('users/following', {
				user_id: this.user.id,
				iknow: iknow,
				limit: limit,
				cursor: cursor ? cursor : undefined
			}).then(cb);
		}
	}
});
</script>
