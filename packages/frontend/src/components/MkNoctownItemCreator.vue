<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div :class="$style.panel">
	<div :class="$style.header">
		<i class="ti ti-brush"></i>
		<span>アイテム作成</span>
		<button :class="$style.closeBtn" @click="$emit('close')">
			<i class="ti ti-x"></i>
		</button>
	</div>

	<div :class="$style.content">
		<!-- Create new item form -->
		<div v-if="mode === 'create'" :class="$style.form">
			<div :class="$style.formGroup">
				<label :class="$style.label">アイテム名</label>
				<input
					v-model="itemName"
					:class="$style.input"
					type="text"
					maxlength="64"
					placeholder="アイテムの名前を入力"
				/>
			</div>

			<div :class="$style.formGroup">
				<label :class="$style.label">説明文</label>
				<textarea
					v-model="itemFlavorText"
					:class="$style.textarea"
					maxlength="500"
					placeholder="アイテムの説明を入力（任意）"
					rows="3"
				></textarea>
			</div>

			<div :class="$style.formGroup">
				<label :class="$style.label">種類</label>
				<select v-model="itemType" :class="$style.select">
					<option value="normal">通常アイテム</option>
					<option value="placeable">設置可能</option>
					<option value="furniture">家具</option>
					<option value="wallpaper">壁紙</option>
					<option value="frame">額縁</option>
				</select>
			</div>

			<div :class="$style.formGroup">
				<label :class="$style.label">画像</label>
				<div :class="$style.imageUpload">
					<div v-if="selectedImage" :class="$style.imagePreview">
						<img :src="selectedImage.url" alt="プレビュー" />
						<button :class="$style.removeImageBtn" @click="selectedImage = null">
							<i class="ti ti-x"></i>
						</button>
					</div>
					<button v-else :class="$style.uploadBtn" @click="selectImage($event)">
						<i class="ti ti-upload"></i>
						<span>画像を選択</span>
					</button>
				</div>
			</div>

			<div :class="$style.costInfo">
				<i class="ti ti-coin"></i>
				<span>作成コスト: 500 コイン</span>
			</div>

			<MkButton :class="$style.submitBtn" primary @click="createItem" :disabled="!canCreate || creating">
				<i class="ti ti-plus"></i> アイテムを作成
			</MkButton>
		</div>

		<!-- My creations list -->
		<div v-else-if="mode === 'list'" :class="$style.listView">
			<div :class="$style.listHeader">
				<span>作成済みアイテム ({{ myItems.length }}/{{ maxAllowed }})</span>
				<button :class="$style.newBtn" @click="mode = 'create'">
					<i class="ti ti-plus"></i> 新規作成
				</button>
			</div>

			<div v-if="loading" :class="$style.loading">
				<MkLoading/>
			</div>
			<div v-else-if="myItems.length === 0" :class="$style.empty">
				まだアイテムを作成していません
			</div>
			<div v-else :class="$style.itemList">
				<div
					v-for="item in myItems"
					:key="item.id"
					:class="$style.itemCard"
					@click="editItem(item)"
				>
					<div :class="$style.itemImage">
						<img v-if="item.imageUrl" :src="item.imageUrl" alt="" />
						<i v-else class="ti ti-package"></i>
					</div>
					<div :class="$style.itemInfo">
						<div :class="$style.itemName">{{ item.name }}</div>
						<div :class="$style.itemType">{{ getTypeName(item.itemType) }}</div>
					</div>
					<button :class="$style.editBtn">
						<i class="ti ti-pencil"></i>
					</button>
				</div>
			</div>
		</div>

		<!-- Edit item form -->
		<div v-else-if="mode === 'edit' && editingItem" :class="$style.form">
			<div :class="$style.backBtn" @click="mode = 'list'">
				<i class="ti ti-arrow-left"></i>
				<span>戻る</span>
			</div>

			<div :class="$style.formGroup">
				<label :class="$style.label">アイテム名</label>
				<input
					v-model="editingItem.name"
					:class="$style.input"
					type="text"
					maxlength="64"
				/>
			</div>

			<div :class="$style.formGroup">
				<label :class="$style.label">説明文</label>
				<textarea
					v-model="editingItem.flavorText"
					:class="$style.textarea"
					maxlength="500"
					rows="3"
				></textarea>
			</div>

			<div :class="$style.formGroup">
				<label :class="$style.label">画像</label>
				<div :class="$style.imageUpload">
					<div v-if="editingItem.imageUrl" :class="$style.imagePreview">
						<img :src="editingItem.imageUrl" alt="プレビュー" />
						<button :class="$style.removeImageBtn" @click="editingItem.imageUrl = null">
							<i class="ti ti-x"></i>
						</button>
					</div>
					<button v-else :class="$style.uploadBtn" @click="selectImageForEdit($event)">
						<i class="ti ti-upload"></i>
						<span>画像を選択</span>
					</button>
				</div>
			</div>

			<MkButton :class="$style.submitBtn" primary @click="updateItem" :disabled="updating">
				<i class="ti ti-check"></i> 変更を保存
			</MkButton>
		</div>
	</div>

	<div v-if="mode === 'create'" :class="$style.footer">
		<button :class="$style.footerBtn" @click="mode = 'list'">
			<i class="ti ti-list"></i>
			<span>作成済み一覧</span>
		</button>
	</div>
