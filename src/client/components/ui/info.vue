<template>
<div class="fpezltsf" :class="{ warn }">
	<i v-if="warn" class="fas fa-exclamation-triangle"></i>
	<i v-else class="fas fa-info-circle"></i>
	<slot></slot>
</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import * as os from '@client/os';

export default defineComponent({
	props: {
		warn: {
			type: Boolean,
			required: false,
			default: false
		},
	},
	data() {
		return {
		};
	}
});
</script>

<style lang="scss" scoped>
.fpezltsf {
	margin: 16px 0;
	padding: 16px;
	font-size: 90%;
	background: var(--infoBg);
	color: var(--infoFg);
	border-radius: var(--radius);

	&.warn {
		background: var(--infoWarnBg);
		color: var(--infoWarnFg);
	}

	&:first-child {
		margin-top: 0;
	}

	&:last-child {
		margin-bottom: 0;
	}

	> i {
		margin-right: 4px;
	}
}

._flat_ .fpezltsf {
	border-radius: 0;
}
</style>
