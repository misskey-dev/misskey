<template>
<div class="ieepwinx _section">
	<MkButton :link="true" to="/my/antennas/create" primary class="add"><i class="fas fa-plus"></i> {{ $ts.add }}</MkButton>

	<div class="_content">
		<MkPagination #default="{items}" ref="list" :pagination="pagination">
			<MkA v-for="antenna in items" :key="antenna.id" class="ljoevbzj" :to="`/my/antennas/${antenna.id}`">
				<div class="name">{{ antenna.name }}</div>
			</MkA>
		</MkPagination>
	</div>
</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import MkPagination from '@/components/ui/pagination.vue';
import MkButton from '@/components/ui/button.vue';
import * as symbols from '@/symbols';

export default defineComponent({
	components: {
		MkPagination,
		MkButton,
	},

	data() {
		return {
			[symbols.PAGE_INFO]: {
				title: this.$ts.manageAntennas,
				icon: 'fas fa-satellite',
				action: {
					icon: 'fas fa-plus',
					handler: this.create
				}
			},
			pagination: {
				endpoint: 'antennas/list',
				limit: 10,
			},
		};
	},
});
</script>

<style lang="scss" scoped>
.ieepwinx {
	padding: 16px;

	> .add {
		margin: 0 auto 16px auto;
	}

	.ljoevbzj {
		display: block;
		padding: 16px;
		margin-bottom: 8px;
		border: solid 1px var(--divider);
		border-radius: 6px;

		&:hover {
			border: solid 1px var(--accent);
			text-decoration: none;
		}

		> .name {
			font-weight: bold;
		}
	}
}
</style>
