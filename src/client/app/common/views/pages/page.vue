<template>
<x-page v-if="page" :page="page" :key="page.id" :show-footer="true"/>
</template>

<script lang="ts">
import Vue from 'vue';
import { faStickyNote } from '@fortawesome/free-regular-svg-icons';
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
				this.$emit('init', {
					title: this.page.title,
					icon: faStickyNote
				});
			});
		},
	}
});
</script>
