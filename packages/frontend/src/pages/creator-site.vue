<template>
	<MkSpacer :contentMax="980">
		<div :class="$style.root">
			<section :class="$style.hero">
				<div :class="$style.heroOverlay">
					<p :class="$style.badge">活動ページ・プレビュー</p>
					<h1 :class="$style.title">{{ siteTitle }}</h1>
<p :class="$style.catch">
	{{ siteCatchphrase }}
</p>

<div :class="$style.heroActions">
	<a :class="$style.primaryButton" href="#links">リンクを見る</a>
	<a :class="$style.secondaryButton" href="#guideline">ガイドライン</a>
	<a v-if="isMySite" :class="$style.secondaryButton" :href="editPath">活動ページを編集</a>
</div>
				</div>
			</section>

			<section :class="$style.profileCard">
<img
	v-if="user?.avatarUrl"
	:class="$style.avatarImage"
	:src="user.avatarUrl"
	alt=""
>
<div v-else :class="$style.avatar">🎧</div>

<div>
	<p :class="$style.label">Creator</p>
	<h2 :class="$style.profileName">{{ displayName }}</h2>
	<p :class="$style.acct">@{{ acct }}</p>
	<p :class="$style.profileText">
		{{ user?.description || 'ここには活動者の自己紹介が入ります。歌い手、配信者、絵師、ボカロP、作曲者など、活動すきーの利用者が自分の活動内容をわかりやすくまとめられる場所にします。' }}
	</p>
</div>				
			</section>

			<div :class="$style.grid">
				<section :class="$style.panel">
					<p :class="$style.label">Status</p>
					<h2 :class="$style.sectionTitle">現在の活動状況</h2>
					<div :class="$style.statusList">
						<div :class="$style.statusItem">
							<span>依頼受付</span>
							<strong>{{ site?.commissionStatus || '受付中' }}</strong>
						</div>
						<div :class="$style.statusItem">
							<span>コラボ</span>
							<strong>{{ site?.collabStatus || '相談OK' }}</strong>
						</div>
						<div :class="$style.statusItem">
							<span>ファンアート</span>
							<strong>{{ site?.fanartStatus || '歓迎' }}</strong>
						</div>
					</div>
				</section>

				<section :class="$style.panel">
					<p :class="$style.label">News</p>
					<h2 :class="$style.sectionTitle">お知らせ</h2>
					<ul :class="$style.newsList">
						<li>
							<span>2026.05.10</span>
							活動ページ機能のプレビューを作成しました。
						</li>
						<li>
							<span>2026.05.10</span>
							今後、リンク集やガイドライン表示に対応予定です。
						</li>
					</ul>
				</section>
			</div>

<section id="links" :class="$style.panel">
	<p :class="$style.label">Links</p>
	<h2 :class="$style.sectionTitle">活動リンク</h2>
	<div :class="$style.linkGrid">
		<a :class="$style.linkButton" :href="profilePath">
			プロフィール
		</a>
		<a :class="$style.linkButton" :href="`${profilePath}/notes`">
			ノート
		</a>
		<a :class="$style.linkButton" :href="`${profilePath}/pages`">
			Pages
		</a>
		<a :class="$style.linkButton" :href="`${profilePath}/gallery`">
			ギャラリー
		</a>
	</div>
</section>

			<section id="guideline" :class="$style.panel">
				<p :class="$style.label">Guideline</p>
				<h2 :class="$style.sectionTitle">ガイドライン</h2>
<p :class="$style.bodyText">
	{{ site?.guidelineText || 'ここには、二次創作・ファンアート・依頼・納品物の扱いなど、活動者ごとの個人ガイドラインを表示できるようにする予定です。' }}
</p>

<a
	v-if="site?.guidelineUrl"
	:class="$style.guidelineButton"
	:href="site.guidelineUrl"
	target="_blank"
	rel="noopener noreferrer"
>
	ガイドラインを開く
</a>
			</section>
		</div>
	</MkSpacer>
</template>

<script lang="ts" setup>
import { computed, ref, watch } from 'vue';
import * as Misskey from 'misskey-js';
import { misskeyApi } from '@/utility/misskey-api.js';
import { $i } from '@/i.js';

const props = defineProps<{
	acct?: string;
}>();

const acct = computed(() => {
	return props.acct?.replace(/^@/, '') ?? 'unknown';
});

const user = ref<Misskey.entities.UserDetailed | null>(null);

type CreatorSite = {
	id: string;
	userId: string;
	title: string | null;
	catchphrase: string | null;
	commissionStatus: string | null;
	collabStatus: string | null;
	fanartStatus: string | null;
	guidelineUrl: string | null;
	guidelineText: string | null;
	createdAt: string;
	updatedAt: string;
};

const site = ref<CreatorSite | null>(null);

const displayName = computed(() => {
	return user.value?.name || acct.value;
});

const siteTitle = computed(() => {
	return site.value?.title || `${displayName.value} official site`;
});

const siteCatchphrase = computed(() => {
	return site.value?.catchphrase || '作曲・創作・活動のお知らせをまとめる、活動者向けの公式ホームページ風ページです。';
});

const profilePath = computed(() => {
	return `/@${acct.value}`;
});

const isMySite = computed(() => {
	return $i != null && user.value != null && $i.id === user.value.id;
});

const editPath = computed(() => {
	return `/settings/creator-site`;
});

