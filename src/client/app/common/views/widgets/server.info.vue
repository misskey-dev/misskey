<template>
<div class="info">
	<p>Maintainer: <b><a :href="'mailto:' + meta.maintainerEmail" target="_blank">{{ meta.maintainerName }}</a></b></p>
	<p>Version: {{ meta.version }} </p>
</div>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
	props: ['meta']
});
</script>

<style lang="stylus" scoped>
.info
	padding 10px 14px

	> p
		margin 0
		font-size 12px
		color var(--text)
</style>
