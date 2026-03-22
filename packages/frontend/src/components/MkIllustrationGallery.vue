<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div class="illustration-gallery">
	<div v-if="expandedItems.length === 0 && !fetching" class="empty">
		<div class="icon"><i class="ti ti-photo-off"></i></div>
		<div>{{ i18n.ts.noNotes }}</div>
	</div>
	<div v-else class="gallery-grid">
		<div
			v-for="item in expandedItems"
			:key="`${item.note.id}-${item.fileIndex}`"
			class="gallery-item"
			:class="{ 'is-sensitive': isSensitiveNote(item.note) }"
			@click="openNote(item.note.id)"
			@contextmenu.prevent="onContextMenu($event, item)"
			@touchstart="onTouchStart($event, item)"
			@touchend="onTouchEnd"
			@touchmove="onTouchMove"
		>
			<img
				:src="item.file.thumbnailUrl || item.file.url"
				:alt="item.note.text || 'illustration'"
				class="thumbnail"
				:class="{ 'blur': shouldBlur(item.note) }"
			/>
			<div v-if="shouldBlur(item.note)" class="sensitive-indicator">
				<i class="ti ti-eye-exclamation"></i>
				<span>{{ i18n.ts.sensitive }}</span>
			</div>
		</div>
	</div>
	<div v-show="fetching" class="loading">
		<MkLoading/>
	</div>
	<div v-show="more" class="more" style="margin-top: 16px;">
		<MkButton :disabled="fetching || moreFetching" :style="{ width: '100%' }" @click="fetchMore">
			<template v-if="!fetching && !moreFetching">{{ i18n.ts.loadMore }}</template>
			<template v-else><MkLoading :em="true"/></template>
		</MkButton>
	</div>
</div>
</template>

<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue';
import * as Misskey from 'misskey-js';
import MkButton from '@/components/MkButton.vue';
import MkLoading from '@/components/global/MkLoading.vue';
import { i18n } from '@/i18n.js';
import { useRouter } from '@/router.js';
import { prefer } from '@/preferences.js';
import * as os from '@/os.js';
import { misskeyApi } from '@/utility/misskey-api.js';
import { $i } from '@/i.js';

const props = defineProps<{
	paginator: any; // IPaginatorインターフェース
}>();

const emit = defineEmits<{
	(e: 'beforeNavigate'): void;
}>();

// ギャラリーアイテムの型定義
type GalleryItem = {
	note: Misskey.entities.Note;
	file: Misskey.entities.DriveFile;
	fileIndex: number;
};

const router = useRouter();
const items = computed(() => props.paginator.items.value);
const fetching = computed(() => props.paginator.fetching.value);
const moreFetching = computed(() => props.paginator.fetchingOlder.value);
const more = computed(() => props.paginator.canFetchOlder.value);

// ハイライトから除外されたファイルIDを保持
const excludedFileIds = ref<Set<string>>(new Set());

// ノートの複数ファイルを個別のアイテムに展開
const expandedItems = computed<GalleryItem[]>(() => {
	const expanded: GalleryItem[] = [];
	const seenFileIds = new Set<string>(); // 現在の計算で既に見たファイルID

	for (const note of items.value) {
		if (note.files && note.files.length > 0) {
			// 各ファイルを個別のギャラリーアイテムとして追加
			for (let i = 0; i < note.files.length; i++) {
				const fileId = note.files[i].id;

				// 除外されたファイルはスキップ
				if (excludedFileIds.value.has(fileId)) {
					continue;
				}

				// 既に表示済みのファイルはスキップ（重複防止）
				if (seenFileIds.has(fileId)) {
					continue;
				}

				// このファイルを見たことを記録
				seenFileIds.add(fileId);

				expanded.push({
					note: note,
					file: note.files[i],
					fileIndex: i,
				});
			}
		}
	}
	return expanded;
});

// 長押し検出用の状態
const longPressTimer = ref<number | null>(null);
const longPressThreshold = 500; // 500msで長押し判定
let touchMoved = false;

const fetchMore = async () => {
	await props.paginator.fetchOlder();
};

const init = async () => {
	await props.paginator.init();
};

const openNote = (noteId: string) => {
	// 親コンポーネントにナビゲーション前イベントを通知
	emit('beforeNavigate');
	router.push(`/notes/${noteId}` as any);
};

const isSensitiveNote = (note: Misskey.entities.Note): boolean => {
	// ノート自体のcwフラグもチェック
	if (note.cw != null) return true;
	// ファイルのisSensitiveフラグもチェック
	if (!note.files || note.files.length === 0) return false;
	return note.files.some(file => file.isSensitive);
};

const shouldBlur = (note: Misskey.entities.Note): boolean => {
	if (!isSensitiveNote(note)) return false;
	// 管理人またはモデレーターの場合はぼかしをなくす
	if ($i && ($i.isAdmin || $i.isModerator)) return false;
	// NSFW設定に基づいてぼかしを適用
	// force: 常にぼかし, ignore: 常に表示, それ以外: sensitiveならぼかし
	return prefer.s.nsfw === 'force' || (isSensitiveNote(note) && prefer.s.nsfw !== 'ignore');
};

