<template>
<mk-container :naked="props.transparent" :show-header="false">
	<div class="vubelbmv">
		<mk-analog-clock class="clock"/>
	</div>
</mk-container>
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
