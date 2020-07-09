<template>
<div>
	<mk-container :naked="props.transparent" :show-header="false">
		<div class="vubelbmv">
			<mk-analog-clock class="clock" :smooth="props.style < 2"/>
		</div>
	</mk-container>
</div>
</template>

<script lang="ts">
import define from './define';
import MkContainer from '../components/ui/container.vue';
import MkAnalogClock from '../components/analog-clock.vue';

export default define({
	name: 'clock',
	props: () => ({
		transparent: {
			type: 'boolean',
			default: false,
		},
	})
}).extend({
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
