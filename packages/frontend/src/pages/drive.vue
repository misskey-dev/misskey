<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div>
	<XDrive ref="drive" @cd="x => folder = x"/>
</div>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue';
import * as Misskey from 'misskey-js';
import XDrive from '@/components/MkDrive.vue';
import { i18n } from '@/i18n.js';
import { definePageMetadata } from '@/scripts/page-metadata.js';

const folder = ref<Misskey.entities.DriveFolder | null>(null);

const headerActions = computed(() => []);

const headerTabs = computed(() => []);

definePageMetadata(() => ({
	title: folder.value ? folder.value.name : i18n.ts.drive,
	icon: 'ti ti-cloud',
	hideHeader: true,
}));
</script>
