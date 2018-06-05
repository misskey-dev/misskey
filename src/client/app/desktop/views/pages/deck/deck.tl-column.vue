<template>
<div>
	<x-column>
		<span slot="header">
			<template v-if="src == 'home'">%fa:home% %i18n:@home%</template>
			<template v-if="src == 'local'">%fa:R comments% %i18n:@local%</template>
			<template v-if="src == 'global'">%fa:globe% %i18n:@global%</template>
			<template v-if="src == 'list'">%fa:list% {{ list.title }}</template>
		</span>
		<x-tl :src="src"/>
	</x-column>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import XColumn from './deck.column.vue';
import XTl from './deck.tl.vue';

export default Vue.extend({
	components: {
		XColumn,
		XTl
	},

	props: {
		src: {
			type: String,
			required: false
		}
	},
});
</script>
