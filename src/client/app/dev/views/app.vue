<template>
<mk-ui>
	<p v-if="fetching">{{ $t('@.loading') }}</p>
	<b-card v-if="!fetching" :header="app.name">
		<b-form-group label="App Secret">
			<b-input :value="app.secret" readonly/>
		</b-form-group>
	</b-card>
</mk-ui>
</template>

<script lang="ts">
import Vue from 'vue';
import i18n from '../../i18n';
export default Vue.extend({
	i18n: i18n(),
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
			this.$root.api('app/show', {
				appId: this.$route.params.id
			}).then(app => {
				this.app = app;
				this.fetching = false;
			});
		}
	}
});
</script>
