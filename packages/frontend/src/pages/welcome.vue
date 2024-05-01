<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div v-if="instance">
	<XSetup v-if="instance.requireSetup"/>
	<XEntrance v-else/>
</div>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import XSetup from './welcome.setup.vue';
import XEntrance from './welcome.entrance.a.vue';
import { instanceName } from '@/config.js';
import { definePageMetadata } from '@/scripts/page-metadata.js';
import { fetchInstance } from '@/instance.js';

const instance = await fetchInstance(true);

const headerActions = computed(() => []);

const headerTabs = computed(() => []);

definePageMetadata(() => ({
	title: instanceName,
	icon: null,
}));
</script>
