<template>
<div :class="[$style.root, { [$style.warn]: warn }]">
	<i v-if="warn" class="ti ti-alert-triangle" :class="$style.i"></i>
	<i v-else class="ti ti-info-circle" :class="$style.i"></i>
	<slot></slot>
	<MkButton v-if="action" :class="$style.action" primary link :to="action.to">
		{{ action.text }}
	</MkButton>
</div>
</template>

<script lang="ts" setup>
import { } from 'vue';
import MkButton from './MkButton.vue';

defineProps<{
	warn?: boolean;
	action?: {
		text: string;
		to: string;
	}
}>();
</script>

<style lang="scss" module>
.root {
	display: flex;
	align-items: center;
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

.action {
	margin-left: auto;
}
</style>
