<template>
<FormBase>
	<FormSuspense v-slot="{ result: database }" :p="databasePromiseFactory">
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
import FormSuspense from '@/components/debobigego/suspense.vue';
import FormKeyValueView from '@/components/debobigego/key-value-view.vue';
import FormLink from '@/components/debobigego/link.vue';
import FormBase from '@/components/debobigego/base.vue';
import FormGroup from '@/components/debobigego/group.vue';
import * as os from '@/os';
import * as symbols from '@/symbols';
import bytes from '@/filters/bytes';
import number from '@/filters/number';

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
				icon: 'fas fa-database',
				bg: 'var(--bg)',
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