const showMenu = async (ev: MouseEvent | TouchEvent, item: GalleryItem) => {
	const fileId = item.file.id;
	const imageUrl = item.file.url;

	const menu: {
		text: string;
		icon: string;
		action: () => Promise<void>;
	}[] = [];

	// すべてのユーザーに「画像を保存」を表示
	menu.push({
		text: '画像を保存',
		icon: 'ti ti-download',
		action: async () => {
			try {
				// 画像をダウンロード
				const response = await fetch(imageUrl);
				const blob = await response.blob();
				const url = window.URL.createObjectURL(blob);
				const a = document.createElement('a');
				a.href = url;
				a.download = item.file.name || 'illustration.jpg';
				document.body.appendChild(a);
				a.click();
				document.body.removeChild(a);
				window.URL.revokeObjectURL(url);
				os.success();
			} catch (error) {
				console.error('Failed to download image:', error);
				os.alert({
					type: 'error',
					text: '画像の保存に失敗しました',
				});
			}
		},
	});

	// 管理者・モデレーターには除外メニューも表示
	if ($i && ($i.isAdmin || $i.isModerator)) {
		menu.push({
			text: 'このイラストをハイライトから除外する',
			icon: 'ti ti-eye-off',
			action: async () => {
				const { canceled } = await os.confirm({
					type: 'warning',
					text: 'このイラストをハイライトから除外しますか？',
				});

				if (canceled) return;

				try {
					await misskeyApi('drive/files/toggle-illustration-highlight-exclusion' as any, {
						fileId: fileId,
						excluded: true,
					});

					os.success();

					// 除外されたファイルIDを追加（リロードせずにフロントエンドでフィルタリング）
					excludedFileIds.value.add(fileId);
				} catch (error) {
					console.error('Failed to exclude illustration:', error);
					os.alert({
						type: 'error',
						text: '除外に失敗しました',
					});
				}
			},
		});
	}

	// スマホ用のドロワーメニューを表示（popupMenuを使用）
	os.popupMenu(menu, ev instanceof MouseEvent ? ev.target as HTMLElement : undefined);
};

// PC用の右クリックメニュー
const onContextMenu = async (ev: MouseEvent, item: GalleryItem) => {
	ev.preventDefault();
	await showMenu(ev, item);
};

// タッチ開始時
const onTouchStart = (ev: TouchEvent, item: GalleryItem) => {
	touchMoved = false;
	// 長押しタイマー開始
	longPressTimer.value = window.setTimeout(() => {
		if (!touchMoved) {
			// 長押し判定されたのでドロワーメニューを表示
			ev.preventDefault();
			showMenu(ev, item);
		}
	}, longPressThreshold);
};

// タッチ終了時
const onTouchEnd = () => {
	// タイマーをクリア
	if (longPressTimer.value !== null) {
		clearTimeout(longPressTimer.value);
		longPressTimer.value = null;
	}
};

// タッチ移動時
const onTouchMove = () => {
	// スクロールなどで移動した場合は長押しキャンセル
	touchMoved = true;
	if (longPressTimer.value !== null) {
		clearTimeout(longPressTimer.value);
		longPressTimer.value = null;
	}
};

onMounted(() => {
	init();
});
</script>

<style lang="scss" scoped>
.illustration-gallery {
	.empty {
		text-align: center;
		padding: 64px 16px;
		color: var(--MI_THEME-fg);
		opacity: 0.5;

		.icon {
			font-size: 48px;
			margin-bottom: 16px;

			i {
				opacity: 0.5;
			}
		}
	}

	.gallery-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
		gap: 8px;
		padding: 0;

		@media (min-width: 500px) {
			grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
			gap: 12px;
		}

		.gallery-item {
			position: relative;
			aspect-ratio: 1;
			overflow: hidden;
			border-radius: 8px;
			cursor: pointer;
			background: var(--MI_THEME-panel);
			transition: all 0.2s ease;

			&:hover {
				transform: translateY(-2px);
				box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);

				.thumbnail:not(.blur) {
					transform: scale(1.05);
				}
			}

			.thumbnail {
				width: 100%;
				height: 100%;
				object-fit: cover;
				transition: transform 0.3s ease;

				&.blur {
					filter: blur(12px) brightness(0.9);
				}
			}

			.sensitive-indicator {
				position: absolute;
				top: 50%;
				left: 50%;
				transform: translate(-50%, -50%);
				display: flex;
				flex-direction: column;
				align-items: center;
				gap: 8px;
				color: white;
				text-shadow: 0 2px 8px rgba(0, 0, 0, 0.8);
				pointer-events: none;

				i {
					font-size: 32px;
				}

				span {
					font-size: 14px;
					font-weight: bold;
				}
			}

			.file-count {
				position: absolute;
				top: 8px;
				right: 8px;
				background: rgba(0, 0, 0, 0.7);
				color: white;
				padding: 4px 8px;
				border-radius: 12px;
				font-size: 0.85em;
				display: flex;
				align-items: center;
				gap: 4px;
				backdrop-filter: blur(4px);

				i {
					font-size: 1em;
				}
			}
		}
	}

	.loading {
		text-align: center;
		padding: 32px;
	}
}
</style>
