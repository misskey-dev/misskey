<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<PageWithHeader :actions="headerActions" :tabs="headerTabs">
	<div class="_spacer" style="--MI_SPACER-w: 900px;">
		<div class="_gaps">
			<div class="_panel" :class="$style.description">
				<h2 :class="$style.title">ロール整理ツール</h2>
				<p>
					ロールの表示優先順位や公開設定を確認するための管理補助ページです。
				</p>
				<p>
					このページではまだロール設定を変更しません。まずは現在の状態を確認するための読み取り専用ページです。
				</p>
			</div>

			<MkFoldableSection>
				<template #header>変更予定一覧</template>
				<div class="_gaps_s">
					<div class="_panel" :class="$style.changeSummary">
						<div :class="$style.changeSummaryTitle">
							整理対象: {{ displayOrderChanges.length }}件
						</div>
						<p :class="$style.changeSummaryDescription">
							ここに表示されているロールは、現在の displayOrder と推奨 displayOrder が異なります。まだ実際のロール設定は変更されません。
						</p>
					</div>

					<div v-if="displayOrderChanges.length > 0" :class="$style.changeList">
						<div v-for="change in displayOrderChanges" :key="change.id" class="_panel" :class="$style.changeCard">
							<div>
								<div :class="$style.changeRoleName">{{ change.name }}</div>
								<div :class="$style.changeCategory">{{ change.categoryLabel }}</div>
							</div>
							<div :class="$style.changeOrder">
								{{ change.currentDisplayOrder }}
→
{{ change.suggestedDisplayOrder }}

<span
        v-if="change.suggestedDisplayOrder > change.currentDisplayOrder"
        :class="$style.moveUp"
>
        ↑ 上に移動
</span>

<span
        v-else-if="change.suggestedDisplayOrder < change.currentDisplayOrder"
        :class="$style.moveDown"
>
        ↓ 下に移動
</span>
							</div>
						</div>
					</div>

					<div v-if="displayOrderChanges.length > 0" :class="$style.bulkActionArea">
						<MkButton primary rounded>
							<i class="ti ti-arrows-sort"></i>
							displayOrderを一括整理
						</MkButton>
					</div>

					<div v-else class="_panel" :class="$style.changeSummary">
						整理が必要なロールはありません。
					</div>
				</div>
			</MkFoldableSection>

			<MkFoldableSection>
				<template #header>カテゴリ別ロール</template>
				<div class="_gaps_s">
					<div v-for="category in roleCategories" :key="category.key" class="_panel" :class="$style.categoryCard">
						<div :class="$style.categoryHeader">
							<div>
								<div :class="$style.categoryName">{{ category.label }}</div>
								<div :class="$style.categoryRange">{{ category.range }}</div>
							</div>
							<div :class="$style.categoryBadges">
								<span :class="$style.categoryCount">{{ getRolesByCategory(category.key).length }}件</span>
								<span
									:class="[
										$style.categoryDiffCount,
										getDifferentDisplayOrderCount(category.key) > 0 ? $style.categoryDiffCountWarning : $style.categoryDiffCountOk,
									]"
								>
									整理推奨 {{ getDifferentDisplayOrderCount(category.key) }}件
								</span>
							</div>
						</div>

						<div v-if="getRolesByCategory(category.key).length > 0" :class="$style.roleList">
							<div v-for="role in getRolesByCategory(category.key)" :key="role.id" :class="$style.compactRoleRow">
																<span :class="$style.compactRoleName">{{ role.name }}</span>
								<span :class="$style.compactRoleOrder">
									現在: {{ role.displayOrder }} → 推奨: {{ getSuggestedDisplayOrder(role, category.key) }}
								</span>
								<span
									:class="[
										$style.orderStatus,
										isDisplayOrderDifferent(role, category.key) ? $style.orderStatusWarning : $style.orderStatusOk,
									]"
								>
									{{ isDisplayOrderDifferent(role, category.key) ? '整理推奨' : 'OK' }}
								</span>							</div>
						</div>

						<p v-else :class="$style.emptyCategory">このカテゴリに入るロールはありません。</p>
					</div>
				</div>
			</MkFoldableSection>

			<MkFoldableSection>
				<template #header>手動ロール</template>
				<div :class="$style.roleList">
					<div v-for="role in manualRoles" :key="role.id" class="_panel" :class="$style.roleCard">
						<div :class="$style.roleHeader">
							<div>
								<div :class="$style.roleName">{{ role.name }}</div>
								<div :class="$style.roleId">{{ role.id }}</div>
							</div>
							<div :class="$style.orderBadge">
								displayOrder: {{ role.displayOrder }}
							</div>
						</div>
						<div :class="$style.roleMeta">
							<span>target: {{ role.target }}</span>
							<span>公開: {{ role.isPublic ? 'ON' : 'OFF' }}</span>
							<span>探索: {{ role.isExplorable ? 'ON' : 'OFF' }}</span>
							<span>バッジ: {{ role.asBadge ? 'ON' : 'OFF' }}</span>
						</div>
					</div>
				</div>
			</MkFoldableSection>

			<MkFoldableSection>
				<template #header>条件ロール</template>
				<div :class="$style.roleList">
					<div v-for="role in conditionalRoles" :key="role.id" class="_panel" :class="$style.roleCard">
						<div :class="$style.roleHeader">
							<div>
								<div :class="$style.roleName">{{ role.name }}</div>
								<div :class="$style.roleId">{{ role.id }}</div>
							</div>
							<div :class="$style.orderBadge">
								displayOrder: {{ role.displayOrder }}
							</div>
						</div>
						<div :class="$style.roleMeta">
							<span>target: {{ role.target }}</span>
							<span>公開: {{ role.isPublic ? 'ON' : 'OFF' }}</span>
							<span>探索: {{ role.isExplorable ? 'ON' : 'OFF' }}</span>
							<span>バッジ: {{ role.asBadge ? 'ON' : 'OFF' }}</span>
						</div>
					</div>
				</div>
			</MkFoldableSection>
		</div>
	</div>
