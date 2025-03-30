<template>
	<div class="_panel _shadow" :class="$style.root">
		<div :class="$style.main">
			<div style="display: flex; align-items: center;">
				<div :class="$style.headerIcon">
					<i class="ti ti-report-analytics"></i>
				</div>
				<div :class="$style.headerTitle"><Mfm :text="i18n.ts.helpUsImproveUserExperience" /></div>
			</div>
			<div :class="$style.text">
				<Mfm
					:text="i18n.tsx.pleaseConsentToTracking({
						host: instance.name ?? host,
						privacyPolicyUrl: instance.privacyPolicyUrl,
					})"
				/>
			</div>
			<div class="_gaps_s">
				<div class="_buttons" style="justify-content: right;">
					<MkButton @click="consentEssential">{{ i18n.ts.consentEssential }}</MkButton>
					<MkButton primary @click="consentAll">{{ i18n.ts.consentAll }}</MkButton>
				</div>
				<MkFolder>
					<template #icon><i class="ti ti-lock-square"></i></template>
					<template #label>{{ i18n.ts.gtagConsentCustomize }}</template>
					<div class="_gaps_s">
						<MkInfo>{{ i18n.tsx.gtagConsentCustomizeDescription({ host: instance.name ?? host }) }}</MkInfo>
						<MkSwitch v-model="gtagConsentAnalytics">
							{{ i18n.ts.gtagConsentAnalytics }}
							<template #caption>{{ i18n.ts.gtagConsentAnalyticsDescription }}</template>
						</MkSwitch>
						<MkSwitch v-model="gtagConsentFunctionality">
							{{ i18n.ts.gtagConsentFunctionality }}
							<template #caption>{{ i18n.ts.gtagConsentFunctionalityDescription }}</template>
						</MkSwitch>
						<MkSwitch v-model="gtagConsentPersonalization">
							{{ i18n.ts.gtagConsentPersonalization }}
							<template #caption>{{ i18n.ts.gtagConsentPersonalizationDescription }}</template>
						</MkSwitch>
						<div class="_buttons" style="justify-content: right;">
							<MkButton @click="consentSelected">{{ i18n.ts.consentSelected }}</MkButton>
						</div>
					</div>
				</MkFolder>
			</div>
		</div>
	</div>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import MkButton from '@/components/MkButton.vue';
import MkFolder from '@/components/MkFolder.vue';
import MkSwitch from '@/components/MkSwitch.vue';
import MkInfo from '@/components/MkInfo.vue';
import { miLocalStorage } from '@/local-storage.js';
import { instance } from '@/instance.js';
import { host } from '@/config.js';
import { i18n } from '@/i18n.js';
import { $i } from '@/account.js';
import * as os from '@/os.js';
import { addGtag, consent as gtagConsent, set as gtagSet } from 'vue-gtag';
import type { GtagConsentParams } from '@/types/gtag.js';

const emit = defineEmits<(ev: 'closed') => void>();

const zIndex = os.claimZIndex('middle');

const gtagConsentAnalytics = ref(false);
const gtagConsentFunctionality = ref(false);
const gtagConsentPersonalization = ref(false);

function consentAll() {
	miLocalStorage.setItem('gaConsent', 'true');
	const params = <GtagConsentParams>{
		ad_storage: 'granted',
		ad_user_data: 'granted',
		ad_personalization: 'granted',
		analytics_storage: 'granted',
		functionality_storage: 'granted',
		personalization_storage: 'granted',
		security_storage: 'granted',
	};
	miLocalStorage.setItemAsJson('gtagConsent', params);
	gtagConsent('update', params);
	bootstrap();

	emit('closed');
}

function consentEssential() {
	miLocalStorage.setItem('gaConsent', 'true');
	const params = <GtagConsentParams>{
		ad_storage: 'denied',
		ad_user_data: 'denied',
		ad_personalization: 'denied',
		analytics_storage: 'denied',
		functionality_storage: 'denied',
		personalization_storage: 'denied',
		security_storage: 'granted',
	};
	miLocalStorage.setItemAsJson('gtagConsent', params);
	gtagConsent('update', params);
	bootstrap();

	emit('closed');
}

function consentSelected() {
	miLocalStorage.setItem('gaConsent', 'true');
	const params = <GtagConsentParams>{
		ad_storage: gtagConsentAnalytics.value ? 'granted' : 'denied',
		ad_user_data: gtagConsentFunctionality.value ? 'granted' : 'denied',
		ad_personalization: gtagConsentPersonalization.value ? 'granted' : 'denied',
		analytics_storage: gtagConsentAnalytics.value ? 'granted' : 'denied',
		functionality_storage: gtagConsentFunctionality.value ? 'granted' : 'denied',
		personalization_storage: gtagConsentPersonalization.value ? 'granted' : 'denied',
		security_storage: 'granted',
	};
	miLocalStorage.setItemAsJson('gtagConsent', params);
	gtagConsent('update', params);
	bootstrap();

	emit('closed');
}

function bootstrap() {
	addGtag();
	gtagSet({
		'client_id': miLocalStorage.getItem('id'),
		'user_id': $i?.id,
	});
}
</script>

<style lang="scss" module>
.root {
	position: fixed;
	z-index: v-bind(zIndex);
	bottom: var(--margin);
	left: 0;
	right: 0;
	margin: auto;
	box-sizing: border-box;
	width: calc(100% - (var(--margin) * 2));
	max-width: 500px;
	display: flex;
}

.main {
	padding: 25px 25px 25px 25px;
	width: inherit;
	flex: 1;
}

.headerIcon {
	margin-right: 8px;
	font-size: 40px;
	color: var(--accent);
}

.headerTitle {
	font-weight: bold;
	font-size: 16px;
}

.text {
	margin: 0.7em 0 1em 0;
}
</style>
