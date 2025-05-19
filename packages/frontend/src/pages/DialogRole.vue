/*
 * SPDX-FileCopyrightText: lqvp
 * SPDX-License-Identifier: AGPL-3.0-only
 */

<template>
<button v-adaptive-bg tabindex="-1" class="_panel" :class="$style.root" :style="{ '--color': role.color }" @click="roleAction">
	<div :class="$style.title">
		<span :class="$style.icon">
			<template v-if="role.iconUrl">
				<img :class="$style.badge" :src="role.iconUrl"/>
			</template>
		</span>
		<span :class="$style.name">{{ role.name }}</span>
	</div>
</button>
</template>

<script lang="ts" setup>
import { defineAsyncComponent, ref, computed } from 'vue';
import * as os from '@/os';
import { i18n } from '@/i18n';
import { misskeyApi } from '@/utility/misskey-api.js';
import { $i } from '@/i.js';

const props = defineProps<{
	role: {
		id: string,
		name: string,
		description: string,
		iconUrl: string,
		color: string,
		isOwner: boolean,
	},
	isAssigned: boolean,
}>();

// 権限チェック（計算プロパティ）
const canAddRoles = computed(() => {
	return $i && $i.policies.canAddRoles;
});

function roleAction(ev) {
	const menuItems = [
		{
			type: 'label',
			text: props.role.name,
		},
		(props.isAssigned ? {
			text: i18n.ts.unassign,
			icon: 'ti ti-minus',
			action: async () => {
				const { canceled } = await os.confirm({
					type: 'warning',
					text: i18n.tsx.removeAreYouSure({ x: props.role.name }),
				});
				if (canceled) return;

				await os.apiWithDialog('roles/unassign', {
					roleId: props.role.id,
				});
			},
		} : {
			text: i18n.ts.assign,
			icon: 'ti ti-plus',
			action: async () => {
				await os.apiWithDialog('roles/assign', {
					roleId: props.role.id,
				});
			},
		}),
	];

	// 権限があるか所有者の場合のみ編集ボタンを表示
	if ((canAddRoles.value || props.role.isOwner)) {
		menuItems.push({
			text: i18n.ts.edit,
			icon: 'ti ti-edit',
			action: () => {
				editRole(props.role); // 編集時には既存ロール情報を渡す
			},
		});
	}

	os.popupMenu(menuItems, ev.currentTarget ?? ev.target);
}

// 編集用関数（createRoleではなく）
function editRole(role) {
	// 権限チェック - 権限がない場合は実行しない
	if (!canAddRoles.value && !role.isOwner) {
		os.alert({
			type: 'error',
			title: i18n.ts.error,
			text: i18n.ts.operationForbidden,
		});
		return;
	}

	os.popup(defineAsyncComponent(() => import('./role-add-dialog.vue')), {
		role: role, // 既存のロール情報を渡す
	}, {}, 'closed');
}
</script>

<style lang="scss" module>
.root {
	display: block;
	padding: 16px 20px;
	border-left: solid 6px var(--color);
	border-top: none;
	border-bottom: none;
	border-right: none;
}

.title {
	display: flex;
}

.icon {
	margin-right: 8px;
}

.badge {
	height: 1.3em;
	vertical-align: -20%;
}

.name {
	font-weight: bold;
	min-width: 0;
}
</style>
