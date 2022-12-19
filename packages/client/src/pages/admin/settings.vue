<template>
<div>
	<MkStickyContainer>
		<template #header><XHeader :actions="headerActions" :tabs="headerTabs"/></template>
		<MkSpacer :content-max="700" :margin-min="16" :margin-max="32">
			<FormSuspense :p="init">
				<div class="_formRoot">
					<FormInput v-model="name" class="_formBlock">
						<template #label>{{ i18n.ts.instanceName }}</template>
					</FormInput>

					<FormTextarea v-model="description" class="_formBlock">
						<template #label>{{ i18n.ts.instanceDescription }}</template>
					</FormTextarea>

					<FormInput v-model="tosUrl" class="_formBlock">
						<template #prefix><i class="fas fa-link"></i></template>
						<template #label>{{ i18n.ts.tosUrl }}</template>
					</FormInput>

					<FormSplit :min-width="300">
						<FormInput v-model="maintainerName" class="_formBlock">
							<template #label>{{ i18n.ts.maintainerName }}</template>
						</FormInput>

						<FormInput v-model="maintainerEmail" type="email" class="_formBlock">
							<template #prefix><i class="fas fa-envelope"></i></template>
							<template #label>{{ i18n.ts.maintainerEmail }}</template>
						</FormInput>
					</FormSplit>

					<FormTextarea v-model="pinnedUsers" class="_formBlock">
						<template #label>{{ i18n.ts.pinnedUsers }}</template>
						<template #caption>{{ i18n.ts.pinnedUsersDescription }}</template>
					</FormTextarea>

					<FormSection>
						<FormSwitch v-model="enableRegistration" class="_formBlock">
							<template #label>{{ i18n.ts.enableRegistration }}</template>
						</FormSwitch>

						<FormSwitch v-model="emailRequiredForSignup" class="_formBlock">
							<template #label>{{ i18n.ts.emailRequiredForSignup }}</template>
						</FormSwitch>
					</FormSection>

					<FormSection>
						<FormSwitch v-model="enableLocalTimeline" class="_formBlock">{{ i18n.ts.enableLocalTimeline }}</FormSwitch>
						<FormSwitch v-model="enableGlobalTimeline" class="_formBlock">{{ i18n.ts.enableGlobalTimeline }}</FormSwitch>
						<FormInfo class="_formBlock">{{ i18n.ts.disablingTimelinesInfo }}</FormInfo>
					</FormSection>

					<FormSection>
						<template #label>{{ i18n.ts.theme }}</template>

						<FormInput v-model="iconUrl" class="_formBlock">
							<template #prefix><i class="fas fa-link"></i></template>
							<template #label>{{ i18n.ts.iconUrl }}</template>
						</FormInput>

						<FormInput v-model="bannerUrl" class="_formBlock">
							<template #prefix><i class="fas fa-link"></i></template>
							<template #label>{{ i18n.ts.bannerUrl }}</template>
						</FormInput>

						<FormInput v-model="backgroundImageUrl" class="_formBlock">
							<template #prefix><i class="fas fa-link"></i></template>
							<template #label>{{ i18n.ts.backgroundImageUrl }}</template>
						</FormInput>

						<FormInput v-model="themeColor" class="_formBlock">
							<template #prefix><i class="fas fa-palette"></i></template>
							<template #label>{{ i18n.ts.themeColor }}</template>
							<template #caption>#RRGGBB</template>
						</FormInput>

						<FormTextarea v-model="defaultLightTheme" class="_formBlock">
							<template #label>{{ i18n.ts.instanceDefaultLightTheme }}</template>
							<template #caption>{{ i18n.ts.instanceDefaultThemeDescription }}</template>
						</FormTextarea>

						<FormTextarea v-model="defaultDarkTheme" class="_formBlock">
							<template #label>{{ i18n.ts.instanceDefaultDarkTheme }}</template>
							<template #caption>{{ i18n.ts.instanceDefaultThemeDescription }}</template>
						</FormTextarea>
					</FormSection>

					<FormSection>
						<template #label>{{ i18n.ts.files }}</template>

						<FormSwitch v-model="cacheRemoteFiles" class="_formBlock">
							<template #label>{{ i18n.ts.cacheRemoteFiles }}</template>
							<template #caption>{{ i18n.ts.cacheRemoteFilesDescription }}</template>
						</FormSwitch>

						<FormSplit :min-width="280">
							<FormInput v-model="localDriveCapacityMb" type="number" class="_formBlock">
								<template #label>{{ i18n.ts.driveCapacityPerLocalAccount }}</template>
								<template #suffix>MB</template>
								<template #caption>{{ i18n.ts.inMb }}</template>
							</FormInput>

							<FormInput v-model="remoteDriveCapacityMb" type="number" :disabled="!cacheRemoteFiles" class="_formBlock">
								<template #label>{{ i18n.ts.driveCapacityPerRemoteAccount }}</template>
								<template #suffix>MB</template>
								<template #caption>{{ i18n.ts.inMb }}</template>
							</FormInput>
						</FormSplit>
					</FormSection>

					<FormSection>
						<template #label>ServiceWorker</template>

						<FormSwitch v-model="enableServiceWorker" class="_formBlock">
							<template #label>{{ i18n.ts.enableServiceworker }}</template>
							<template #caption>{{ i18n.ts.serviceworkerInfo }}</template>
						</FormSwitch>

						<template v-if="enableServiceWorker">
							<FormInput v-model="swPublicKey" class="_formBlock">
								<template #prefix><i class="fas fa-key"></i></template>
								<template #label>Public key</template>
							</FormInput>

							<FormInput v-model="swPrivateKey" class="_formBlock">
								<template #prefix><i class="fas fa-key"></i></template>
								<template #label>Private key</template>
							</FormInput>
						</template>
					</FormSection>

					<FormSection>
						<template #label>DeepL Translation</template>

						<FormInput v-model="deeplAuthKey" class="_formBlock">
							<template #prefix><i class="fas fa-key"></i></template>
							<template #label>DeepL Auth Key</template>
						</FormInput>
						<FormSwitch v-model="deeplIsPro" class="_formBlock">
							<template #label>Pro account</template>
						</FormSwitch>
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
import FormSwitch from '@/components/form/switch.vue';
import FormInput from '@/components/form/input.vue';
import FormTextarea from '@/components/form/textarea.vue';
import FormInfo from '@/components/MkInfo.vue';
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
let enableLocalTimeline: boolean = $ref(false);
let enableGlobalTimeline: boolean = $ref(false);
let pinnedUsers: string = $ref('');
let cacheRemoteFiles: boolean = $ref(false);
let localDriveCapacityMb: any = $ref(0);
let remoteDriveCapacityMb: any = $ref(0);
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
	enableLocalTimeline = !meta.disableLocalTimeline;
	enableGlobalTimeline = !meta.disableGlobalTimeline;
	pinnedUsers = meta.pinnedUsers.join('\n');
	cacheRemoteFiles = meta.cacheRemoteFiles;
	localDriveCapacityMb = meta.driveCapacityPerLocalUserMb;
	remoteDriveCapacityMb = meta.driveCapacityPerRemoteUserMb;
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
		disableLocalTimeline: !enableLocalTimeline,
		disableGlobalTimeline: !enableGlobalTimeline,
		pinnedUsers: pinnedUsers.split('\n'),
		cacheRemoteFiles,
		localDriveCapacityMb: parseInt(localDriveCapacityMb, 10),
		remoteDriveCapacityMb: parseInt(remoteDriveCapacityMb, 10),
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
	icon: 'fas fa-check',
	text: i18n.ts.save,
	handler: save,
}]);

const headerTabs = $computed(() => []);

definePageMetadata({
	title: i18n.ts.general,
	icon: 'fas fa-cog',
});
</script>
