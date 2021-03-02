<template>
<div class="acemodlh _monospace">
	<div>
		<span v-text="y"></span>/<span v-text="m"></span>/<span v-text="d"></span>
	</div>
	<div>
		<span v-text="hh"></span>
		<span :style="{ visibility: showColon ? 'visible' : 'hidden' }">:</span>
		<span v-text="mm"></span>
		<span :style="{ visibility: showColon ? 'visible' : 'hidden' }">:</span>
		<span v-text="ss"></span>
	</div>
</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import * as os from '@/os';

export default defineComponent({
	data() {
		return {
			clock: null,
			y: null,
			m: null,
			d: null,
			hh: null,
			mm: null,
			ss: null,
			showColon: true,
		};
	},
	created() {
		this.tick();
		this.clock = setInterval(this.tick, 1000);
	},
	beforeUnmount() {
		clearInterval(this.clock);
	},
	methods: {
		tick() {
			const now = new Date();
			this.y = now.getFullYear().toString();
			this.m = (now.getMonth() + 1).toString().padStart(2, '0');
			this.d = now.getDate().toString().padStart(2, '0');
			this.hh = now.getHours().toString().padStart(2, '0');
			this.mm = now.getMinutes().toString().padStart(2, '0');
			this.ss = now.getSeconds().toString().padStart(2, '0');
			this.showColon = now.getSeconds() % 2 === 0;
		}
	}
});
</script>

<style lang="scss" scoped>
.acemodlh {
	opacity: 0.7;
	font-size: 0.85em;
	line-height: 1em;
	text-align: center;
}
</style>
