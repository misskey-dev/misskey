<template>
<div class="_gaps">
	<MkInfo>{{ i18n.ts._initialAccountSetting.theseSettingsCanEditLater }}</MkInfo>

	<MkSwitch v-model="isLocked">{{ i18n.ts.makeFollowManuallyApprove }}<template #caption>{{ i18n.ts.lockedAccountInfo }}</template></MkSwitch>

	<MkSwitch v-model="hideOnlineStatus" @update:model-value="save()">
		{{ i18n.ts.hideOnlineStatus }}
		<template #caption>{{ i18n.ts.hideOnlineStatusDescription }}</template>
	</MkSwitch>

	<MkSwitch v-model="noCrawle" @update:model-value="save()">
		{{ i18n.ts.noCrawle }}
		<template #caption>{{ i18n.ts.noCrawleDescription }}</template>
	</MkSwitch>

	<MkSwitch v-model="preventAiLearning" @update:model-value="save()">
		{{ i18n.ts.preventAiLearning }}<span class="_beta">{{ i18n.ts.beta }}</span>
		<template #caption>{{ i18n.ts.preventAiLearningDescription }}</template>
	</MkSwitch>

	<MkInfo>{{ i18n.ts._initialAccountSetting.youCanEditMoreSettingsInSettingsPageLater }}</MkInfo>
</div>
</template>

<script lang="ts" setup>
import { computed, ref, watch } from 'vue';
import { instance } from '@/instance';
import { i18n } from '@/i18n';
import MkSwitch from '@/components/MkSwitch.vue';
import MkInfo from '@/components/MkInfo.vue';
import * as os from '@/os';
import { $i } from '@/account';

let isLocked = ref(false);
let hideOnlineStatus = ref(false);
let noCrawle = ref(false);
let preventAiLearning = ref(true);

watch(isLocked, () => {
	os.apiWithDialog('i/update', {
		isLocked: !!isLocked.value,
		hideOnlineStatus: !!hideOnlineStatus.value,
		noCrawle: !!noCrawle.value,
		preventAiLearning: !!preventAiLearning.value,
	});
});
</script>

<style lang="scss" module>

</style>
