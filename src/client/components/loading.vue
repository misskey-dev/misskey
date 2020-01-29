<template>
<div class="yxspomdl">
	<fa :icon="faSpinner" pulse fixed-width class="icon"/>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import { faSpinner } from '@fortawesome/free-solid-svg-icons';

export default Vue.extend({
	data() {
		return {
			faSpinner
		};
	},
});
</script>

<style lang="scss" scoped>
.yxspomdl {
	padding: 32px;
	text-align: center;

	> .icon {
		font-size: 32px;
		opacity: 0.5;
	}
}
</style>