</PageWithHeader>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import MkFoldableSection from '@/components/MkFoldableSection.vue';
import { misskeyApi } from '@/utility/misskey-api.js';
import MkButton from '@/components/MkButton.vue';
import { definePage } from '@/page.js';
import { katsudoRoleCategories } from './katsudo-role-categories.js';
import * as os from '@/os.js';

const roles = await misskeyApi('admin/roles/list');

const sortedRoles = computed(() => {
	return [...roles].sort((a, b) => b.displayOrder - a.displayOrder);
});

const roleCategories = katsudoRoleCategories;

function getRoleCategoryKey(role: typeof roles[number]) {
	for (const category of roleCategories) {
		if (category.key === 'uncategorized') continue;
		if ((category.roleNames as readonly string[]).includes(role.name)) {
			return category.key;
		}
	}

	return 'uncategorized';
}

function getRolesByCategory(categoryKey: string) {
	return sortedRoles.value.filter(role => getRoleCategoryKey(role) === categoryKey);
}

function getSuggestedDisplayOrder(role: typeof roles[number], categoryKey: string) {
	const category = roleCategories.find(x => x.key === categoryKey);
	if (category == null) return role.displayOrder;

	const index = getRolesByCategory(categoryKey).findIndex(x => x.id === role.id);
	if (index < 0) return role.displayOrder;

	return category.baseOrder - (index * 10);
}

function isDisplayOrderDifferent(role: typeof roles[number], categoryKey: string) {
	return role.displayOrder !== getSuggestedDisplayOrder(role, categoryKey);
}

function getDifferentDisplayOrderCount(categoryKey: string) {
	return getRolesByCategory(categoryKey).filter(role => isDisplayOrderDifferent(role, categoryKey)).length;
}

const displayOrderChanges = computed(() => {
	return roleCategories.flatMap(category => {
		return getRolesByCategory(category.key)
			.filter(role => isDisplayOrderDifferent(role, category.key))
			.map(role => ({
				id: role.id,
				name: role.name,
				categoryLabel: category.label,
				currentDisplayOrder: role.displayOrder,
				suggestedDisplayOrder: getSuggestedDisplayOrder(role, category.key),
			}));
	});
});

async function confirmBulkDisplayOrderUpdate() {
	const changes = [...displayOrderChanges.value];

	const { canceled } = await os.confirm({
		type: 'warning',
		title: 'displayOrderを一括整理',
		text: `整理対象: ${changes.length}件\n\ndisplayOrderを推奨値へ更新します。`,
	});

	if (canceled) return;

	try {
		for (const change of changes) {
			const role = roles.find(x => x.id === change.id);
			if (role == null) continue;

			await misskeyApi('admin/roles/update', {
				roleId: role.id,
				name: role.name,
				description: role.description,
				color: role.color,
				iconUrl: role.iconUrl,
				target: role.target,
				isPublic: role.isPublic,
				isExplorable: role.isExplorable,
				asBadge: role.asBadge,
				canEditMembersByModerator: role.canEditMembersByModerator,
				displayOrder: change.suggestedDisplayOrder,
				isAdministrator: role.isAdministrator,
				isModerator: role.isModerator,
				policies: role.policies,
				condFormula: role.condFormula,
				preserveAssignmentOnMoveAccount: role.preserveAssignmentOnMoveAccount,
			});
		}

		await os.alert({
			type: 'success',
			title: '整理完了',
			text: `${changes.length}件のdisplayOrderを更新しました。`,
		});

		location.reload();
	} catch (err) {
		console.error(err);

		await os.alert({
			type: 'error',
			title: '更新失敗',
			text: 'displayOrderの更新中にエラーが発生しました。',
		});
	}
}

