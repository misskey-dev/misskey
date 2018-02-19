<template>
<div class="info">
	<p>Maintainer: <b>{{ meta.maintainer }}</b></p>
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

<style lang="info" scoped>
.uptimes
	padding 10px 14px

	> p
		margin 0
		font-size 12px
		color #505050
</style>
