<template>
<div class="vrvdvrys">
	<XPie class="pie" :value="usage"/>
	<div>
		<p><fa :icon="faMicrochip"/>CPU</p>
		<p>{{ meta.cpu.cores }} Logical cores</p>
		<p>{{ meta.cpu.model }}</p>
	</div>
</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { faMicrochip } from '@fortawesome/free-solid-svg-icons';
import XPie from './pie.vue';

export default defineComponent({
	components: {
		XPie
	},
	props: {
		connection: {
			required: true,
		},
		meta: {
			required: true,
		}
	},
	data() {
		return {
			usage: 0,
			faMicrochip,
		};
	},
	mounted() {
		this.connection.on('stats', this.onStats);
	},
	beforeUnmount() {
		this.connection.off('stats', this.onStats);
	},
	methods: {
		onStats(stats) {
			this.usage = stats.cpu;
		}
	}
});
</script>

<style lang="scss" scoped>
.vrvdvrys {
	display: flex;
	padding: 16px;

	> .pie {
		height: 82px;
		flex-shrink: 0;
		margin-right: 16px;
	}

	> div {
		flex: 1;

		> p {
			margin: 0;
			font-size: 0.8em;

			&:first-child {
				font-weight: bold;
				margin-bottom: 4px;

				> i {
					margin-right: 4px;
				}
			}
		}
	}
}
</style>
