<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div v-if="instance">
	<XSetup v-if="instance.requireSetup"/>
	<XEntranceSimple v-else-if="isMobile"/>
	<XEntranceClassic v-else/>
</div>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue';
import * as Misskey from 'misskey-js';
import { instanceName } from '@@/js/config.js';
import XSetup from './welcome.setup.vue';
import XEntranceClassic from './welcome.entrance.classic.vue';
import XEntranceSimple from './welcome.entrance.simple.vue';
import { definePage } from '@/page.js';
import { fetchInstance } from '@/instance.js';

const instance = ref<Misskey.entities.MetaDetailed | null>(null);

// Mobile detection - consider screens smaller than 1024px as mobile
const isMobile = computed(() => {
	if (typeof window === 'undefined') return false;
	return window.innerWidth < 1024;
});

fetchInstance(true).then((res) => {
	instance.value = res;
});

const headerActions = computed(() => []);

const headerTabs = computed(() => []);

definePage(() => ({
	title: instanceName,
	icon: null,
}));
</script>
