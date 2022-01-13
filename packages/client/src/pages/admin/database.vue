<template>
<MkSpacer :content-max="800" :margin-min="16" :margin-max="32">
	<FormSuspense v-slot="{ result: database }" :p="databasePromiseFactory">
		<MkKeyValue v-for="table in database" :key="table[0]" oneline style="margin: 1em 0;">
			<template #key>{{ table[0] }}</template>
			<template #value>{{ bytes(table[1].size) }} ({{ number(table[1].count) }} recs)</template>
		</MkKeyValue>
	</FormSuspense>
</MkSpacer>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import FormSuspense from '@/components/form/suspense.vue';
import MkKeyValue from '@/components/key-value.vue';
import * as os from '@/os';
import * as symbols from '@/symbols';
import bytes from '@/filters/bytes';
import number from '@/filters/number';

export default defineComponent({
	components: {
		FormSuspense,
		MkKeyValue,
	},

	emits: ['info'],

	data() {
		return {
			[symbols.PAGE_INFO]: {
				title: this.$ts.database,
				icon: 'fas fa-database',
				bg: 'var(--bg)',
			},
			databasePromiseFactory: () => os.api('admin/get-table-stats', {}).then(res => Object.entries(res).sort((a, b) => b[1].size - a[1].size)),
		}
	},

	methods: {
		bytes, number,
	}
});
</script>
