<template>
<div class="_gaps">
	<MkInfo>{{ i18n.ts._initialAccountSetting.theseSettingsCanEditLater }}</MkInfo>

	<MkFolder>
		<template #label>{{ i18n.ts.enableAdvancedMfm }}</template>
		<template #icon><i class="ti ti-markdown"></i></template>
		<template #suffix>{{ advancedMfm ? i18n.ts.on : i18n.ts.off }}</template>

		<MkSwitch v-model="advancedMfm">{{ i18n.ts.enableAdvancedMfm }}<template #caption>{{ i18n.ts.enableAdvancedMfmDescription }}</template></MkSwitch>
	</MkFolder>

	<MkFolder v-if="advancedMfm">
		<template #label>{{ i18n.ts.enableAnimatedMfm }}</template>
		<template #icon><i class="ti ti-code-asterix"></i></template>
		<template #suffix>{{ animatedMfm ? i18n.ts.on : i18n.ts.off }}</template>

		<MkInfo v-if="animatedMfm" style="margin-bottom: 15px;" warn>{{ i18n.ts.photosensitiveSeizuresWarning }}</MkInfo>
		<MkSwitch v-model="animatedMfm">{{ i18n.ts.enableAnimatedMfm }}<template #caption>{{ i18n.ts.enableAnimatedMfmDescription }}</template></MkSwitch>
	</MkFolder>

	<MkFolder>
		<template #label>{{ i18n.ts.disableShowingAnimatedImages }}</template>
		<template #icon><i class="ti ti-confetti"></i></template>
		<template #suffix>{{ disableShowingAnimatedImages ? i18n.ts.on : i18n.ts.off }}</template>

		<MkInfo v-if="!disableShowingAnimatedImages" style="margin-bottom: 15px;" warn>{{ i18n.ts.photosensitiveSeizuresWarning }}</MkInfo>
		<MkSwitch v-model="disableShowingAnimatedImages">{{ i18n.ts.disableShowingAnimatedImages }}<template #caption>{{ i18n.ts.disableShowingAnimatedImagesDescription }}</template></MkSwitch>
	</MkFolder>

	<MkInfo>{{ i18n.ts._initialAccountSetting.youCanEditMoreSettingsInSettingsPageLater }}</MkInfo>
</div>
</template>

<script lang="ts" setup>
import { computed, ref, watch } from 'vue';
import { instance } from '@/instance';
import { i18n } from '@/i18n';
import MkSwitch from '@/components/MkSwitch.vue';
import MkInfo from '@/components/MkInfo.vue';
import MkFolder from '@/components/MkFolder.vue';
import * as os from '@/os';
import { $i } from '@/account';
import { defaultStore } from "@/store";

const animatedMfm = computed(defaultStore.makeGetterSetter('animatedMfm'));
const advancedMfm = computed(defaultStore.makeGetterSetter('advancedMfm'));
const disableShowingAnimatedImages = computed(defaultStore.makeGetterSetter('disableShowingAnimatedImages'));
</script>

<style lang="scss" module>

</style>
