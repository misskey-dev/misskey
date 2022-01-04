<template>
<div class="vrtktovh _formBlock">
	<div class="label"><slot name="label"></slot></div>
	<div class="main _formRoot">
		<slot></slot>
	</div>
</div>
</template>

<script lang="ts" setup>
</script>

<style lang="scss" scoped>
.vrtktovh {
	border-top: solid 0.5px var(--divider);
	border-bottom: solid 0.5px var(--divider);

	& + .vrtktovh {
		border-top: none;
	}

	&:first-child {
		border-top: none;
	}

	&:last-child {
		border-bottom: none;
	}

	> .label {
		font-weight: bold;
		margin: 1.5em 0 16px 0;

		&:empty {
			display: none;
		}
	}

	> .main {
		margin: 1.5em 0;
	}
}
</style>
