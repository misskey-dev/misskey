<template>
<div class="fpezltsf" :class="{ warn }">
	<i v-if="warn"><Fa :icon="faExclamationTriangle"/></i>
	<i v-else><Fa :icon="faInfoCircle"/></i>
	<slot></slot>
</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { faInfoCircle, faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';
import * as os from '@/os';

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
			faInfoCircle, faExclamationTriangle
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
	border-radius: 5px;

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
</style>
