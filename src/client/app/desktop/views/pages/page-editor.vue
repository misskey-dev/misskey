<template>
<mk-ui>
	<main>
		<x-page-editor :page="page"/>
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
		page: {
			type: String,
			required: false
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
