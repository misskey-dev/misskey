<template>
<mk-ui>
	<b-card header="アプリを管理">
		<b-button to="/app/new" variant="primary">アプリ作成</b-button>
		<hr>
		<div class="apps">
			<p v-if="fetching">読み込み中</p>
			<template v-if="!fetching">
				<b-alert v-if="apps.length == 0">アプリなし</b-alert>
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
