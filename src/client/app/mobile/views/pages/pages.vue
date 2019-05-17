<template>
<mk-ui>
	<template #header><span style="margin-right:4px;"><fa :icon="faStickyNote"/></span>{{ $t('@.pages') }}</template>

	<main>
		<x-pages v-bind="$attrs"/>
	</main>
</mk-ui>
</template>


<script lang="ts">
import Vue from 'vue';
import i18n from '../../../i18n';
import { faHashtag } from '@fortawesome/free-solid-svg-icons';
import XPages from '../../../common/views/pages/pages.vue';

export default Vue.extend({
	i18n: i18n(''),
	components: {
		XPages
	},
	data() {
		return {
			faHashtag
		};
	},
});
</script>