</div>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted } from 'vue';
import MkLoading from '@/components/global/MkLoading.vue';
import MkButton from '@/components/MkButton.vue';
import { selectFile } from '@/utility/drive.js';

interface CreatedItem {
	id: string;
	name: string;
	flavorText: string | null;
	itemType: string;
	imageUrl: string | null;
	createdAt: string;
}

interface DriveFile {
	id: string;
	url: string;
}

const emit = defineEmits<{
	(e: 'close'): void;
	(e: 'created', item: CreatedItem): void;
	(e: 'updated', item: CreatedItem): void;
}>();

const mode = ref<'create' | 'list' | 'edit'>('create');
const loading = ref(false);
const creating = ref(false);
const updating = ref(false);

// Create form
const itemName = ref('');
const itemFlavorText = ref('');
const itemType = ref('normal');
const selectedImage = ref<DriveFile | null>(null);

// List
const myItems = ref<CreatedItem[]>([]);
const maxAllowed = ref(50);

// Edit
const editingItem = ref<CreatedItem | null>(null);
const editImageFileId = ref<string | null>(null);

const canCreate = computed(() => {
	return itemName.value.trim().length > 0;
});

function getToken(): string | null {
	const account = localStorage.getItem('account');
	if (!account) return null;
	try {
		return JSON.parse(account).token;
	} catch {
		return null;
	}
}

function getTypeName(type: string): string {
	const typeNames: Record<string, string> = {
		normal: '通常',
		placeable: '設置可能',
		furniture: '家具',
		wallpaper: '壁紙',
		frame: '額縁',
	};
	return typeNames[type] ?? '不明';
}

async function fetchMyItems(): Promise<void> {
	try {
		loading.value = true;
		const res = await window.fetch('/api/noctown/item/my-creations', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			credentials: 'same-origin',
			body: JSON.stringify({ i: getToken() }),
		});

		if (res.ok) {
			const data = await res.json();
			myItems.value = data.items ?? [];
			maxAllowed.value = data.maxAllowed ?? 50;
		}
	} catch (e) {
		console.error('Failed to fetch my items:', e);
	} finally {
		loading.value = false;
	}
}

async function selectImage(ev: MouseEvent): Promise<void> {
	const file = await selectFile({
		multiple: false,
		anchorElement: ev.currentTarget as HTMLElement,
	});
	if (file) {
		selectedImage.value = {
			id: file.id,
			url: file.url,
		};
	}
}

async function selectImageForEdit(ev: MouseEvent): Promise<void> {
	const file = await selectFile({
		multiple: false,
		anchorElement: ev.currentTarget as HTMLElement,
	});
	if (file && editingItem.value) {
		editingItem.value.imageUrl = file.url;
		editImageFileId.value = file.id;
	}
}

