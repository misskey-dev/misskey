<template>
<div class="mjndxjcg _panel">
	<p><fa :icon="faExclamationTriangle"/> {{ $t('error') }}</p>
	<mk-button @click="() => $emit('retry')" class="button">{{ $t('retry') }}</mk-button>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import { faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';
import i18n from '../i18n';
import MkButton from './ui/button.vue';

export default Vue.extend({
	i18n,
	components: {
		MkButton,
	},
	data() {
		return {
			faExclamationTriangle
		};
	},
});
</script>

<style lang="scss" scoped>
.mjndxjcg {
	max-width: 350px;
	margin: 0 auto;
	padding: 32px;
	text-align: center;

	> p {
		margin: 0 0 8px 0;
	}

	> .button {
		margin: 0 auto;
	}
}
</style>
