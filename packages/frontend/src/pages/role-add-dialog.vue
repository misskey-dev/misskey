/*
 * SPDX-FileCopyrightText: lqvp
 * SPDX-License-Identifier: AGPL-3.0-only
 */

<template>
<MkModalWindow
	ref="dialog"
	:width="400"
	@close="dialog.close()"
	@closed="$emit('closed')"
>
	<template v-if="!props.role" #header>
		<div :class="$style.header">
			<span>{{ i18n.ts.communityRole }}<span class="_beta">{{ i18n.ts.originalFeature }}</span></span>
			<XTabs :class="$style.tabs" :rootEl="dialog" :tab="tab" :tabs="headerTabs" @update:tab="key => tab = key"/>
		</div>
	</template>
	<template v-else #header>{{ i18n.ts.changes }}</template>

	<div v-if="tab === 'add'">
		<MkSpacer :marginMin="20" :marginMax="28">
			<div class="_gaps_m">
				<div v-if="iconUrl != null" :class="$style.imgs">
					<div :class="$style.imgContainer">
						<img :src="iconUrl" :class="$style.img"/>
					</div>
				</div>
				<MkInput v-model="name">
					<template #label>{{ i18n.ts.name }}</template>
				</MkInput>
				<MkTextarea v-model="description">
					<template #label>{{ i18n.ts.description }}</template>
				</MkTextarea>
				<MkColorInput v-model="color">
					<template #label>{{ i18n.ts.color }}</template>
				</MkColorInput>
				<MkInput v-model="iconUrl" type="url">
					<template #label>{{ i18n.ts._role.iconUrl }}</template>
				</MkInput>
				<MkSwitch v-model="asBadge">{{ i18n.ts._role.asBadge }}</MkSwitch>
				<MkSwitch v-model="isPublic">{{ i18n.ts._role.isPublic }}</MkSwitch>
				<MkSwitch v-model="isExplorable">{{ i18n.ts._role.isExplorable }}</MkSwitch>
			</div>
		</MkSpacer>
		<div :class="$style.footer">
			<MkButton primary rounded style="margin: 0 auto;" @click="done"><i class="ti ti-check"></i> {{ props.role ? i18n.ts.update : i18n.ts.create }}</MkButton>
		</div>
	</div>

	<div v-else-if="tab === 'manage'">
		<MkSpacer :marginMin="20" :marginMax="28">
			<div class="_gaps_m">
				<div class="_gaps_s">
					<MkFoldableSection>
						<template #header>{{ i18n.ts.assignedRoles }}</template>
						<div class="_gaps_s">
							<DialogRole v-for="role in rolesAssigned" :key="role.id" :role="role" :isAssigned="true"/>
						</div>
					</MkFoldableSection>
					<MkFoldableSection>
						<template #header>{{ i18n.ts.assignableRoles }}</template>
						<div class="_gaps_s">
							<DialogRole v-for="role in roles" :key="role.id" :role="role" :isAssigned="false"/>
						</div>
					</MkFoldableSection>
				</div>
			</div>
		</MkSpacer>
	</div>
</MkModalWindow>
</template>

<script lang="ts" setup>
import { onMounted, ref, computed, watch } from 'vue';
import MkModalWindow from '@/components/MkModalWindow.vue';
import MkButton from '@/components/MkButton.vue';
import MkInput from '@/components/MkInput.vue';
import * as os from '@/os';
import { i18n } from '@/i18n';
import MkSwitch from '@/components/MkSwitch.vue';
import XTabs from '@/components/global/MkPageHeader.tabs.vue';
import MkFoldableSection from '@/components/MkFoldableSection.vue';
import MkColorInput from '@/components/MkColorInput.vue';
import MkTextarea from '@/components/MkTextarea.vue';
import DialogRole from '@/pages/DialogRole.vue';
import { misskeyApi } from '@/utility/misskey-api.js';
import { $i } from '@/i.js';

const props = defineProps<{
	role?: any,
}>();

const dialog = ref(null);
const name = ref(props.role ? props.role.name : '');
const description = ref(props.role ? props.role.description : '');
const color = ref(props.role ? props.role.color : '#000000');
const isExplorable = ref(props.role ? props.role.isExplorable : true);
const isPublic = ref(props.role ? props.role.isPublic : true);
const asBadge = ref(props.role ? props.role.asBadge : false);
const iconUrl = ref(props.role ? props.role.iconUrl : null); // iconUrl 変数を追加

let assignedList = [];
let roleList = [];

const rolesAssigned = computed(() => assignedList);
const roles = computed(() => roleList);

// ユーザーの権限チェックのみを使用
const canAddRolesPermission = computed(() => {
	return $i && $i.policies.canAddRoles;
});

