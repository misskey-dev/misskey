<template>
<mk-ui>
	<template #header><fa icon="search"/> {{ q }}</template>

	<main>
		<mk-notes ref="timeline" :pagination="pagination" @inited="inited"/>
	</main>
</mk-ui>
</template>

<script lang="ts">
import Vue from 'vue';
import i18n from '../../../i18n';
import Progress from '../../../common/scripts/loading';
import { genSearchQuery } from '../../../common/scripts/gen-search-query';

export default Vue.extend({
	i18n: i18n('mobile/views/pages/search.vue'),
	data() {
		return {
			pagination: {
				endpoint: 'notes/search',
				limit: 20,
				params: () => genSearchQuery(this, this.q)
			}
		};
	},
	computed: {
		q(): string {
			return this.$route.query.q;
		}
	},
	watch: {
		$route() {
			this.$refs.timeline.reload();
		}
	},
	mounted() {
		document.title = `${this.$t('search')}: ${this.q} | ${this.$root.instanceName}`;
	},
	methods: {
		inited() {
			Progress.done();
		},
	}
});
</script>
