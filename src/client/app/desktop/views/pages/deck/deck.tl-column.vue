<template>
<div>
	<x-column :id="column.id">
		<span slot="header">
			<template v-if="column.type == 'home'">%fa:home%%i18n:@home%</template>
			<template v-if="column.type == 'local'">%fa:R comments%%i18n:@local%</template>
			<template v-if="column.type == 'global'">%fa:globe%%i18n:@global%</template>
			<template v-if="column.type == 'list'">%fa:list%{{ column.list.title }}</template>
		</span>

		<x-list-tl v-if="column.type == 'list'" :list="column.list"/>
		<x-tl v-else :src="column.type"/>
	</x-column>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import XColumn from './deck.column.vue';
import XTl from './deck.tl.vue';
import XListTl from './deck.list-tl.vue';

export default Vue.extend({
	components: {
		XColumn,
		XTl,
		XListTl
	},

	props: {
		column: {
			type: Object,
			required: true
		}
	}
});
</script>