// タブ定義を権限に応じて変更
const headerTabs = computed(() => {
	const tabs = [];

	// 編集モードか権限がある場合は add タブを表示
	if (props.role || canAddRolesPermission.value) {
		tabs.push({
			key: 'add',
			title: i18n.ts.add,
		});
	}

	// 「管理」タブは常に表示
	tabs.push({
		key: 'manage',
		title: i18n.ts.manage,
	});

	return tabs;
});

// 初期タブを権限に応じて設定（編集時は必ず'add'タブ）
const tab = ref(props.role ? 'add' : (canAddRolesPermission.value ? 'add' : 'manage'));

// タブの状態を監視し、権限に応じて調整
watch(() => canAddRolesPermission.value, (hasPermission) => {
	// 編集モードか権限がある場合は add タブを表示
	if (props.role || hasPermission) {
		if (!headerTabs.value.some(tab => tab.key === 'add')) {
			// 権限が付与されたら動的にタブを追加
			headerTabs.value.unshift({
				key: 'add',
				title: i18n.ts.add,
			});
			// 権限が付与されたので初期タブも変更
			if (!props.role) tab.value = 'add';
		}
	} else {
		// 管理タブのみ表示
		tab.value = 'manage';
	}
}, { immediate: true });

onMounted(async () => {
	assignedList = await misskeyApi('roles/list', {
		assignedOnly: true,
	});
	roleList = await misskeyApi('roles/list', {
		communityPublicOnly: true,
	}).then(v => v.filter(r => !assignedList.some(ra => r.id === ra.id)));
});

const emit = defineEmits<{
	(ev: 'done', v: { deleted?: boolean; updated?: any; created?: any }): void,
	(ev: 'closed'): void
}>();

async function done() {
	if (!name.value?.trim()) {
		os.alert({
			type: 'error',
			text: i18n.ts.inputRequired,
		});
		return;
	}

	const params = {
		name: name.value,
		description: description.value,
		iconUrl: iconUrl.value,
		color: color.value,
		asBadge: asBadge.value,
		isPublic: isPublic.value,
		isExplorable: isExplorable.value,
	};

	try {
		if (props.role) {
			await os.apiWithDialog('roles/update', {
				roleId: props.role.id,
				...params,
			});

			emit('done', {
				updated: {
					roleId: props.role.id,
					...params,
				},
			});
		} else {
			const created = await os.apiWithDialog('roles/add', params);

			emit('done', {
				created: created,
			});
		}

		if (dialog.value) dialog.value.close();
	} catch (err) {
		console.error('API error:', err);
	}
}
</script>

	<style lang="scss" module>

	.header {
		display: flex;
		gap: 10px;
	}

	.imgs {
		display: flex;
		gap: 8px;
		flex-wrap: wrap;
		justify-content: center;
	}

	.imgContainer {
		padding: 8px;
		border-radius: 6px;
	}

	.img {
		display: block;
		height: 64px;
		width: 64px;
		object-fit: contain;
	}

	.roleItem {
		display: flex;
	}

	.role {
		flex: 1;
	}

	.roleUnassign {
		width: 32px;
		height: 32px;
		margin-left: 8px;
		align-self: center;
	}

	.footer {
		position: sticky;
		bottom: 0;
		left: 0;
		padding: 12px;
		border-top: solid 0.5px var(--divider);
		-webkit-backdrop-filter: var(--blur, blur(15px));
		backdrop-filter: var(--blur, blur(15px));
	}

	// profile.vueからの流用
	.metadataRoot {
		container-type: inline-size;
	}

	.metadataMargin {
		margin-bottom: 1.5em;
	}

	.aliaseDragItem {
		display: flex;
		padding-bottom: .75em;
		align-items: flex-end;
		border-bottom: solid 0.5px var(--divider);

		&:last-child {
			border-bottom: 0;
		}

		/* (drag button) 32px + (drag button margin) 8px + (input width) 200px * 2 + (input gap) 12px = 452px */
		@container (max-width: 452px) {
			align-items: center;
		}
	}

	.dragItemHandle {
		cursor: grab;
		width: 32px;
		height: 32px;
		margin: 0 8px 0 0;
		opacity: 0.5;
		flex-shrink: 0;

		&:active {
			cursor: grabbing;
		}
	}

	.dragItemRemove {
		@extend .dragItemHandle;

		color: #ff2a2a;
		opacity: 1;
		cursor: pointer;

		&:hover, &:focus {
			opacity: .7;
		}
		&:active {
			cursor: pointer;
		}
	}

	.dragItemForm {
		flex-grow: 1;
	}

	.tabs:first-child {
		margin-left: auto;
		padding: 0 12px;
	}
	.tabs {
		pointer-events: auto;
		margin-right: auto;
	}
	</style>
