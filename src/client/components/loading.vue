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
		width: 80px;
		height: 80px;
		opacity: 0.7;
	}

	> .ring:after {
		content: " ";
		display: block;
		width: 64px;
		height: 64px;
		margin: 8px;
		border-radius: 50%;
		border: solid 6px;
		border-color: var(--fg) transparent transparent transparent;
		animation: ring 0.5s linear infinite;
	}
}
</style>
