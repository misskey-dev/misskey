<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div class="illustration-gallery">
	<div v-if="items.length === 0 && !fetching" class="empty">
		<div class="icon"><i class="ti ti-photo-off"></i></div>
		<div>{{ i18n.ts.noNotes }}</div>
	</div>
	<div v-else class="gallery-grid">
		<div
			v-for="note in items"
			:key="note.id"
			class="gallery-item"
			:class="{ 'is-sensitive': isSensitiveNote(note) }"
			@click="openNote(note.id)"
			@contextmenu.prevent="onContextMenu($event, note)"
		>
			<img
				v-if="note.files && note.files.length > 0"
				:src="note.files[0].thumbnailUrl || note.files[0].url"
				:alt="note.text || 'illustration'"
				class="thumbnail"
				:class="{ 'blur': shouldBlur(note) }"
			/>
			<div v-if="shouldBlur(note)" class="sensitive-indicator">
				<i class="ti ti-eye-exclamation"></i>
				<span>{{ i18n.ts.sensitive }}</span>
			</div>
			<div v-if="note.files && note.files.length > 1" class="file-count">
				<i class="ti ti-photos"></i>
				{{ note.files.length }}
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
import { computed, onMounted } from 'vue';
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

const router = useRouter();
const items = computed(() => props.paginator.items.value);
const fetching = computed(() => props.paginator.fetching.value);
const moreFetching = computed(() => props.paginator.fetchingOlder.value);
const more = computed(() => props.paginator.canFetchOlder.value);

const fetchMore = async () => {
	await props.paginator.fetchOlder();
};

const init = async () => {
	await props.paginator.init();
};

const openNote = (noteId: string) => {
	router.push(`/notes/${noteId}`);
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
	// NSFW設定に基づいてぼかしを適用
	// force: 常にぼかし, ignore: 常に表示, それ以外: sensitiveならぼかし
	return prefer.s.nsfw === 'force' || (isSensitiveNote(note) && prefer.s.nsfw !== 'ignore');
};

const onContextMenu = async (ev: MouseEvent, note: Misskey.entities.Note) => {
	// 管理者・モデレーターのみ表示
	if (!$i || (!$i.isAdmin && !$i.isModerator)) {
		return;
	}

	if (!note.files || note.files.length === 0) {
		return;
	}

	const fileId = note.files[0].id;

	const menu = [
		{
			text: 'このイラストをハイライトから除外する',
			icon: 'ti ti-eye-off',
			action: async () => {
				const { canceled } = await os.confirm({
					type: 'warning',
					text: 'このイラストをハイライトから除外しますか？',
				});

				if (canceled) return;

				try {
					await misskeyApi('drive/files/toggle-illustration-highlight-exclusion', {
						fileId: fileId,
						excluded: true,
					});

					os.success();

					// リストを再読み込み
					props.paginator.reload();
				} catch (error) {
					console.error('Failed to exclude illustration:', error);
					os.alert({
						type: 'error',
						text: '除外に失敗しました',
					});
				}
			},
		},
	];

	os.contextMenu(menu, ev);
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
