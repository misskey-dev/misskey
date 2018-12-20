<template>
<div class="wjqjnyhzogztorhrdgcpqlkxhkmuetgj">
	<p><fa icon="exclamation-triangle"/> {{ $t('@.error.title') }}</p>
	<ui-button @click="() => $emit('retry')">{{ $t('@.error.retry') }}</ui-button>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import i18n from '../../../i18n';

export default Vue.extend({
	i18n: i18n()
});
</script>

<style lang="stylus" scoped>
.wjqjnyhzogztorhrdgcpqlkxhkmuetgj
	max-width 350px
	margin 0 auto
	padding 32px
	text-align center
	color var(--text)

	> p
		margin 0 0 8px 0

</style>
