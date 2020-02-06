<template>
<div class="">
	<portal to="icon"><fa :icon="faExclamationTriangle"/></portal>
	<portal to="title">{{ $t('notFound') }}</portal>

	<section class="_card">
		<div class="_title"><fa :icon="faExclamationTriangle"/> {{ $t('notFound') }}</div>
		<div class="_content">{{ $t('notFoundDescription') }}</div>
	</section>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import { faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';
import i18n from '../i18n';

export default Vue.extend({
	i18n,

	metaInfo() {
		return {
			title: this.$t('notFound') as string
		};
	},

	data() {
		return {
			faExclamationTriangle
		}
	},
});
</script>

<style lang="scss" scoped>
</style>
