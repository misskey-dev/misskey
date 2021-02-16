<template>
<div class="_monospace">
	<span>
		<span v-text="hh"></span>
		<span :style="{ visibility: showColon ? 'visible' : 'hidden' }">:</span>
		<span v-text="mm"></span>
		<span :style="{ visibility: showColon ? 'visible' : 'hidden' }">:</span>
		<span v-text="ss"></span>
	</span>
</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import * as os from '@/os';

export default defineComponent({
	data() {
		return {
			clock: null,
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
			this.hh = now.getHours().toString().padStart(2, '0');
			this.mm = now.getMinutes().toString().padStart(2, '0');
			this.ss = now.getSeconds().toString().padStart(2, '0');
			this.showColon = now.getSeconds() % 2 === 0;
		}
	}
});
</script>
