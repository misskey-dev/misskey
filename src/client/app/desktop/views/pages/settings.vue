<template>
<mk-ui>
	<main>
		<x-settings :in-window="false"/>
	</main>
</mk-ui>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
	components: {
		XSettings: () => import('../components/settings.vue').then(m => m.default)
	},
	mounted() {
		document.title = this.$root.instanceName;
	},
});
</script>

<style lang="stylus" scoped>
main
	margin 0 auto
	max-width 900px

</style>