const manualRoles = computed(() => sortedRoles.value.filter(role => role.target === 'manual'));
const conditionalRoles = computed(() => sortedRoles.value.filter(role => role.target === 'conditional'));

const headerActions = computed(() => []);

const headerTabs = computed(() => []);

definePage(() => ({
	title: 'ロール整理ツール',
	icon: 'ti ti-badges',
}));
</script>

<style lang="scss" module>
.description {
	padding: 20px;
}

.title {
	margin: 0 0 12px;
	font-size: 1.3em;
}

.roleList {
	display: flex;
	flex-direction: column;
	gap: 10px;
}

.roleCard {
	padding: 14px 16px;
}

.roleHeader {
	display: flex;
	align-items: flex-start;
	justify-content: space-between;
	gap: 12px;
}

.roleName {
	font-weight: 700;
}

.roleId {
	margin-top: 4px;
	font-size: 0.85em;
	color: var(--MI_THEME-fg);
	opacity: 0.65;
	word-break: break-all;
}

.orderBadge {
	flex-shrink: 0;
	padding: 4px 8px;
	border-radius: 999px;
	background: var(--MI_THEME-accentedBg);
	color: var(--MI_THEME-accent);
	font-size: 0.85em;
	font-weight: 700;
}

.roleMeta {
	display: flex;
	flex-wrap: wrap;
	gap: 8px 12px;
	margin-top: 10px;
	font-size: 0.9em;
	color: var(--MI_THEME-fg);
	opacity: 0.8;
}
.categoryCard {
	padding: 14px 16px;
}

.categoryHeader {
	display: flex;
	align-items: flex-start;
	justify-content: space-between;
	gap: 12px;
	margin-bottom: 12px;
}

.categoryName {
	font-weight: 700;
	font-size: 1.05em;
}

.categoryRange {
	margin-top: 4px;
	font-size: 0.85em;
	color: var(--MI_THEME-fg);
	opacity: 0.65;
}

.categoryCount {
	flex-shrink: 0;
	padding: 4px 8px;
	border-radius: 999px;
	background: var(--MI_THEME-bg);
	border: solid 1px var(--MI_THEME-divider);
	font-size: 0.85em;
	font-weight: 700;
}

.compactRoleRow {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 12px;
	padding: 8px 0;
	border-top: solid 1px var(--MI_THEME-divider);
}

.compactRoleName {
	font-weight: 600;
}

.compactRoleOrder {
	flex-shrink: 0;
	font-size: 0.85em;
	color: var(--MI_THEME-fg);
	opacity: 0.7;
}

.emptyCategory {
	margin: 0;
	color: var(--MI_THEME-fg);
	opacity: 0.65;
}

.orderStatus {
	flex-shrink: 0;
	padding: 3px 8px;
	border-radius: 999px;
	font-size: 0.82em;
	font-weight: 700;
}

.orderStatusWarning {
	background: rgba(251, 191, 36, 0.18);
	color: #b45309;
}

.orderStatusOk {
	background: rgba(34, 197, 94, 0.16);
	color: #15803d;
}

.categoryBadges {
	display: flex;
	flex-wrap: wrap;
	justify-content: flex-end;
	gap: 6px;
}

.categoryDiffCount {
	flex-shrink: 0;
	padding: 4px 8px;
	border-radius: 999px;
	font-size: 0.85em;
	font-weight: 700;
}

.categoryDiffCountWarning {
	background: rgba(251, 191, 36, 0.18);
	color: #b45309;
}

.categoryDiffCountOk {
	background: rgba(34, 197, 94, 0.16);
	color: #15803d;
}

.changeSummary {
	padding: 14px 16px;
}

.changeSummaryTitle {
	font-weight: 700;
	font-size: 1.05em;
}

.changeSummaryDescription {
	margin: 8px 0 0;
	color: var(--MI_THEME-fg);
	opacity: 0.75;
	line-height: 1.7;
}

.changeList {
	display: flex;
	flex-direction: column;
	gap: 8px;
}

.changeCard {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 12px;
	padding: 12px 14px;
}

.changeRoleName {
	font-weight: 700;
}

.changeCategory {
	margin-top: 4px;
	font-size: 0.85em;
	color: var(--MI_THEME-fg);
	opacity: 0.65;
}

.changeOrder {
	flex-shrink: 0;
	padding: 4px 8px;
	border-radius: 999px;
	background: rgba(251, 191, 36, 0.18);
	color: #b45309;
	font-size: 0.9em;
	font-weight: 700;
}

.bulkActionArea {
	display: flex;
	justify-content: flex-end;
}

.bulkActionArea {
	display: flex;
	justify-content: flex-end;
}
.moveUp {
        margin-left: 8px;
        font-weight: 700;
}

.moveDown {
        margin-left: 8px;
        font-weight: 700;
        opacity: 0.75;
}
</style>