async function createItem(): Promise<void> {
	if (!canCreate.value || creating.value) return;

	try {
		creating.value = true;
		const res = await window.fetch('/api/noctown/item/create', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			credentials: 'same-origin',
			body: JSON.stringify({
				i: getToken(),
				name: itemName.value.trim(),
				flavorText: itemFlavorText.value.trim() || null,
				itemType: itemType.value,
				imageFileId: selectedImage.value?.id ?? null,
			}),
		});

		if (res.ok) {
			const data = await res.json();
			emit('created', data.item);

			// Reset form
			itemName.value = '';
			itemFlavorText.value = '';
			itemType.value = 'normal';
			selectedImage.value = null;

			// Refresh list and switch to list view
			await fetchMyItems();
			mode.value = 'list';
		} else {
			const error = await res.json();
			if (error.error?.code === 'INSUFFICIENT_FUNDS') {
				alert('コインが足りません');
			} else if (error.error?.code === 'MAX_ITEMS_REACHED') {
				alert('作成可能なアイテム数の上限に達しています');
			} else {
				console.error('Create failed:', error);
			}
		}
	} catch (e) {
		console.error('Failed to create item:', e);
	} finally {
		creating.value = false;
	}
}

function editItem(item: CreatedItem): void {
	editingItem.value = { ...item };
	editImageFileId.value = null;
	mode.value = 'edit';
}

async function updateItem(): Promise<void> {
	if (!editingItem.value || updating.value) return;

	try {
		updating.value = true;
		const res = await window.fetch('/api/noctown/item/update-creation', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			credentials: 'same-origin',
			body: JSON.stringify({
				i: getToken(),
				itemId: editingItem.value.id,
				name: editingItem.value.name,
				flavorText: editingItem.value.flavorText,
				imageFileId: editImageFileId.value,
			}),
		});

		if (res.ok) {
			const data = await res.json();
			emit('updated', data);

			// Refresh list and go back
			await fetchMyItems();
			mode.value = 'list';
		} else {
			const error = await res.json();
			console.error('Update failed:', error);
		}
	} catch (e) {
		console.error('Failed to update item:', e);
	} finally {
		updating.value = false;
	}
}

onMounted(() => {
	fetchMyItems();
});

defineExpose({
	refresh: fetchMyItems,
});
</script>

<style lang="scss" module>
.panel {
	position: absolute;
	right: 16px;
	top: 60px;
	width: 340px;
	max-height: 520px;
	background: var(--MI_THEME-panel);
	border-radius: 8px;
	box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
	display: flex;
	flex-direction: column;
	z-index: 100;
}

.header {
	display: flex;
	align-items: center;
	gap: 8px;
	padding: 12px 16px;
	border-bottom: 1px solid var(--MI_THEME-divider);
	font-weight: bold;
}

.closeBtn {
	margin-left: auto;
	background: none;
	border: none;
	color: var(--MI_THEME-fg);
	cursor: pointer;
	padding: 4px;
	border-radius: 4px;

	&:hover {
		background: var(--MI_THEME-buttonHoverBg);
	}
}

.content {
	flex: 1;
	overflow-y: auto;
	padding: 16px;
}

.form {
	display: flex;
	flex-direction: column;
	gap: 16px;
}

.formGroup {
	display: flex;
	flex-direction: column;
	gap: 6px;
}

.label {
	font-size: 13px;
	font-weight: 500;
	color: var(--MI_THEME-fg);
}

.input, .textarea, .select {
	padding: 10px 12px;
	border: 1px solid var(--MI_THEME-divider);
	border-radius: 6px;
	background: var(--MI_THEME-bg);
	color: var(--MI_THEME-fg);
	font-size: 14px;

	&:focus {
		outline: none;
		border-color: var(--MI_THEME-accent);
	}
}

.textarea {
	resize: vertical;
	min-height: 60px;
}

