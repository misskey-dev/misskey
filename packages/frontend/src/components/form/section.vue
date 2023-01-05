<template>
<div class="vrtktovh" :class="{ first }">
	<div class="label"><slot name="label"></slot></div>
	<div class="main">
		<slot></slot>
	</div>
</div>
</template>

<script lang="ts" setup>
defineProps<{
	first?: boolean;
}>();
</script>

<style lang="scss" scoped>
.vrtktovh {
	border-top: solid 0.5px var(--divider);
	//border-bottom: solid 0.5px var(--divider);

	> .label {
		font-weight: bold;
		padding: 1.5em 0 0 0;
		margin: 0 0 16px 0;

		&:empty {
			display: none;
		}
	}

	> .main {
		margin: 1.5em 0 0 0;
	}

	&.first {
		border-top: none;

		> .label {
			padding-top: 0;
		}
	}
}
</style>
