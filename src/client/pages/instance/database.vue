<template>
<FormBase>
	<FormSuspense :p="databasePromiseFactory" v-slot="{ result: database }">
		<FormGroup v-for="table in database" :key="table[0]">
			<template #label>{{ table[0] }}</template>
			<FormKeyValueView>
				<template #key>Size</template>
				<template #value>{{ bytes(table[1].size) }}</template>
			</FormKeyValueView>
			<FormKeyValueView>
				<template #key>Records</template>
				<template #value>{{ number(table[1].count) }}</template>
			</FormKeyValueView>
		</FormGroup>
	</FormSuspense>
</FormBase>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import FormSuspense from '@client/components/form/suspense.vue';
import FormKeyValueView from '@client/components/form/key-value-view.vue';
import FormLink from '@client/components/form/link.vue';
import FormBase from '@client/components/form/base.vue';
import FormGroup from '@client/components/form/group.vue';
import * as os from '@client/os';
import * as symbols from '@client/symbols';
import bytes from '@client/filters/bytes';
import number from '@client/filters/number';

export default defineComponent({
	components: {
		FormSuspense,
		FormKeyValueView,
		FormBase,
		FormGroup,
		FormLink,
	},

	emits: ['info'],

	data() {
		return {
			[symbols.PAGE_INFO]: {
				title: this.$ts.database,
				icon: 'fas fa-database'
			},
			databasePromiseFactory: () => os.api('admin/get-table-stats', {}).then(res => Object.entries(res).sort((a, b) => b[1].size - a[1].size)),
		}
	},

	mounted() {
		this.$emit('info', this[symbols.PAGE_INFO]);
	},

	methods: {
		bytes, number,
	}
});
</script>
