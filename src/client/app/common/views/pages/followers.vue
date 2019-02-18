<template>
<div>
	<mk-user-list :make-promise="makePromise">{{ $t('@.followers') }}</mk-user-list>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import parseAcct from '../../../../../misc/acct/parse';
import i18n from '../../../i18n';

export default Vue.extend({
	i18n: i18n(''),

	data() {
		return {
			makePromise: cursor => this.$root.api('users/followers', {
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