.imageUpload {
	display: flex;
	flex-direction: column;
	gap: 8px;
}

.imagePreview {
	position: relative;
	width: 100%;
	aspect-ratio: 1;
	border-radius: 8px;
	overflow: hidden;
	background: var(--MI_THEME-bg);

	img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}
}

.removeImageBtn {
	position: absolute;
	top: 8px;
	right: 8px;
	width: 28px;
	height: 28px;
	border-radius: 50%;
	background: rgba(0, 0, 0, 0.6);
	color: white;
	border: none;
	cursor: pointer;
	display: flex;
	align-items: center;
	justify-content: center;

	&:hover {
		background: rgba(0, 0, 0, 0.8);
	}
}

.uploadBtn {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	gap: 8px;
	padding: 24px;
	border: 2px dashed var(--MI_THEME-divider);
	border-radius: 8px;
	background: none;
	color: var(--MI_THEME-fg);
	cursor: pointer;
	transition: border-color 0.15s, background 0.15s;

	&:hover {
		border-color: var(--MI_THEME-accent);
		background: var(--MI_THEME-accentedBg);
	}
}

.costInfo {
	display: flex;
	align-items: center;
	gap: 6px;
	padding: 12px;
	background: var(--MI_THEME-bg);
	border-radius: 6px;
	font-size: 13px;
	color: #ffc107;
}

.submitBtn {
	width: 100%;
}

.listView {
	display: flex;
	flex-direction: column;
	gap: 12px;
}

.listHeader {
	display: flex;
	align-items: center;
	justify-content: space-between;
	font-size: 13px;
}

.newBtn {
	display: flex;
	align-items: center;
	gap: 4px;
	padding: 6px 12px;
	border: none;
	border-radius: 6px;
	background: var(--MI_THEME-accent);
	color: white;
	font-size: 12px;
	cursor: pointer;

	&:hover {
		opacity: 0.9;
	}
}

.loading, .empty {
	display: flex;
	align-items: center;
	justify-content: center;
	min-height: 100px;
	color: var(--MI_THEME-fg);
	opacity: 0.6;
}

.itemList {
	display: flex;
	flex-direction: column;
	gap: 8px;
}

.itemCard {
	display: flex;
	align-items: center;
	gap: 12px;
	padding: 10px;
	border-radius: 8px;
	background: var(--MI_THEME-bg);
	cursor: pointer;
	transition: background 0.15s;

	&:hover {
		background: var(--MI_THEME-buttonHoverBg);
	}
}

.itemImage {
	width: 48px;
	height: 48px;
	border-radius: 6px;
	background: var(--MI_THEME-panel);
	display: flex;
	align-items: center;
	justify-content: center;
	overflow: hidden;
	font-size: 20px;
	color: var(--MI_THEME-fg);
	opacity: 0.5;

	img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}
}

.itemInfo {
	flex: 1;
	min-width: 0;
}

.itemName {
	font-size: 14px;
	font-weight: 500;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.itemType {
	font-size: 11px;
	opacity: 0.6;
}

.editBtn {
	padding: 8px;
	background: none;
	border: none;
	color: var(--MI_THEME-fg);
	cursor: pointer;
	opacity: 0.5;

	&:hover {
		opacity: 1;
	}
}

.backBtn {
	display: flex;
	align-items: center;
	gap: 6px;
	padding: 8px 0;
	color: var(--MI_THEME-accent);
	cursor: pointer;
	font-size: 13px;

	&:hover {
		text-decoration: underline;
	}
}

.footer {
	padding: 12px 16px;
	border-top: 1px solid var(--MI_THEME-divider);
}

.footerBtn {
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 6px;
	width: 100%;
	padding: 10px;
	background: var(--MI_THEME-bg);
	border: none;
	border-radius: 6px;
	color: var(--MI_THEME-fg);
	cursor: pointer;
	font-size: 13px;

	&:hover {
		background: var(--MI_THEME-buttonHoverBg);
	}
}
</style>
