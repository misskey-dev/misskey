<template>
<mk-ui>
	<main>
		<x-page :page-name="page" :username="user"/>
	</main>
</mk-ui>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
	components: {
		XPage: () => import('../../../common/views/pages/page/page.vue').then(m => m.default)
	},

	props: {
		page: {
			type: String,
			required: true
		},
		user: {
			type: String,
			required: true
		},
	}
});
</script>

<style lang="stylus" scoped>
main
	margin 0 auto
	padding 16px
	max-width 950px

</style>
