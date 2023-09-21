<template>
<div :class="[$style.root, { [$style.warn]: warn }]">
	<i v-if="warn" class="ti ti-alert-triangle" :class="$style.i"></i>
	<i v-else class="ti ti-info-circle" :class="$style.i"></i>
	<slot></slot>
</div>
</template>

<script lang="ts" setup>
import { } from 'vue';

const props = defineProps<{
	warn?: boolean;
}>();
</script>

<style lang="scss" module>
.root {
	padding: 12px 14px;
	font-size: 90%;
	background: var(--infoBg);
	color: var(--infoFg);
	border-radius: var(--radius);

	&.warn {
		background: var(--infoWarnBg);
		color: var(--infoWarnFg);
	}
}

.i {
	margin-right: 4px;
}
</style>
