<template>
<div>
	<portal to="icon"><fa :icon="faQuestionCircle"/></portal>
	<portal to="title">{{ $t('help') }}</portal>
	<main class="_card">
		<div class="_content">
		</div>
	</main>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import { faQuestionCircle } from '@fortawesome/free-solid-svg-icons'

export default Vue.extend({
	metaInfo() {
		return {
			title: this.$t('help') as string,
		};
	},

	data() {
		return {
			faQuestionCircle
		}
	},
});
</script>
