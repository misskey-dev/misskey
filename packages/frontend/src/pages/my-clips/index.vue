<template>
<MkStickyContainer>
	<template #header><MkPageHeader :actions="headerActions" :tabs="headerTabs"/></template>
	<MkSpacer :content-max="700">
		<div class="qtcaoidl">
			<MkButton primary class="add" @click="create"><i class="ti ti-plus"></i> {{ i18n.ts.add }}</MkButton>

			<MkPagination v-slot="{items}" ref="pagingComponent" :pagination="pagination" class="list">
				<MkA v-for="item in items" :key="item.id" :to="`/clips/${item.id}`" class="item _panel _margin">
					<b>{{ item.name }}</b>
					<div v-if="item.description" class="description">{{ item.description }}</div>
				</MkA>
			</MkPagination>
		</div>
	</MkSpacer>
</MkStickyContainer>
</template>

<script lang="ts" setup>
import { } from 'vue';
import MkPagination from '@/components/MkPagination.vue';
import MkButton from '@/components/MkButton.vue';
import * as os from '@/os';
import { i18n } from '@/i18n';
import { definePageMetadata } from '@/scripts/page-metadata';

const pagination = {
	endpoint: 'clips/list' as const,
	limit: 10,
};

const pagingComponent = $shallowRef<InstanceType<typeof MkPagination>>();

async function create() {
	const { canceled, result } = await os.form(i18n.ts.createNewClip, {
		name: {
			type: 'string',
			label: i18n.ts.name,
		},
		description: {
			type: 'string',
			required: false,
			multiline: true,
			label: i18n.ts.description,
		},
		isPublic: {
			type: 'boolean',
			label: i18n.ts.public,
			default: false,
		},
	});
	if (canceled) return;

	os.apiWithDialog('clips/create', result);

	pagingComponent.reload();
}

function onClipCreated() {
	pagingComponent.reload();
}

function onClipDeleted() {
	pagingComponent.reload();
}

const headerActions = $computed(() => []);

const headerTabs = $computed(() => []);

definePageMetadata({
	title: i18n.ts.clip,
	icon: 'ti ti-paperclip',
	action: {
		icon: 'ti ti-plus',
		handler: create,
	},
});
</script>

<style lang="scss" scoped>
.qtcaoidl {
	> .add {
		margin: 0 auto 16px auto;
	}

	> .list {
		> .item {
			display: block;
			padding: 16px;

			> .description {
				margin-top: 8px;
				padding-top: 8px;
				border-top: solid 0.5px var(--divider);
			}
		}
	}
}
</style>
