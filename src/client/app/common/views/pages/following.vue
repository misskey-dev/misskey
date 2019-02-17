<template>
<div>
	<mk-user-list :make-promise="makePromise">{{ $t('@.following') }}</mk-user-list>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import parseAcct from '../../../../../misc/acct/parse';

export default Vue.extend({
	data() {
		return {
			makePromise: cursor => this.$root.api('users/following', {
				...parseAcct(this.$route.params.user),
				limit: 30,
				cursor: cursor ? cursor : undefined
			}).then(x => {
				return {
					users: x.users,
					cursor: x.next
				};
			}),
		};
	},
});
</script>
