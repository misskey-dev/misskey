<template>
<MkSpacer :content-max="700">
	<div class="ieepwinx">
		<MkButton :link="true" to="/my/antennas/create" primary class="add"><i class="fas fa-plus"></i> {{ i18n.ts.add }}</MkButton>

		<div class="">
			<MkPagination v-slot="{items}" ref="list" :pagination="pagination">
				<MkA v-for="antenna in items" :key="antenna.id" class="ljoevbzj" :to="`/my/antennas/${antenna.id}`">
					<div class="name">{{ antenna.name }}</div>
				</MkA>
			</MkPagination>
		</div>
	</div>
</MkSpacer>
</template>

<script lang="ts" setup>
import { } from 'vue';
import MkPagination from '@/components/ui/pagination.vue';
import MkButton from '@/components/ui/button.vue';
import * as symbols from '@/symbols';
import { i18n } from '@/i18n';

const pagination = {
	endpoint: 'antennas/list' as const,
	limit: 10,
};

defineExpose({
	[symbols.PAGE_INFO]: {
		title: i18n.ts.manageAntennas,
		icon: 'fas fa-satellite',
		bg: 'var(--bg)'
	}
});
</script>

<style lang="scss" scoped>
.ieepwinx {

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
