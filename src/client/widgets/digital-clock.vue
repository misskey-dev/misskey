<template>
<div class="mkw-digitalClock" :class="{ _panel: !props.transparent }" :style="{ fontSize: `${props.fontSize}em` }">
	<span>
		<span v-text="hh"></span>
		<span :style="{ visibility: showColon ? 'visible' : 'hidden' }">:</span>
		<span v-text="mm"></span>
		<span :style="{ visibility: showColon ? 'visible' : 'hidden' }">:</span>
		<span v-text="ss"></span>
		<span :style="{ visibility: showColon ? 'visible' : 'hidden' }" v-if="props.showMs">:</span>
		<span v-text="ms" v-if="props.showMs"></span>
	</span>
</div>
</template>

<script lang="ts">
import define from './define';

export default define({
	name: 'digitalClock',
	props: () => ({
		transparent: false,
		fontSize: 1.5,
		showMs: true,
	})
}).extend({
	data() {
		return {
			hh: null,
			mm: null,
			ss: null,
			ms: null,
			showColon: true,
		};
	},
	created() {
		this.tick();
		this.clock = setInterval(this.tick, 10);
	},
	beforeDestroy() {
		clearInterval(this.clock);
	},
	methods: {
		func() {
			// TODO: 設定画面
			this.save();
		},
		tick() {
			const now = new Date();
			this.hh = now.getHours().toString().padStart(2, '0');
			this.mm = now.getMinutes().toString().padStart(2, '0');
			this.ss = now.getSeconds().toString().padStart(2, '0');
			this.ms = Math.floor(now.getMilliseconds() / 10).toString().padStart(2, '0');
			this.showColon = now.getSeconds() % 2 === 0;
		}
	}
});
</script>

<style lang="scss" scoped>
.mkw-digitalClock {
	padding: 16px 0;
	font-family: Lucida Console, Courier, monospace;
	text-align: center;
}
</style>
