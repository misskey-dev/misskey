<template>
<MkContainer :naked="props.transparent" :show-header="false">
	<div class="vubelbmv">
		<MkAnalogClock class="clock" :thickness="props.thickness"/>
	</div>
</MkContainer>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import define from './define';
import MkContainer from '@/components/ui/container.vue';
import MkAnalogClock from '@/components/analog-clock.vue';
import * as os from '@/os';

const widget = define({
	name: 'clock',
	props: () => ({
		transparent: {
			type: 'boolean',
			default: false,
		},
		thickness: {
			type: 'radio',
			default: 0.1,
			options: [{
				value: 0.1, label: 'thin'
			}, {
				value: 0.2, label: 'medium'
			}, {
				value: 0.3, label: 'thick'
			}]
		}
	})
});

export default defineComponent({
	components: {
		MkContainer,
		MkAnalogClock
	},
	extends: widget,
});
</script>

<style lang="scss" scoped>
.vubelbmv {
	padding: 8px;

	> .clock {
		height: 150px;
		margin: auto;
	}
}
</style>
