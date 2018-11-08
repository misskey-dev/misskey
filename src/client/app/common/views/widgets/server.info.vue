<template>
<div class="info">
	<p>Maintainer: <b><a :href="'mailto:' + meta.maintainer.email" target="_blank">{{ meta.maintainer.name }}</a></b></p>
	<p>Machine: {{ meta.machine }}</p>
	<p>Node: {{ meta.node }}</p>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import i18n from '../../../i18n';

export default Vue.extend({
	i18n: i18n('.vue'),
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
