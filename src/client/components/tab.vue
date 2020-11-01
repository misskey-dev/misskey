<template>
<div class="pxhvhrfw" v-size="{ max: [500] }">
	<button v-for="item in items" class="_button" @click="$emit('update:value', item.value)" :class="{ active: value === item.value }" :disabled="value === item.value" :key="item.value"><Fa v-if="item.icon" :icon="item.icon" class="icon"/>{{ item.label }}</button>
</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
	props: {
		items: {
			type: Array,
			required: true,
		},
		value: {
			required: true,
		},
	},
});
</script>

<style lang="scss" scoped>
.pxhvhrfw {
	display: flex;

	> button {
		flex: 1;
		padding: 15px 12px 12px 12px;
		border-bottom: solid 3px transparent;

		&:disabled {
			opacity: 1 !important;
			cursor: default;
		}

		&.active {
			color: var(--accent);
			border-bottom-color: var(--accent);
		}

		&:not(.active):hover {
			color: var(--fgHighlighted);
		}

		> .icon {
			margin-right: 6px;
		}
	}

	&.max-width_500px {
		font-size: 80%;

		> button {
			padding: 11px 8px 8px 8px;
		}
	}
}
</style>
