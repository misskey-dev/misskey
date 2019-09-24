<template>
<span class="mk-frac"><span>{{ pad }}</span><span>{{ value }} / {{ total }}</span></span>
</template>

<script lang="ts">
import Vue from 'vue';
import i18n from '../../../i18n';

export default Vue.extend({
	i18n: i18n(),
	props: {
		value: {
			type: Number,
			required: true,
		},
		total: {
			type: Number,
			required: true,
		},
	},
	computed: {
		pad(this: {
			value: number;
			total: number;
			length(value: number): number;
		}) {
			return '0'.repeat(this.length(this.total) - this.length(this.value));
		},
	},
	methods: {
		length(value: number) {
			const string = value.toString();

			return string.includes('e') ? -~string.substr(string.indexOf('e')) : string.length;
		},
	},
});
</script>

<style lang="stylus" scoped>
.mk-frac
	-webkit-font-feature-settings 'tnum'
	-moz-font-feature-settings 'tnum'
	font-feature-settings 'tnum'
	font-variant-numeric tabular-nums

	> :first-child
		visibility hidden
</style>
