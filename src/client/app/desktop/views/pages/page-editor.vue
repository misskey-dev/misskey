<template>
<mk-ui>
	<main>
		<x-page-editor v-if="page !== undefined" :page="page" :readonly="readonly"/>
	</main>
</mk-ui>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
	components: {
		XPageEditor: () => import('../../../common/views/components/page-editor/page-editor.vue').then(m => m.default)
	},

	props: {
		pageId: {
			type: String,
			required: false
		},
		pageName: {
			type: String,
			required: false
		},
		user: {
			type: String,
			required: false
		}
	},

	data() {
		return {
			page: undefined,
			readonly: false
		};
	},

	created() {
		if (this.pageId) {
			this.$root.api('pages/show', {
				pageId: this.pageId,
			}).then(page => {
				this.page = page;
			});
		} else if (this.pageName && this.user) {
			this.$root.api('pages/show', {
				name: this.pageName,
				username: this.user,
			}).then(page => {
				this.readonly = true;
				this.page = page;
			});
		} else {
			this.page = null;
		}
	}
});
</script>

<style lang="stylus" scoped>
main
	margin 0 auto
	padding 16px
	max-width 900px

</style>
