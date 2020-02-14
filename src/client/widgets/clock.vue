<template>
<div>
	<mk-container :naked="props.style % 2 === 0" :show-header="false">
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
		style: 0
	})
}).extend({
	components: {
		MkContainer,
		MkAnalogClock
	},
	methods: {
		func() {
			this.props.style = (this.props.style + 1) % 4;
			this.save();
		}
	}
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
