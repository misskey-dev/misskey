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
				<template #header>ロール整理設定</template>
				<div class="_panel" :class="$style.settingsPanel">
					<div :class="$style.settingsTitle">
						現在の設定
					</div>
					<p :class="$style.settingsDescription">
						現在はコード上のカテゴリ設定を読み込んでいます。今後ここからカテゴリ・基準値・ロール分類を編集できるようにします。
					</p>

					<div :class="$style.newCategoryForm">
						<input
							v-model="newCategoryLabel"
							type="text"
							placeholder="新規カテゴリ名"
							:class="$style.newCategoryInput"
						>

						<input
							v-model.number="newCategoryBaseOrder"
							type="number"
							placeholder="基準値"
							:class="$style.newCategoryBaseOrderInput"
						>

						<MkButton rounded @click="addTemporaryRoleCategory">
							カテゴリ追加
						</MkButton>
					</div>

					<div :class="$style.settingsActions">
						<MkButton rounded @click="resetTemporaryRoleCategories">
							一時変更を元に戻す
						</MkButton>
					</div>

					<details :class="$style.settingsJsonDetails">
						<summary :class="$style.settingsJsonSummary">
							現在の一時設定JSONを見る
						</summary>

						<div :class="$style.settingsJsonActions">
							<MkButton rounded @click="copyEditableRoleCategoriesJson">
								JSONをコピー
							</MkButton>
						</div>

						<pre :class="$style.settingsJsonPreview">{{ editableRoleCategoriesJson }}</pre>
					</details>

					<div :class="$style.settingsCategoryList">
						<div
							v-for="category in roleCategories"
							:key="category.key"
							:class="$style.settingsCategoryRow"
						>
							<div>
								<div :class="$style.settingsCategoryName">{{ category.label }}</div>
								<div :class="$style.settingsCategoryMeta">
									{{ category.range }}
								</div>

								<label :class="$style.settingsCategoryBaseOrder">
									<span>基準値</span>
									<input
										:value="category.baseOrder"
										type="number"
										:class="$style.settingsCategoryInput"
										@input="updateCategoryBaseOrder(category, $event)"
									>
								</label>
							</div>

							<div :class="$style.settingsCategoryCount">
								登録ロール {{ category.roleNames.length }}件
							</div>
						</div>
					</div>
				</div>
			</MkFoldableSection>

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
                                                                <span>
                                                                        {{ change.currentDisplayOrder }} → {{ change.suggestedDisplayOrder }}
                                                                </span>

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
						<MkButton primary rounded @click="confirmBulkDisplayOrderUpdate">
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
                                                                <div :class="$style.categoryRange">
                                                                        基準値: {{ category.baseOrder }}
                                                                </div>
                                                                <div v-if="category.key === 'uncategorized'" :class="$style.categoryNotice">
                                                                        このロールは分類設定に未登録です。分類したい場合はカテゴリ設定にロール名を追加してください。
                                                                </div>
                                                                <pre
                                                                        v-if="category.key === 'uncategorized' && getRolesByCategory(category.key).length > 0"
                                                                        :class="$style.uncategorizedRoleNames"
                                                                >{{ getUncategorizedRoleNamesText() }}</pre>
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

                                                                <span :class="$style.compactRoleCategoryKey">
                                                                        {{ category.key }}
                                                                </span>

								<select
									:class="$style.moveCategorySelect"
									@change="moveRoleToCategoryFromSelect(role.name, $event)"
								>
									<option value="">移動先を選択</option>
									<option
										v-for="targetCategory in getMovableRoleCategories(category.key)"
										:key="targetCategory.key"
										:value="targetCategory.key"
									>
										{{ targetCategory.label }}
									</option>
								</select>

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
                                                                </span>
                                                        </div>
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
import { computed, ref } from 'vue';
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

function createEditableRoleCategories() {
	return katsudoRoleCategories.map(category => ({
		key: category.key,
		label: category.label,
		range: category.range,
		baseOrder: Number(category.baseOrder),
		roleNames: [...category.roleNames],
	}));
}

const editableRoleCategories = ref(createEditableRoleCategories());

const roleCategories = computed(() => editableRoleCategories.value);

const editableRoleCategoriesJson = computed(() => {
	return JSON.stringify(editableRoleCategories.value, null, 2);
});

const newCategoryLabel = ref('');
const newCategoryBaseOrder = ref(3000);

function getMovableRoleCategories(currentCategoryKey: string) {
	return roleCategories.value.filter(category => category.key !== currentCategoryKey);
}

