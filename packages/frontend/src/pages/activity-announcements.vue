<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<PageWithHeader>
	<div class="_spacer" style="--MI_SPACER-w: 700px;">
		<div class="_gaps">
			<div class="_panel" style="padding: 24px;">
				<h2 style="margin-top: 0;">活動告知TL</h2>
				<p>
					歌ってみた・配信開始・重大発表・作品公開など、活動に関する告知を見るためのページです。
				</p>
				<p>
					活動に関するお知らせを投稿するときは、本文に <b>#活動告知</b> を入れてください。
				</p>
				<MkButton primary @click="openTag">
					<i class="ti ti-megaphone"></i>
					<span>#活動告知 の投稿を見る</span>
				</MkButton>
			</div>
		</div>
	</div>
</PageWithHeader>
</template>

<script lang="ts" setup>
import MkButton from '@/components/MkButton.vue';
import PageWithHeader from '@/components/global/PageWithHeader.vue';
import { definePage } from '@/page.js';
import { useRouter } from '@/router.js';

const router = useRouter();

function openTag() {
	router.push('/tags/活動告知');
}

definePage(() => ({
	title: '活動告知TL',
	icon: 'ti ti-megaphone',
}));
</script>
