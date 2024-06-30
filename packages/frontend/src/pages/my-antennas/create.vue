<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div>
	<MkAntennaEditor @created="onAntennaCreated"/>
</div>
</template>

<script lang="ts" setup>
import MkAntennaEditor from '@/components/MkAntennaEditor.vue';
import { i18n } from '@/i18n.js';
import { definePageMetadata } from '@/scripts/page-metadata.js';
import { antennasCache } from '@/cache.js';
import { useRouter } from '@/router/supplier.js';

const router = useRouter();

function onAntennaCreated() {
	antennasCache.delete();
	router.push('/my/antennas');
}

definePageMetadata(() => ({
	title: i18n.ts.manageAntennas,
	icon: 'ti ti-antenna',
}));
</script>
