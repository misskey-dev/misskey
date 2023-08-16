<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div>
	<XAntenna :antenna="draft" @created="onAntennaCreated"/>
</div>
</template>

<script lang="ts" setup>
import XAntenna from './editor.vue';
import { i18n } from '@/i18n';
import { definePageMetadata } from '@/scripts/page-metadata';
import { useRouter } from '@/router';
import { antennasCache } from '@/cache';

const router = useRouter();

let draft = $ref({
	name: '',
	src: 'all',
	userListId: null,
	users: [],
	keywords: [],
	excludeKeywords: [],
	withReplies: false,
	caseSensitive: false,
	withFile: false,
	notify: false,
});

function onAntennaCreated() {
	antennasCache.delete();
	router.push('/my/antennas');
}

definePageMetadata({
	title: i18n.ts.manageAntennas,
	icon: 'ti ti-antenna',
});
</script>
