<template>
<mk-ui>
	<template #header><span style="margin-right:4px;"><fa :icon="['far', 'comments']"/></span>{{ $t('@.messaging') }}</template>
	<x-messaging @navigate="navigate" :header-top="48"/>
</mk-ui>
</template>

<script lang="ts">
import Vue from 'vue';
import i18n from '../../../i18n';
import getAcct from '../../../../../misc/acct/render';

export default Vue.extend({
	i18n: i18n(),
	components: {
		XMessaging: () => import('../../../common/views/components/messaging.vue').then(m => m.default)
	},
	mounted() {
		document.title = `${this.$root.instanceName} ${this.$t('@.messaging')}`;
	},
	methods: {
		navigate(user) {
			(this as any).$router.push(`/i/messaging/${getAcct(user)}`);
		}
	}
});
</script>
