<template>
<mk-ui>
	<b-card :header="$t('manage-apps')">
		<b-button to="/app/new" variant="primary">{{ $t('create-app') }}</b-button>
		<hr>
		<div class="apps">
			<p v-if="fetching">{{ $t('@.loading') }}</p>
			<template v-if="!fetching">
				<b-alert v-if="apps.length == 0">{{ $t('app-missing') }}</b-alert>
				<b-list-group v-else>
					<b-list-group-item v-for="app in apps" :key="app.id" :to="`/app/${app.id}`">
						{{ app.name }}
					</b-list-group-item>
				</b-list-group>
			</template>
		</div>
	</b-card>
</mk-ui>
</template>

<script lang="ts">
import Vue from 'vue';
import i18n from '../../i18n';
export default Vue.extend({
	i18n: i18n('dev/views/apps.vue'),
	data() {
		return {
			fetching: true,
			apps: []
		};
	},
	mounted() {
		this.$root.api('my/apps').then(apps => {
			this.apps = apps;
			this.fetching = false;
		});
	}
});
</script>
