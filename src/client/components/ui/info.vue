<template>
<div class="ymxyweixqwsxauxldgpvecjepnwxbylu" :class="{ warn }">
	<i v-if="warn"><fa icon="exclamation-triangle"/></i>
	<i v-else><fa icon="info-circle"/></i>
	<slot></slot>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
export default Vue.extend({
	props: {
		warn: {
			type: Boolean,
			required: false,
			default: false
		},
	},
});
</script>

<style lang="scss" scoped>
.ymxyweixqwsxauxldgpvecjepnwxbylu
	margin 16px 0
	padding 16px
	font-size 90%
	background var(--infoBg)
	color var(--infoFg)

	&.warn
		background var(--infoWarnBg)
		color var(--infoWarnFg)

	&:first-child
		margin-top 0

	&:last-child
		margin-bottom 0

	> i
		margin-right 4px

</style>
