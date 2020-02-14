<template>
<div class="eqryymyo">
	<div class="header">
		<time ref="time" class="_ghost">
			<span class="yyyymmdd">{{ yyyy }}/{{ mm }}/{{ dd }}</span>
			<br>
			<span class="hhnn">{{ hh }}<span :style="{ visibility: now.getSeconds() % 2 == 0 ? 'visible' : 'hidden' }">:</span>{{ nn }}</span>
		</time>
	</div>
	<div class="content _panel">
		<mk-clock/>
	</div>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import MkClock from './analog-clock.vue';

export default Vue.extend({
	components: {
		MkClock
	},
	data() {
		return {
			now: new Date(),
			clock: null
		};
	},
	computed: {
		yyyy(): number {
			return this.now.getFullYear();
		},
		mm(): string {
			return ('0' + (this.now.getMonth() + 1)).slice(-2);
		},
		dd(): string {
			return ('0' + this.now.getDate()).slice(-2);
		},
		hh(): string {
			return ('0' + this.now.getHours()).slice(-2);
		},
		nn(): string {
			return ('0' + this.now.getMinutes()).slice(-2);
		}
	},
	mounted() {
		this.tick();
		this.clock = setInterval(this.tick, 1000);
	},
	beforeDestroy() {
		clearInterval(this.clock);
	},
	methods: {
		tick() {
			this.now = new Date();
		}
	}
});
</script>

<style lang="scss" scoped>
.eqryymyo {
	display: inline-block;
	overflow: visible;

	> .header {
		padding: 0 12px;
		padding-top: 4px;
		text-align: center;
		font-size: 12px;
		font-family: Lucida Console, Courier, monospace;

		&:hover + .content {
			opacity: 1;
		}

		> time {
			display: table-cell;
			vertical-align: middle;
			height: 48px;

			> .yyyymmdd {
				opacity: 0.7;
			}
		}
	}

	> .content {
		opacity: 0;
		display: block;
		position: absolute;
		top: auto;
		right: 0;
		margin: 16px 0 0 0;
		padding: 16px;
		width: 230px;
		transition: opacity 0.2s ease;
	}
}
</style>
