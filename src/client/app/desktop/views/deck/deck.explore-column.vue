<template>
<x-column>
	<span slot="header">
		<fa :icon="faHashtag"/>{{ $t('@.explore') }}
	</span>

	<div>
		<x-explore/>
	</div>
</x-column>
</template>

<script lang="ts">
import Vue from 'vue';
import i18n from '../../../i18n';
import XColumn from './deck.column.vue';
import XExplore from '../../../common/views/pages/explore.vue';
import { faHashtag } from '@fortawesome/free-solid-svg-icons';

export default Vue.extend({
	i18n: i18n(),

	components: {
		XColumn,
		XExplore,
	},

	data() {
		return {
			faHashtag
		};
	}
});
</script>
