<template>
<div>
	<MkStickyContainer>
		<template #header><XHeader :actions="headerActions" :tabs="headerTabs"/></template>
		<MkSpacer :content-max="700" :margin-min="16" :margin-max="32">
			<FormSuspense :p="init">
				<div class="_gaps_m">
					<MkInput v-model="name">
						<template #label>{{ i18n.ts.instanceName }}</template>
					</MkInput>

					<MkTextarea v-model="description">
						<template #label>{{ i18n.ts.instanceDescription }}</template>
					</MkTextarea>

					<MkInput v-model="tosUrl">
						<template #prefix><i class="ti ti-link"></i></template>
						<template #label>{{ i18n.ts.tosUrl }}</template>
					</MkInput>

					<FormSplit :min-width="300">
						<MkInput v-model="maintainerName">
							<template #label>{{ i18n.ts.maintainerName }}</template>
						</MkInput>

						<MkInput v-model="maintainerEmail" type="email">
							<template #prefix><i class="ti ti-mail"></i></template>
							<template #label>{{ i18n.ts.maintainerEmail }}</template>
						</MkInput>
					</FormSplit>

					<MkTextarea v-model="pinnedUsers">
						<template #label>{{ i18n.ts.pinnedUsers }}</template>
						<template #caption>{{ i18n.ts.pinnedUsersDescription }}</template>
					</MkTextarea>

					<FormSection>
						<div class="_gaps_s">
							<MkSwitch v-model="enableRegistration">
								<template #label>{{ i18n.ts.enableRegistration }}</template>
							</MkSwitch>

							<MkSwitch v-model="emailRequiredForSignup">
								<template #label>{{ i18n.ts.emailRequiredForSignup }}</template>
							</MkSwitch>
						</div>
					</FormSection>

					<FormSection>
						<template #label>{{ i18n.ts.theme }}</template>

						<div class="_gaps_m">
							<MkInput v-model="iconUrl">
								<template #prefix><i class="ti ti-link"></i></template>
								<template #label>{{ i18n.ts.iconUrl }}</template>
							</MkInput>

							<MkInput v-model="bannerUrl">
								<template #prefix><i class="ti ti-link"></i></template>
								<template #label>{{ i18n.ts.bannerUrl }}</template>
							</MkInput>

							<MkInput v-model="backgroundImageUrl">
								<template #prefix><i class="ti ti-link"></i></template>
								<template #label>{{ i18n.ts.backgroundImageUrl }}</template>
							</MkInput>

							<MkInput v-model="themeColor">
								<template #prefix><i class="ti ti-palette"></i></template>
								<template #label>{{ i18n.ts.themeColor }}</template>
								<template #caption>#RRGGBB</template>
							</MkInput>

							<MkTextarea v-model="defaultLightTheme">
								<template #label>{{ i18n.ts.instanceDefaultLightTheme }}</template>
								<template #caption>{{ i18n.ts.instanceDefaultThemeDescription }}</template>
							</MkTextarea>

							<MkTextarea v-model="defaultDarkTheme">
								<template #label>{{ i18n.ts.instanceDefaultDarkTheme }}</template>
								<template #caption>{{ i18n.ts.instanceDefaultThemeDescription }}</template>
							</MkTextarea>
						</div>
					</FormSection>

					<FormSection>
						<template #label>{{ i18n.ts.files }}</template>

						<div class="_gaps_m">
							<MkSwitch v-model="cacheRemoteFiles">
								<template #label>{{ i18n.ts.cacheRemoteFiles }}</template>
								<template #caption>{{ i18n.ts.cacheRemoteFilesDescription }}</template>
							</MkSwitch>
						</div>
					</FormSection>

					<FormSection>
						<template #label>ServiceWorker</template>

						<div class="_gaps_m">
							<MkSwitch v-model="enableServiceWorker">
								<template #label>{{ i18n.ts.enableServiceworker }}</template>
								<template #caption>{{ i18n.ts.serviceworkerInfo }}</template>
							</MkSwitch>

							<template v-if="enableServiceWorker">
								<MkInput v-model="swPublicKey">
									<template #prefix><i class="ti ti-key"></i></template>
									<template #label>Public key</template>
								</MkInput>

								<MkInput v-model="swPrivateKey">
									<template #prefix><i class="ti ti-key"></i></template>
									<template #label>Private key</template>
								</MkInput>
							</template>
						</div>
					</FormSection>

					<FormSection>
						<template #label>DeepL Translation</template>

						<div class="_gaps_m">
							<MkInput v-model="deeplAuthKey">
								<template #prefix><i class="ti ti-key"></i></template>
								<template #label>DeepL Auth Key</template>
							</MkInput>
							<MkSwitch v-model="deeplIsPro">
								<template #label>Pro account</template>
							</MkSwitch>
						</div>
					</FormSection>
				</div>
			</FormSuspense>
		</MkSpacer>
	</MkStickyContainer>
