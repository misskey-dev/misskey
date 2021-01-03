<template>
<div class="zlxnikvl">
	<XPie class="pie" :value="usage"/>
	<div>
		<p><fa :icon="faMemory"/>RAM</p>
		<p>Total: {{ bytes(total, 1) }}</p>
		<p>Used: {{ bytes(used, 1) }}</p>
		<p>Free: {{ bytes(free, 1) }}</p>
	</div>
</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { faMemory } from '@fortawesome/free-solid-svg-icons';
import XPie from './pie.vue';
import bytes from '@/filters/bytes';

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
			total: 0,
			used: 0,
			free: 0,
			faMemory,
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
			this.usage = stats.mem.used / this.meta.mem.total;
			this.total = this.meta.mem.total;
			this.used = stats.mem.used;
			this.free = this.meta.mem.total - stats.mem.used;
		},
		bytes
	}
});
</script>

<style lang="scss" scoped>
.zlxnikvl {
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

				> [data-icon] {
					margin-right: 4px;
				}
			}
		}
	}
}
</style>
