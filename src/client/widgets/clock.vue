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
import MkContainer from '@client/components/ui/container.vue';
import MkAnalogClock from '@client/components/analog-clock.vue';
import * as os from '@client/os';

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
	extends: widget,
	components: {
		MkContainer,
		MkAnalogClock
	},
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
