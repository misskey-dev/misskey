<template>
<mk-ui>
	<span slot="header"><span style="margin-right:4px;">%fa:R comments%</span>%i18n:@messaging%</span>
	<mk-messaging @navigate="navigate" :header-top="48"/>
</mk-ui>
</template>

<script lang="ts">
import Vue from 'vue';
import getAcct from '../../../../../misc/acct/render';

export default Vue.extend({
	mounted() {
		document.title = `${(this as any).os.instanceName} %i18n:@messaging%`;
	},
	methods: {
		navigate(user) {
			(this as any).$router.push(`/i/messaging/${getAcct(user)}`);
		}
	}
});
</script>
