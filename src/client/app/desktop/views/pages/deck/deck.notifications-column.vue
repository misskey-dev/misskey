<template>
<div>
	<x-column>
		<span slot="header">%fa:bell R% %i18n:@notifications%</span>

		<x-notifications/>
	</x-column>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import XColumn from './deck.column.vue';
import XNotifications from './deck.notifications.vue';

export default Vue.extend({
	components: {
		XColumn,
		XNotifications
	}
});
</script>
