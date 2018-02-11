<template>
	<mk-ui>
		<mk-home ref="home" :mode="mode"/>
	</mk-ui>
</template>

<script lang="ts">
import Vue from 'vue';
export default Vue.extend({
	props: {
		mode: {
			type: String,
			default: 'timeline'
		}
	},
});
</script>
