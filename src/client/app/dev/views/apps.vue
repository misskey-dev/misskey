<template>
<mk-ui>
	<b-card header="%i18n:@manage-apps%">
		<b-button to="/app/new" variant="primary">%i18n:@create-app%</b-button>
		<hr>
		<div class="apps">
			<p v-if="fetching">%i18n:common.loading%</p>
			<template v-if="!fetching">
				<b-alert v-if="apps.length == 0">%i18n:@app-missing%</b-alert>
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
export default Vue.extend({
	data() {
		return {
			fetching: true,
			apps: []
		};
	},
	mounted() {
		(this as any).api('my/apps').then(apps => {
			this.apps = apps;
			this.fetching = false;
		});
	}
});
</script>
