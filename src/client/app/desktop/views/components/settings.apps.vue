<template>
<div class="root">
	<div class="none ui info" v-if="!fetching && apps.length == 0">
		<p>%fa:info-circle%%i18n:@no-apps%</p>
	</div>
	<div class="apps" v-if="apps.length != 0">
		<div v-for="app in apps">
			<p><b>{{ app.name }}</b></p>
			<p>{{ app.description }}</p>
		</div>
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
		(this as any).api('i/authorized_apps').then(apps => {
			this.apps = apps;
			this.fetching = false;
		});
	}
});
</script>

<style lang="stylus" scoped>
.root
	> .apps
		> div
			padding 16px 0 0 0
			border-bottom solid 1px #eee
</style>