function getRoleCategoryKey(role: typeof roles[number]) {
	for (const category of roleCategories.value) {
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

function updateCategoryBaseOrder(
	category: typeof editableRoleCategories.value[number],
	ev: Event,
) {
	const input = ev.target as HTMLInputElement;

	category.baseOrder = Number(input.value);
}

function moveRoleToCategory(roleName: string, targetCategoryKey: string) {
	for (const category of editableRoleCategories.value) {
		category.roleNames = category.roleNames.filter(x => x !== roleName);
	}

	const targetCategory = editableRoleCategories.value.find(x => x.key === targetCategoryKey);
	if (targetCategory == null) return;

	if (!targetCategory.roleNames.includes(roleName)) {
		targetCategory.roleNames.push(roleName);
	}
}

function moveRoleToCategoryFromSelect(roleName: string, ev: Event) {
	const select = ev.target as HTMLSelectElement;
	if (select.value === '') return;

	moveRoleToCategory(roleName, select.value);
	select.value = '';
}

function addTemporaryRoleCategory() {
	const label = newCategoryLabel.value.trim();
	if (label === '') return;

	const keyBase = label
		.toLowerCase()
		.replace(/\s+/g, '-')
		.replace(/[^a-z0-9_-]/g, '');

	const key = keyBase !== '' ? `custom-${keyBase}` : `custom-${Date.now()}`;

	if (editableRoleCategories.value.some(category => category.key === key)) return;

	editableRoleCategories.value.push({
		key,
		label,
		range: `${newCategoryBaseOrder.value}〜`,
		baseOrder: Number(newCategoryBaseOrder.value),
		roleNames: [],
	});

	newCategoryLabel.value = '';
}

function resetTemporaryRoleCategories() {
	editableRoleCategories.value = createEditableRoleCategories();
	newCategoryLabel.value = '';
	newCategoryBaseOrder.value = 3000;
}

async function copyEditableRoleCategoriesJson() {
	await navigator.clipboard.writeText(editableRoleCategoriesJson.value);

	await os.alert({
		type: 'success',
		title: 'コピーしました',
		text: '現在の一時設定JSONをクリップボードにコピーしました。',
	});
}

function getUncategorizedRoleNamesText() {
        return getRolesByCategory('uncategorized')
                .map(role => `'${role.name}',`)
                .join('\n');
}

function getSuggestedDisplayOrder(role: typeof roles[number], categoryKey: string) {
	const category = roleCategories.value.find(x => x.key === categoryKey);
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
	return roleCategories.value.flatMap(category => {
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

.moveUp {
	margin-left: 8px;
	font-weight: 700;
}

.moveDown {
	margin-left: 8px;
	font-weight: 700;
	opacity: 0.75;
}

.categoryNotice {
	margin-top: 6px;
	font-size: 0.85em;
	color: var(--MI_THEME-warn);
}

.compactRoleCategoryKey {
	margin-left: 8px;
	font-size: 0.8em;
	opacity: 0.65;
}

.uncategorizedRoleNames {
	margin: 8px 0 0;
	padding: 10px;
	font-family: monospace;
	font-size: 0.85em;
	white-space: pre-wrap;
	background: var(--MI_THEME-panel);
	border-radius: 8px;
	opacity: 0.9;
}

.settingsPanel {
	padding: 16px;
}

.settingsTitle {
	font-weight: 700;
	font-size: 1.05em;
}

.settingsDescription {
	margin: 8px 0 0;
	color: var(--MI_THEME-fg);
	opacity: 0.75;
	line-height: 1.7;
}

.settingsCategoryList {
	display: flex;
	flex-direction: column;
	gap: 8px;
	margin-top: 14px;
}

.settingsCategoryRow {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 12px;
	padding: 10px 0;
	border-top: solid 1px var(--MI_THEME-divider);
}

.settingsCategoryName {
	font-weight: 700;
}

.settingsCategoryMeta {
	margin-top: 4px;
	font-size: 0.85em;
	color: var(--MI_THEME-fg);
	opacity: 0.7;
}

.settingsCategoryCount {
	flex-shrink: 0;
	padding: 4px 8px;
	border-radius: 999px;
	background: var(--MI_THEME-bg);
	border: solid 1px var(--MI_THEME-divider);
	font-size: 0.85em;
	font-weight: 700;
}

.settingsCategoryBaseOrder {
	display: flex;
	align-items: center;
	gap: 8px;
	margin-top: 6px;
	font-size: 0.85em;
}

.settingsCategoryInput {
	width: 110px;
	padding: 4px 8px;
	border: solid 1px var(--MI_THEME-divider);
	border-radius: 8px;
	background: var(--MI_THEME-panel);
	color: var(--MI_THEME-fg);
}

.moveCategorySelect {
	flex-shrink: 0;
	max-width: 160px;
	padding: 5px 8px;
	border: solid 1px var(--MI_THEME-divider);
	border-radius: 8px;
	background: var(--MI_THEME-panel);
	color: var(--MI_THEME-fg);
	font: inherit;
	font-size: 0.85em;
}

.newCategoryForm {
	display: flex;
	flex-wrap: wrap;
	gap: 8px;
	margin-top: 14px;
}

.newCategoryInput {
	flex: 1;
	min-width: 180px;
	padding: 6px 10px;
	border: solid 1px var(--MI_THEME-divider);
	border-radius: 8px;
	background: var(--MI_THEME-panel);
	color: var(--MI_THEME-fg);
}

.newCategoryBaseOrderInput {
	width: 110px;
	padding: 6px 10px;
	border: solid 1px var(--MI_THEME-divider);
	border-radius: 8px;
	background: var(--MI_THEME-panel);
	color: var(--MI_THEME-fg);
}

.settingsActions {
	display: flex;
	justify-content: flex-end;
	margin-top: 10px;
}

.settingsJsonDetails {
	margin-top: 12px;
}

.settingsJsonSummary {
	cursor: pointer;
	font-weight: 700;
}

.settingsJsonPreview {
	margin: 10px 0 0;
	padding: 12px;
	max-height: 260px;
	overflow: auto;
	border-radius: 10px;
	background: var(--MI_THEME-bg);
	border: solid 1px var(--MI_THEME-divider);
	font-family: monospace;
	font-size: 0.85em;
	white-space: pre;
}

.settingsJsonActions {
	display: flex;
	justify-content: flex-end;
	margin-top: 10px;
}
</style>
