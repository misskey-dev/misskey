<template>
<mk-ui>
	<template #header><span style="margin-right:4px;"><fa :icon="faHashtag"/></span>{{ $t('@.explore') }}</template>

	<main>
		<x-explore v-bind="$attrs"/>
	</main>
</mk-ui>
</template>

<script lang="ts">
import Vue from 'vue';
import i18n from '../../../i18n';
import { faHashtag } from '@fortawesome/free-solid-svg-icons';
import XExplore from '../../../common/views/pages/explore.vue';

export default Vue.extend({
	i18n: i18n(''),
	components: {
		XExplore
	},
	data() {
		return {
			faHashtag
		};
	},
});
</script>
