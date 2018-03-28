<template>
<div class="info">
	<p>Maintainer: <b><a :href="meta.maintainer.url" target="_blank">{{ meta.maintainer.name }}</a></b></p>
	<p>Machine: {{ meta.machine }}</p>
	<p>Node: {{ meta.node }}</p>
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
		color #505050
</style>
