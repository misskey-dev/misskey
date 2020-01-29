<template>
<div class="xcukqgmh _panel">
	<portal to="avatar" v-if="page"><mk-avatar class="avatar" :user="page.user" :disable-preview="true"/></portal>
	<portal to="title" v-if="page">{{ page.title || page.name }}</portal>

	<x-page v-if="page" :page="page" :key="page.id" :show-footer="true"/>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import XPage from '../components/page/page.vue';

export default Vue.extend({
	components: {
		XPage
	},

	props: {
		pageName: {
			type: String,
			required: true
		},
		username: {
			type: String,
			required: true
		},
	},

	data() {
		return {
			page: null,
		};
	},

	computed: {
		path(): string {
			return this.username + '/' + this.pageName;
		}
	},

	watch: {
		path() {
			this.fetch();
		}
	},

	created() {
		this.fetch();
	},

	methods: {
		fetch() {
			this.$root.api('pages/show', {
				name: this.pageName,
				username: this.username,
			}).then(page => {
				this.page = page;
			});
		},
	}
});
</script>

<style lang="scss" scoped>
.xcukqgmh {

}
</style>
