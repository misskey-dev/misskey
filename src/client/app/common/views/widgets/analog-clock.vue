<template>
<div class="mkw-analog-clock">
	<ui-container :naked="props.style % 2 === 0" :show-header="false">
		<div class="mkw-analog-clock--body">
			<mk-analog-clock :dark="$store.state.device.darkmode" :smooth="props.style < 2"/>
		</div>
	</ui-container>
</div>
</template>

<script lang="ts">
import define from '../../../common/define-widget';
export default define({
	name: 'analog-clock',
	props: () => ({
		style: 0
	})
}).extend({
	methods: {
		func() {
			this.props.style = (this.props.style + 1) % 4;
			this.save();
		}
	}
});
</script>

<style lang="stylus" scoped>
.mkw-analog-clock
	.mkw-analog-clock--body
		padding 8px

</style>