async function fetchUser(): Promise<void> {
	user.value = null;
	site.value = null;

	if (props.acct == null) return;

	const normalizedAcct = props.acct.replace(/^@/, '');
	const [username, host] = normalizedAcct.split('@');

	try {
		const res = await misskeyApi('users/show', {
			username,
			host: host || null,
		});

		user.value = res;

		site.value = await misskeyApi('creator-site/show', {
			userId: res.id,
		});
	} catch {
		user.value = null;
		site.value = null;
	}
}

watch(() => props.acct, fetchUser, {
	immediate: true,
});
</script>

<style lang="scss" module>
.root {
	display: flex;
	flex-direction: column;
	gap: 18px;
	padding: 24px 0 40px;
}

.hero {
	overflow: hidden;
	border-radius: 28px;
	background:
		radial-gradient(circle at top left, rgba(255, 182, 193, 0.45), transparent 34%),
		radial-gradient(circle at bottom right, rgba(135, 206, 250, 0.35), transparent 34%),
		linear-gradient(135deg, var(--MI_THEME-panel), var(--MI_THEME-bg));
	border: solid 1px var(--MI_THEME-divider);
	box-shadow: 0 18px 50px rgba(0, 0, 0, 0.16);
}

.heroOverlay {
	padding: 52px 36px;
}

.badge {
	display: inline-flex;
	align-items: center;
	width: fit-content;
	margin: 0 0 14px;
	padding: 6px 12px;
	border-radius: 999px;
	background: color-mix(in srgb, var(--MI_THEME-accent) 14%, transparent);
	color: var(--MI_THEME-accent);
	font-size: 0.86em;
	font-weight: 700;
}

.title {
	margin: 0;
	font-size: clamp(2.1rem, 7vw, 4.8rem);
	line-height: 1;
	letter-spacing: -0.05em;
}

.catch {
	max-width: 680px;
	margin: 18px 0 0;
	color: var(--MI_THEME-fg);
	opacity: 0.82;
	font-size: 1.08em;
	line-height: 1.8;
}

.heroActions {
	display: flex;
	flex-wrap: wrap;
	gap: 12px;
	margin-top: 28px;
}

.primaryButton,
.secondaryButton,
.linkButton {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	min-height: 42px;
	padding: 0 18px;
	border-radius: 999px;
	text-decoration: none;
	font-weight: 700;
}

.primaryButton {
	background: var(--MI_THEME-accent);
	color: #fff;
}

.secondaryButton,
.linkButton {
	background: var(--MI_THEME-buttonBg);
	color: var(--MI_THEME-fg);
}

.profileCard,
.panel {
	border: solid 1px var(--MI_THEME-divider);
	border-radius: 24px;
	background: var(--MI_THEME-panel);
}

.profileCard {
	display: grid;
	grid-template-columns: auto 1fr;
	gap: 18px;
	align-items: center;
	padding: 24px;
}

.avatar {
	display: grid;
	place-items: center;
	width: 76px;
	height: 76px;
	border-radius: 24px;
	background: color-mix(in srgb, var(--MI_THEME-accent) 18%, transparent);
	font-size: 2rem;
}

.avatarImage {
	display: block;
	width: 76px;
	height: 76px;
	border-radius: 24px;
	object-fit: cover;
	background: var(--MI_THEME-buttonBg);
}

.acct {
	margin: 4px 0 0;
	color: var(--MI_THEME-fg);
	opacity: 0.62;
	font-size: 0.92em;
}

.label {
	margin: 0 0 6px;
	color: var(--MI_THEME-accent);
	font-size: 0.8em;
	font-weight: 800;
	letter-spacing: 0.08em;
	text-transform: uppercase;
}

.profileName,
.sectionTitle {
	margin: 0;
}

.profileText,
.bodyText {
	margin: 10px 0 0;
	color: var(--MI_THEME-fg);
	opacity: 0.78;
	line-height: 1.8;
}

.grid {
	display: grid;
	grid-template-columns: repeat(2, minmax(0, 1fr));
	gap: 18px;
}

.panel {
	padding: 24px;
}

.statusList {
	display: grid;
	gap: 10px;
	margin-top: 16px;
}

.statusItem {
	display: flex;
	justify-content: space-between;
	gap: 12px;
	padding: 12px 14px;
	border-radius: 14px;
	background: var(--MI_THEME-bg);
}

.statusItem span {
	opacity: 0.72;
}

.newsList {
	display: grid;
	gap: 10px;
	margin: 16px 0 0;
	padding: 0;
	list-style: none;
}

.newsList li {
	line-height: 1.7;
}

.newsList span {
	display: block;
	color: var(--MI_THEME-accent);
	font-size: 0.86em;
	font-weight: 700;
}

.linkGrid {
	display: flex;
	flex-wrap: wrap;
	gap: 12px;
	margin-top: 16px;
}

@media (max-width: 700px) {
	.heroOverlay {
		padding: 38px 22px;
	}

	.profileCard {
		grid-template-columns: 1fr;
	}

	.grid {
		grid-template-columns: 1fr;
	}
}

.guidelineButton {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	min-height: 38px;
	margin-top: 16px;
	padding: 0 16px;
	border-radius: 999px;
	background: var(--MI_THEME-buttonBg);
	color: var(--MI_THEME-fg);
	text-decoration: none;
	font-weight: 700;
}

guidelineButton {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	min-height: 38px;
	margin-top: 16px;
	padding: 0 16px;
	border-radius: 999px;
	background: var(--MI_THEME-buttonBg);
	color: var(--MI_THEME-fg);
	text-decoration: none;
	font-weight: 700;
}
</style>
