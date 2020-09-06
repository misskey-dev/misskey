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
import { defineComponent } from 'vue';
import define from './define';
import * as os from '@/os';

const widget = define({
	name: 'digitalClock',
	props: () => ({
		transparent: {
			type: 'boolean',
			default: false,
		},
		fontSize: {
			type: 'number',
			default: 1.5,
			step: 0.1,
		},
		showMs: {
			type: 'boolean',
			default: true,
		},
	})
});

export default defineComponent({
	extends: widget,
	data() {
		return {
			clock: null,
			hh: null,
			mm: null,
			ss: null,
			ms: null,
			showColon: true,
		};
	},
	created() {
		this.tick();
		this.$watch(() => this.props.showMs, () => {
			if (this.clock) clearInterval(this.clock);
			this.clock = setInterval(this.tick, this.props.showMs ? 10 : 1000);
		}, { immediate: true });
	},
	beforeDestroy() {
		clearInterval(this.clock);
	},
	methods: {
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
