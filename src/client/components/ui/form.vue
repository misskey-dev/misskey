<template>
<div class="ui-form">
	<fieldset :disabled="disabled">
		<slot></slot>
	</fieldset>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
export default Vue.extend({
	props: {
		disabled: {
			type: Boolean,
			required: false
		}
	}
});
</script>

<style lang="scss" scoped>


.ui-form
	> fieldset
		margin 0
		padding 0
		border none

</style>
