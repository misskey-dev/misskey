<template>
	<MkSpacer :contentMax="720">
		<div class="_gaps_m">
			<div :class="$style.header">
				<div>
					<p :class="$style.badge">Creator Site</p>
					<h1 :class="$style.title">活動ページ設定</h1>
					<p :class="$style.description">
						活動者向けの公式ホームページ風ページに表示する内容を設定できます。
						入力した内容は活動ページに保存され、外部の人にも見える公開ページに反映されます。
					</p>
				</div>
			</div>

			<MkFolder defaultOpen>
				<template #label>基本情報</template>

				<div class="_gaps_m">
					<MkInput v-model="siteTitle">
						<template #label>ページタイトル</template>
						<template #caption>例：nano official site</template>
					</MkInput>

					<MkTextarea v-model="catchphrase">
						<template #label>キャッチコピー</template>
						<template #caption>活動ページの上の方に表示する短い紹介文です。</template>
					</MkTextarea>
				</div>
			</MkFolder>

			<MkFolder>
				<template #label>活動状況</template>

				<div class="_gaps_m">
					<MkInput v-model="commissionStatus">
						<template #label>依頼受付状況</template>
						<template #caption>例：受付中 / 停止中 / 要相談</template>
					</MkInput>

					<MkInput v-model="collabStatus">
						<template #label>コラボ受付状況</template>
						<template #caption>例：相談OK / 現在停止中</template>
					</MkInput>

					<MkInput v-model="fanartStatus">
						<template #label>ファンアート</template>
						<template #caption>例：歓迎 / 条件付きOK / 事前確認希望</template>
					</MkInput>
				</div>
			</MkFolder>

			<MkFolder>
				<template #label>ガイドライン</template>

				<div class="_gaps_m">
					<MkInput v-model="guidelineUrl">
						<template #label>ガイドラインURL</template>
						<template #caption>二次創作・依頼・納品物の扱いなどをまとめたページのURLを入れます。</template>
					</MkInput>

					<MkTextarea v-model="guidelineText">
						<template #label>ガイドライン補足</template>
						<template #caption>活動ページ上に表示する短い補足文です。</template>
					</MkTextarea>
				</div>
			</MkFolder>

			<div :class="$style.actions">
<MkButton primary :disabled="loading || saving" @click="save">
	{{ saving ? '保存中...' : '保存する' }}
</MkButton>
				<MkButton :to="previewPath">
					活動ページを見る
				</MkButton>
			</div>
		</div>
	</MkSpacer>
</template>

<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue';
import MkButton from '@/components/MkButton.vue';
import MkFolder from '@/components/MkFolder.vue';
import MkInput from '@/components/MkInput.vue';
import MkTextarea from '@/components/MkTextarea.vue';
import { misskeyApi } from '@/utility/misskey-api.js';
import { $i } from '@/i.js';
import * as os from '@/os.js';

const siteTitle = ref('');
const catchphrase = ref('');
const commissionStatus = ref('受付中');
const collabStatus = ref('相談OK');
const fanartStatus = ref('歓迎');
const guidelineUrl = ref('');
const guidelineText = ref('');

const loading = ref(true);
const saving = ref(false);

const previewPath = computed(() => {
	return $i ? `/site/@${$i.username}` : '/site/@unknown';
});

async function load(): Promise<void> {
	if ($i == null) {
		loading.value = false;
		return;
	}

	loading.value = true;

	try {
		const site = await misskeyApi('creator-site/show', {
			userId: $i.id,
		});

		if (site != null) {
			siteTitle.value = site.title ?? '';
			catchphrase.value = site.catchphrase ?? '';
			commissionStatus.value = site.commissionStatus ?? '受付中';
			collabStatus.value = site.collabStatus ?? '相談OK';
			fanartStatus.value = site.fanartStatus ?? '歓迎';
			guidelineUrl.value = site.guidelineUrl ?? '';
			guidelineText.value = site.guidelineText ?? '';
		}
	} catch (err) {
		console.error(err);
		os.alert({
			type: 'error',
			title: '読み込みに失敗しました',
			text: '活動ページ設定を読み込めませんでした。',
		});
	} finally {
		loading.value = false;
	}
}

async function save(): Promise<void> {
	if ($i == null || saving.value) return;

	saving.value = true;

	try {
		await misskeyApi('creator-site/update', {
			title: siteTitle.value,
			catchphrase: catchphrase.value,
			commissionStatus: commissionStatus.value,
			collabStatus: collabStatus.value,
			fanartStatus: fanartStatus.value,
			guidelineUrl: guidelineUrl.value,
			guidelineText: guidelineText.value,
		});

		os.toast('活動ページ設定を保存しました');
	} catch (err) {
		console.error(err);
		os.alert({
			type: 'error',
			title: '保存に失敗しました',
			text: '入力内容を確認して、もう一度お試しください。',
		});
	} finally {
		saving.value = false;
	}
}

onMounted(() => {
	load();
});
</script>

<style lang="scss" module>
.header {
	padding: 24px;
	border: solid 1px var(--MI_THEME-divider);
	border-radius: 20px;
	background:
		radial-gradient(circle at top left, rgba(255, 182, 193, 0.35), transparent 34%),
		linear-gradient(135deg, var(--MI_THEME-panel), var(--MI_THEME-bg));
}

.badge {
	margin: 0 0 8px;
	color: var(--MI_THEME-accent);
	font-size: 0.82em;
	font-weight: 800;
	letter-spacing: 0.08em;
	text-transform: uppercase;
}

.title {
	margin: 0;
	font-size: 1.8rem;
}

.description {
	margin: 10px 0 0;
	color: var(--MI_THEME-fg);
	opacity: 0.72;
	line-height: 1.8;
}

.actions {
	display: flex;
	flex-wrap: wrap;
	gap: 12px;
	justify-content: flex-end;
}
</style>
