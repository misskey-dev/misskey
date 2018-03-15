<template>
<time class="mk-time">
	{{ hh }}:{{ mm }}:{{ ss }}
</time>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
	props: {
		time: {
			type: [Date, String],
			required: true
		}
	},
	data() {
		return {
			tickId: null,
			hh: null,
			mm: null,
			ss: null
		};
	},
	computed: {
		_time(): Date {
			return typeof this.time == 'string' ? new Date(this.time) : this.time;
		}
	},
	created() {
		this.tick();
		this.tickId = setInterval(this.tick, 1000);
	},
	destroyed() {
		clearInterval(this.tickId);
	},
	methods: {
		tick() {
			const now = new Date().getTime();
			const start = this._time.getTime();
			const ago = Math.floor((now - start) / 1000);

			this.hh = Math.floor(ago / (60 * 60)).toString().padStart(2, '0');
			this.mm = Math.floor(ago / 60).toString().padStart(2, '0');
			this.ss = (ago % 60).toString().padStart(2, '0');
		}
	}
});
</script>
