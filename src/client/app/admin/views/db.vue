<template>
<div>
	<ui-card>
		<template #title><fa :icon="faDatabase"/> {{ $t('tables') }}</template>
		<section v-if="tables">
			<div v-for="table in Object.keys(tables)"><b>{{ table }}</b> {{ tables[table].count | number }} {{ tables[table].size | bytes }}</div>
		</section>
	</ui-card>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import i18n from '../../i18n';
import { faDatabase } from '@fortawesome/free-solid-svg-icons';

export default Vue.extend({
	i18n: i18n('admin/views/db.vue'),

	data() {
		return {
			tables: null,
			faDatabase
		};
	},

	mounted() {
		this.fetch();
	},

	methods: {
		fetch() {
			this.$root.api('admin/get-table-stats').then(tables => {
				this.tables = tables;
			});
		},
	}
});
</script>
