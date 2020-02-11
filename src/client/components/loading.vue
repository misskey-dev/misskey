<template>
<div class="yxspomdl">
	<div class="ring"></div>
</div>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
});
</script>

<style lang="scss" scoped>
@keyframes ring {
	0% {
		transform: rotate(0deg);
	}
	100% {
		transform: rotate(360deg);
	}
}

.yxspomdl {
	padding: 32px;
	text-align: center;

	> .ring {
		display: inline-block;
		opacity: 0.7;
		vertical-align: middle;
	}

	> .ring:after {
		content: " ";
		display: block;
		box-sizing: border-box;
		width: 48px;
		height: 48px;
		border-radius: 50%;
		border: solid 4px;
		border-color: currentColor transparent transparent transparent;
		animation: ring 0.5s linear infinite;
	}
}
</style>