</div>
</template>

<script lang="ts" setup>
import { } from 'vue';
import XHeader from './_header_.vue';
import MkSwitch from '@/components/MkSwitch.vue';
import MkInput from '@/components/MkInput.vue';
import MkTextarea from '@/components/MkTextarea.vue';
import FormSection from '@/components/form/section.vue';
import FormSplit from '@/components/form/split.vue';
import FormSuspense from '@/components/form/suspense.vue';
import * as os from '@/os';
import { fetchInstance } from '@/instance';
import { i18n } from '@/i18n';
import { definePageMetadata } from '@/scripts/page-metadata';

let name: string | null = $ref(null);
let description: string | null = $ref(null);
let tosUrl: string | null = $ref(null);
let maintainerName: string | null = $ref(null);
let maintainerEmail: string | null = $ref(null);
let iconUrl: string | null = $ref(null);
let bannerUrl: string | null = $ref(null);
let backgroundImageUrl: string | null = $ref(null);
let themeColor: any = $ref(null);
let defaultLightTheme: any = $ref(null);
let defaultDarkTheme: any = $ref(null);
let pinnedUsers: string = $ref('');
let cacheRemoteFiles: boolean = $ref(false);
let enableRegistration: boolean = $ref(false);
let emailRequiredForSignup: boolean = $ref(false);
let enableServiceWorker: boolean = $ref(false);
let swPublicKey: any = $ref(null);
let swPrivateKey: any = $ref(null);
let deeplAuthKey: string = $ref('');
let deeplIsPro: boolean = $ref(false);

async function init() {
	const meta = await os.api('admin/meta');
	name = meta.name;
	description = meta.description;
	tosUrl = meta.tosUrl;
	iconUrl = meta.iconUrl;
	bannerUrl = meta.bannerUrl;
	backgroundImageUrl = meta.backgroundImageUrl;
	themeColor = meta.themeColor;
	defaultLightTheme = meta.defaultLightTheme;
	defaultDarkTheme = meta.defaultDarkTheme;
	maintainerName = meta.maintainerName;
	maintainerEmail = meta.maintainerEmail;
	pinnedUsers = meta.pinnedUsers.join('\n');
	cacheRemoteFiles = meta.cacheRemoteFiles;
	enableRegistration = !meta.disableRegistration;
	emailRequiredForSignup = meta.emailRequiredForSignup;
	enableServiceWorker = meta.enableServiceWorker;
	swPublicKey = meta.swPublickey;
	swPrivateKey = meta.swPrivateKey;
	deeplAuthKey = meta.deeplAuthKey;
	deeplIsPro = meta.deeplIsPro;
}

function save() {
	os.apiWithDialog('admin/update-meta', {
		name,
		description,
		tosUrl,
		iconUrl,
		bannerUrl,
		backgroundImageUrl,
		themeColor: themeColor === '' ? null : themeColor,
		defaultLightTheme: defaultLightTheme === '' ? null : defaultLightTheme,
		defaultDarkTheme: defaultDarkTheme === '' ? null : defaultDarkTheme,
		maintainerName,
		maintainerEmail,
		pinnedUsers: pinnedUsers.split('\n'),
		cacheRemoteFiles,
		disableRegistration: !enableRegistration,
		emailRequiredForSignup,
		enableServiceWorker,
		swPublicKey,
		swPrivateKey,
		deeplAuthKey,
		deeplIsPro,
	}).then(() => {
		fetchInstance();
	});
}

const headerActions = $computed(() => [{
	asFullButton: true,
	icon: 'ti ti-check',
	text: i18n.ts.save,
	handler: save,
}]);

const headerTabs = $computed(() => []);

definePageMetadata({
	title: i18n.ts.general,
	icon: 'ti ti-settings',
});
</script>
