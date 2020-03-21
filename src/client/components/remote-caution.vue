<template>
<div class="jmgmzlwq _panel"><fa :icon="faExclamationTriangle" style="margin-right: 8px;"/>{{ $t('remoteUserCaution') }}<a :href="href" rel="nofollow noopener" target="_blank">{{ $t('showOnRemote') }}</a></div>
</template>

<script lang="ts">
import Vue from 'vue';
import { faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';
import i18n from '../i18n';

export default Vue.extend({
	i18n,
	props: {
		href: {
			type: String,
			required: true
		},
	},
	data() {
		return {
			faExclamationTriangle
		};
	}
});
</script>

<style lang="scss" scoped>
.jmgmzlwq {
	font-size: 0.8em;
	padding: 16px;

	> a {
		margin-left: 4px;
		color: var(--accent);
	}
}
</style>
