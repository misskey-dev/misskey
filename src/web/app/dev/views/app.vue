<template>
<div>
	<p v-if="fetching">読み込み中</p>
	<main v-if="!fetching">
		<header>
			<h1>{{ app.name }}</h1>
		</header>
		<div class="body">
			<p>App Secret</p>
			<input :value="app.secret" readonly/>
		</div>
	</main>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
export default Vue.extend({
	data() {
		return {
			fetching: true,
			app: null
		};
	},
	watch: {
		$route: 'fetch'
	},
	mounted() {
		this.fetch();
	},
	methods: {
		fetch() {
			this.fetching = true;
			(this as any).api('app/show', {
				app_id: this.$route.params.id
			}).then(app => {
				this.app = app;
				this.fetching = false;
			});
		}
	}
});
</script>
