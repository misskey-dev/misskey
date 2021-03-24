<template>
<div class="zbwaqsat">
	<XPie class="pie" :value="usage"/>
	<div>
		<p><fa :icon="faHdd"/>Disk</p>
		<p>Total: {{ bytes(total, 1) }}</p>
		<p>Free: {{ bytes(available, 1) }}</p>
		<p>Used: {{ bytes(used, 1) }}</p>
	</div>
</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { faHdd } from '@fortawesome/free-solid-svg-icons';
import XPie from './pie.vue';
import bytes from '@client/filters/bytes';

export default defineComponent({
	components: {
		XPie
	},
	props: {
		meta: {
			required: true,
		}
	},
	data() {
		return {
			usage: this.meta.fs.used / this.meta.fs.total,
			total: this.meta.fs.total,
			used: this.meta.fs.used,
			available: this.meta.fs.total - this.meta.fs.used,
			faHdd,
		};
	},
	methods: {
		bytes
	}
});
</script>

<style lang="scss" scoped>
.zbwaqsat {
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
