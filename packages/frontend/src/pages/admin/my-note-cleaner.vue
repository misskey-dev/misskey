<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<PageWithHeader :actions="headerActions" :tabs="headerTabs">
	<div class="_spacer" style="--MI_SPACER-w: 800px;">
		<div class="_gaps">
			<div class="_panel" :class="$style.description">
				<h2 :class="$style.title">自分のノート検索</h2>
				<p>
					自分のノートだけをキーワードで検索する管理人向けの実験機能です。
				</p>
				<p>
					このページではまだ削除は行いません。まずは検索結果の確認だけを行います。
				</p>
			</div>

			<div class="_panel" :class="$style.searchPanel">
				<MkInput v-model="searchQuery" type="search">
					<template #label>検索ワード</template>
				</MkInput>

				<div :class="$style.searchActions">
					<MkButton primary rounded :disabled="searchQuery.trim().length < 2 || searching" @click="searchNotes">
						検索する
					</MkButton>
				</div>

				<p :class="$style.note">
					サーバー負荷を避けるため、2文字以上の検索ワードで、ボタンを押した時だけ検索します。
				</p>
			</div>

			<MkFoldableSection>
				<template #header>検索結果</template>

				<div class="_gaps_s">
					<div v-if="searched && results.length === 0" class="_panel" :class="$style.empty">
						該当するノートは見つかりませんでした。
					</div>

					<div v-for="note in results" :key="note.id" class="_panel" :class="$style.noteCard">
						<div :class="$style.noteHeader">
							<MkTime :time="note.createdAt" mode="detail"/>

							<div :class="$style.noteActions">
								<MkA :to="`/notes/${note.id}`">ノートを開く</MkA>
								<MkButton danger rounded small @click="deleteNote(note)">
									削除
								</MkButton>
							</div>
						</div>

						<div :class="$style.noteText">
							{{ note.text ?? '本文なし' }}
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
import MkInput from '@/components/MkInput.vue';
import MkButton from '@/components/MkButton.vue';
import MkFoldableSection from '@/components/MkFoldableSection.vue';
import { misskeyApi } from '@/utility/misskey-api.js';
import { definePage } from '@/page.js';
import { $i } from '@/i.js';
import * as os from '@/os.js';

const searchQuery = ref('');
const searching = ref(false);
const searched = ref(false);
const results = ref<any[]>([]);

async function searchNotes() {
	const query = searchQuery.value.trim();

	if (query.length < 2) {
		await os.alert({
			type: 'warning',
			title: '検索ワードが短すぎます',
			text: '2文字以上で検索してください。',
		});
		return;
	}

	if ($i == null) {
		await os.alert({
			type: 'error',
			title: 'ログイン情報がありません',
			text: 'ログイン中のユーザー情報を取得できませんでした。',
		});
		return;
	}

	searching.value = true;
	searched.value = false;

	try {
		results.value = await misskeyApi('notes/search', {
			query,
			userId: $i.id,
			host: '.',
			limit: 50,
		});
		searched.value = true;
	} catch (err: any) {
		console.error(err);

		const message = [
			err?.message,
			err?.id,
			err?.code,
			err?.kind,
			err?.info ? JSON.stringify(err.info) : null,
			JSON.stringify(err),
		].filter(x => x != null && x !== '').join('\n');

		await os.alert({
			type: 'error',
			title: '検索失敗',
			text: `ノート検索中にエラーが発生しました。\n\n${message || String(err)}`,
		});
	} finally {
		searching.value = false;
	}
}

async function deleteNote(note: any) {
	const text = note.text ?? '本文なし';
	const preview = text.length > 120 ? `${text.slice(0, 120)}...` : text;

	const { canceled } = await os.confirm({
		type: 'warning',
		title: 'このノートを削除しますか？',
		text: `この操作は元に戻せません。\n\n${preview}`,
	});

	if (canceled) return;

	try {
		await misskeyApi('notes/delete', {
			noteId: note.id,
		});

		results.value = results.value.filter(x => x.id !== note.id);

		await os.alert({
			type: 'success',
			title: '削除しました',
			text: 'ノートを削除しました。',
		});
	} catch (err: any) {
		console.error(err);

		const message = [
			err?.message,
			err?.id,
			err?.code,
			err?.kind,
			err?.info ? JSON.stringify(err.info) : null,
			JSON.stringify(err),
		].filter(x => x != null && x !== '').join('\n');

		await os.alert({
			type: 'error',
			title: '削除失敗',
			text: `ノート削除中にエラーが発生しました。\n\n${message || String(err)}`,
		});
	}
}

const headerActions = computed(() => []);

const headerTabs = computed(() => []);

definePage(() => ({
	title: '自分のノート検索',
	icon: 'ti ti-search',
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

.searchPanel {
	padding: 16px;
}

.searchActions {
	display: flex;
	justify-content: flex-end;
	margin-top: 12px;
}

.note {
	margin: 12px 0 0;
	color: var(--MI_THEME-fg);
	opacity: 0.7;
	font-size: 0.9em;
	line-height: 1.7;
}

.empty {
	padding: 16px;
	color: var(--MI_THEME-fg);
	opacity: 0.7;
}

.noteCard {
	padding: 14px 16px;
}

.noteHeader {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 12px;
	margin-bottom: 10px;
	font-size: 0.9em;
}

.noteText {
	white-space: pre-wrap;
	line-height: 1.7;
	word-break: break-word;
}

.noteActions {
	display: flex;
	align-items: center;
	gap: 8px;
}
</style>
