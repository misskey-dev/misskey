<template>
<div>
	<ui-card>
		<template #title><fa :icon="faDatabase"/> {{ $t('tables') }}</template>
		<section v-if="tables">
			<div v-for="table in Object.keys(tables)"><b>{{ table }}</b> {{ tables[table].count | number }} {{ tables[table].size | bytes }}</div>
		</section>
		<section>
			<header><fa :icon="faBroom"/> {{ $t('vacuum') }}</header>
			<ui-info>{{ $t('vacuum-info') }}</ui-info>
			<ui-switch v-model="fullVacuum">FULL</ui-switch>
			<ui-switch v-model="analyzeVacuum">ANALYZE</ui-switch>
			<ui-button @click="vacuum()"><fa :icon="faBroom"/> {{ $t('vacuum') }}</ui-button>
			<ui-info warn>{{ $t('vacuum-exclamation') }}</ui-info>
		</section>
	</ui-card>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import i18n from '../../i18n';
import { faDatabase, faBroom } from '@fortawesome/free-solid-svg-icons';

export default Vue.extend({
	i18n: i18n('admin/views/db.vue'),

	data() {
		return {
			tables: null,
			fullVacuum: true,
			analyzeVacuum: true,
			faDatabase, faBroom
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

		vacuum() {
			this.$root.api('admin/vacuum', {
				full: this.fullVacuum,
				analyze: this.analyzeVacuum,
			}).then(() => {
				this.$root.dialog({
					type: 'success',
					splash: true
				});
			});
		},
	}
});
</script>
