<template><MkStickyContainer>
	<template #header><MkPageHeader :actions="headerActions" :tabs="headerTabs"/></template>
		<MkSpacer :content-max="700">
	<div class="ieepwinx">
		<MkButton :link="true" to="/my/antennas/create" primary class="add"><i class="ti ti-plus"></i> {{ i18n.ts.add }}</MkButton>

		<div class="">
			<MkPagination v-slot="{items}" ref="list" :pagination="pagination">
				<MkA v-for="antenna in items" :key="antenna.id" class="ljoevbzj" :to="`/my/antennas/${antenna.id}`">
					<div class="name">{{ antenna.name }}</div>
				</MkA>
			</MkPagination>
		</div>
	</div>
</MkSpacer></MkStickyContainer>
</template>

<script lang="ts" setup>
import { } from 'vue';
import MkPagination from '@/components/MkPagination.vue';
import MkButton from '@/components/MkButton.vue';
import { i18n } from '@/i18n';
import { definePageMetadata } from '@/scripts/page-metadata';

const pagination = {
	endpoint: 'antennas/list' as const,
	noPaging: true,
	limit: 10,
};

const headerActions = $computed(() => []);

const headerTabs = $computed(() => []);

definePageMetadata({
	title: i18n.ts.manageAntennas,
	icon: 'ti ti-antenna',
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
