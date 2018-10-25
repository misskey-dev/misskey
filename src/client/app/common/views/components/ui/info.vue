<template>
<div class="ymxyweixqwsxauxldgpvecjepnwxbylu" :class="{ warn }">
	<i v-if="warn">%fa:exclamation-triangle%</i>
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

<style lang="stylus" scoped>
.ymxyweixqwsxauxldgpvecjepnwxbylu
	margin 16px 0
	padding 16px
	font-size 90%

	> i
		margin-right 4px

	&.warn
		background var(--infoWarnBg)
		color var(--infoWarnFg)
</style>
