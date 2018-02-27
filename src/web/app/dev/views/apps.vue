<template>
<div>
	<h1>アプリを管理</h1>
	<router-link to="/app/new">アプリ作成</router-link>
	<div class="apps">
		<p v-if="fetching">読み込み中</p>
		<template v-if="!fetching">
			<p v-if="apps.length == 0">アプリなし</p>
			<ul v-else>
				<li v-for="app in apps" :key="app.id">
					<router-link :to="`/app/${app.id}`">
						<p class="name">{{ app.name }}</p>
					</router-link>
				</li>
			</ul>
		</template>
	</div>
</div>
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
