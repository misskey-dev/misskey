<template>
<div class="fzenkabp _formItem">
	<div class="_formPanel" :class="{ warn }">
		<i v-if="warn"><Fa :icon="faExclamationTriangle"/></i>
		<i v-else><Fa :icon="faInfoCircle"/></i>
		<slot></slot>
	</div>
</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { faInfoCircle, faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';

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
.fzenkabp {
	> div {
		padding: 14px 16px;
		font-size: 90%;
		background: var(--infoBg);
		color: var(--infoFg);

		&.warn {
			background: var(--infoWarnBg);
			color: var(--infoWarnFg);
		}

		> i {
			margin-right: 4px;
		}
	}
}
</style>
