<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div class="_gaps">
	<div style="word-break: auto-phrase; text-align: center; padding: 0 16px;">{{ i18n.ts._initialTutorial._privacySettings.description1 }}</div>

	<MkInfo>{{ i18n.ts._initialTutorial._privacySettings.theseSettingsCanEditLater }}</MkInfo>

	<MkSwitch v-model="isLocked">{{ i18n.ts.makeFollowManuallyApprove }}<template #caption>{{ i18n.ts.lockedAccountInfo }}</template></MkSwitch>

	<MkSwitch v-model="hideOnlineStatus">{{ i18n.ts.hideOnlineStatus }}<template #caption>{{ i18n.ts.hideOnlineStatusDescription }}</template></MkSwitch>

	<MkSwitch v-model="noCrawle">{{ i18n.ts.noCrawle }}<template #caption>{{ i18n.ts.noCrawleDescription }}</template></MkSwitch>

	<MkSwitch v-model="preventAiLearning">{{ i18n.ts.preventAiLearning }}<template #caption>{{ i18n.ts.preventAiLearningDescription }}</template></MkSwitch>

	<MkInfo>{{ i18n.ts._initialTutorial._privacySettings.youCanEditMoreSettingsInSettingsPageLater }}</MkInfo>
</div>
</template>

<script lang="ts" setup>
import { ref, watch } from 'vue';
import { i18n } from '@/i18n.js';
import MkSwitch from '@/components/MkSwitch.vue';
import MkInfo from '@/components/MkInfo.vue';
import { misskeyApi } from '@/scripts/misskey-api.js';

const isLocked = ref(false);
const hideOnlineStatus = ref(false);
const noCrawle = ref(false);
const preventAiLearning = ref(true);

watch([isLocked, hideOnlineStatus, noCrawle, preventAiLearning], () => {
	misskeyApi('i/update', {
		isLocked: !!isLocked.value,
		hideOnlineStatus: !!hideOnlineStatus.value,
		noCrawle: !!noCrawle.value,
		preventAiLearning: !!preventAiLearning.value,
	});
});
</script>

<style lang="scss" module>

</style>
