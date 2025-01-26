<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div class="_gaps" :class="$style.root">
	<MkTab v-model="modeTab" style="margin-bottom: var(--margin);">
		<option value="list">{{ i18n.ts._customEmojisManager._local.tabTitleList }}</option>
		<option value="register">{{ i18n.ts._customEmojisManager._local.tabTitleRegister }}</option>
	</MkTab>

	<div>
		<XListComponent v-if="modeTab === 'list'"/>
		<XRegisterComponent v-else/>
	</div>
</div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { i18n } from '@/i18n.js';
import MkTab from '@/components/MkTab.vue';
import XListComponent from '@/pages/admin/custom-emojis-manager.local.list.vue';
import XRegisterComponent from '@/pages/admin/custom-emojis-manager.local.register.vue';

type PageMode = 'list' | 'register';

const modeTab = ref<PageMode>('list');
</script>

<style module lang="scss">
.root {
	padding: var(--MI-margin);
}
</style>
