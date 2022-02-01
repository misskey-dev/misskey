<template>
<MkSpacer :content-max="700">
	<div class="qtcaoidl">
		<MkButton primary class="add" @click="create"><i class="fas fa-plus"></i> {{ $ts.add }}</MkButton>

		<MkPagination v-slot="{items}" ref="pagingComponent" :pagination="pagination" class="list">
			<MkA v-for="item in items" :key="item.id" :to="`/clips/${item.id}`" class="item _panel _gap">
				<b>{{ item.name }}</b>
				<div v-if="item.description" class="description">{{ item.description }}</div>
			</MkA>
		</MkPagination>
	</div>
</MkSpacer>
</template>

<script lang="ts" setup>
import { } from 'vue';
import MkPagination from '@/components/ui/pagination.vue';
import MkButton from '@/components/ui/button.vue';
import * as os from '@/os';
import * as symbols from '@/symbols';
import { i18n } from '@/i18n';

const pagination = {
	endpoint: 'clips/list' as const,
	limit: 10,
};

const pagingComponent = $ref<InstanceType<typeof MkPagination>>();

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

defineExpose({
	[symbols.PAGE_INFO]: {
		title: i18n.ts.clip,
		icon: 'fas fa-paperclip',
		bg: 'var(--bg)',
		action: {
			icon: 'fas fa-plus',
			handler: create
		},
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
