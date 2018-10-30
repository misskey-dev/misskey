<template>
<div class="wjqjnyhzogztorhrdgcpqlkxhkmuetgj">
	<p>%fa:exclamation-triangle% %i18n:common.error.title%</p>
	<ui-button @click="() => $emit('retry')">%i18n:common.error.retry%</ui-button>
</div>
</template>

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
