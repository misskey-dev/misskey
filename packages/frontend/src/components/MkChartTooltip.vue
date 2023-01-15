<template>
<MkTooltip ref="tooltip" :showing="showing" :x="x" :y="y" :max-width="340" :direction="'top'" :inner-margin="16" @closed="emit('closed')">
	<div v-if="title || series">
		<div v-if="title" :class="$style.title">{{ title }}</div>
		<template v-if="series">
			<div v-for="x in series">
				<span :class="$style.color" :style="{ background: x.backgroundColor, borderColor: x.borderColor }"></span>
				<span>{{ x.text }}</span>
			</div>
		</template>
	</div>
</MkTooltip>
</template>

<script lang="ts" setup>
import { } from 'vue';
import MkTooltip from './MkTooltip.vue';

defineProps<{
	showing: boolean;
	x: number;
	y: number;
	title?: string;
	series?: {
		backgroundColor: string;
		borderColor: string;
		text: string;
	}[];
}>();

const emit = defineEmits<{
	(ev: 'closed'): void;
}>();
</script>

<style lang="scss" module>
.title {
	margin-bottom: 4px;
}

.color {
	display: inline-block;
	width: 8px;
	height: 8px;
	border-width: 1px;
	border-style: solid;
	margin-right: 8px;
}
</style>
