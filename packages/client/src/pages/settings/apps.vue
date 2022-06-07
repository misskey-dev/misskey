<template>
<div class="_formRoot">
	<FormPagination ref="list" :pagination="pagination">
		<template #empty>
			<div class="_fullinfo">
				<img src="https://xn--931a.moe/assets/info.jpg" class="_ghost"/>
				<div>{{ i18n.ts.nothing }}</div>
			</div>
		</template>
		<template v-slot="{items}">
			<div v-for="token in items" :key="token.id" class="_panel bfomjevm">
				<img v-if="token.iconUrl" class="icon" :src="token.iconUrl" alt=""/>
				<div class="body">
					<div class="name">{{ token.name }}</div>
					<div class="description">{{ token.description }}</div>
					<div class="_keyValue">
						<div>{{ i18n.ts.installedDate }}:</div>
						<div><MkTime :time="token.createdAt"/></div>
					</div>
					<div class="_keyValue">
						<div>{{ i18n.ts.lastUsedDate }}:</div>
						<div><MkTime :time="token.lastUsedAt"/></div>
					</div>
					<div class="actions">
						<button class="_button" @click="revoke(token)"><i class="fas fa-trash-alt"></i></button>
					</div>
					<details>
						<summary>{{ i18n.ts.details }}</summary>
						<ul>
							<li v-for="p in token.permission" :key="p">{{ $t(`_permissions.${p}`) }}</li>
						</ul>
					</details>
				</div>
			</div>
		</template>
	</FormPagination>
</div>
</template>

<script lang="ts" setup>
import { defineExpose, ref } from 'vue';
import FormPagination from '@/components/ui/pagination.vue';
import * as os from '@/os';
import * as symbols from '@/symbols';
import { i18n } from '@/i18n';

const list = ref<any>(null);

const pagination = {
	endpoint: 'i/apps' as const,
	limit: 100,
	params: {
		sort: '+lastUsedAt'
	}
};

function revoke(token) {
	os.api('i/revoke-token', { tokenId: token.id }).then(() => {
		list.value.reload();
	});
}

defineExpose({
	[symbols.PAGE_INFO]: {
		title: i18n.ts.installedApps,
		icon: 'fas fa-plug',
		bg: 'var(--bg)',
	}
});
</script>

<style lang="scss" scoped>
.bfomjevm {
	display: flex;
	padding: 16px;

	> .icon {
		display: block;
		flex-shrink: 0;
		margin: 0 12px 0 0;
		width: 50px;
		height: 50px;
		border-radius: 8px;
	}

	> .body {
		width: calc(100% - 62px);
		position: relative;

		> .name {
			font-weight: bold;
		}
	}
}
</style>
