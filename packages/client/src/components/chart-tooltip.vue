<template>
<MkTooltip ref="tooltip" :showing="showing" :x="x" :y="y" :max-width="340" :direction="'left'" :inner-margin="16" @closed="emit('closed')">
	<div v-if="title" class="qpcyisrl">
		<div class="title">{{ title }}</div>
		<div v-for="x in series" class="series">
			<span class="color" :style="{ background: x.backgroundColor, borderColor: x.borderColor }"></span>
			<span>{{ x.text }}</span>
		</div>
	</div>
</MkTooltip>
</template>

<script lang="ts" setup>
import {  } from 'vue';
import MkTooltip from './ui/tooltip.vue';

const props = defineProps<{
	showing: boolean;
	x: number;
	y: number;
	title: string;
	series: {
		backgroundColor: string;
		borderColor: string;
		text: string;
	}[];
}>();

const emit = defineEmits<{
	(ev: 'closed'): void;
}>();
</script>

<style lang="scss" scoped>
.qpcyisrl {
	> .title {
		margin-bottom: 4px;
	}

	> .series {
		> .color {
			display: inline-block;
			width: 8px;
			height: 8px;
			border-width: 1px;
			border-style: solid;
			margin-right: 8px;
		}
	}
}
</style>
