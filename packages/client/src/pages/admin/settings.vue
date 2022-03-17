<template>
<MkSpacer :content-max="700" :margin-min="16" :margin-max="32">
	<FormSuspense :p="init">
		<div class="_formRoot">
			<FormInput v-model="name" class="_formBlock">
				<template #label>{{ $ts.instanceName }}</template>
			</FormInput>

			<FormTextarea v-model="description" class="_formBlock">
				<template #label>{{ $ts.instanceDescription }}</template>
			</FormTextarea>

			<FormInput v-model="tosUrl" class="_formBlock">
				<template #prefix><i class="fas fa-link"></i></template>
				<template #label>{{ $ts.tosUrl }}</template>
			</FormInput>

			<FormSplit :min-width="300">
				<FormInput v-model="maintainerName" class="_formBlock">
					<template #label>{{ $ts.maintainerName }}</template>
				</FormInput>

				<FormInput v-model="maintainerEmail" type="email" class="_formBlock">
					<template #prefix><i class="fas fa-envelope"></i></template>
					<template #label>{{ $ts.maintainerEmail }}</template>
				</FormInput>
			</FormSplit>

			<FormTextarea v-model="pinnedUsers" class="_formBlock">
				<template #label>{{ $ts.pinnedUsers }}</template>
				<template #caption>{{ $ts.pinnedUsersDescription }}</template>
			</FormTextarea>

			<FormSection>
				<FormSwitch v-model="enableRegistration" class="_formBlock">
					<template #label>{{ $ts.enableRegistration }}</template>
				</FormSwitch>

				<FormSwitch v-model="emailRequiredForSignup" class="_formBlock">
					<template #label>{{ $ts.emailRequiredForSignup }}</template>
				</FormSwitch>
			</FormSection>

			<FormSection>
				<FormSwitch v-model="enableLocalTimeline" class="_formBlock">{{ $ts.enableLocalTimeline }}</FormSwitch>
				<FormSwitch v-model="enableGlobalTimeline" class="_formBlock">{{ $ts.enableGlobalTimeline }}</FormSwitch>
				<FormInfo class="_formBlock">{{ $ts.disablingTimelinesInfo }}</FormInfo>
			</FormSection>

			<FormSection>
				<template #label>{{ $ts.theme }}</template>

				<FormInput v-model="iconUrl" class="_formBlock">
					<template #prefix><i class="fas fa-link"></i></template>
					<template #label>{{ $ts.iconUrl }}</template>
				</FormInput>

				<FormInput v-model="bannerUrl" class="_formBlock">
					<template #prefix><i class="fas fa-link"></i></template>
					<template #label>{{ $ts.bannerUrl }}</template>
				</FormInput>

				<FormInput v-model="backgroundImageUrl" class="_formBlock">
					<template #prefix><i class="fas fa-link"></i></template>
					<template #label>{{ $ts.backgroundImageUrl }}</template>
				</FormInput>

				<FormInput v-model="themeColor" class="_formBlock">
					<template #prefix><i class="fas fa-palette"></i></template>
					<template #label>{{ $ts.themeColor }}</template>
					<template #caption>#RRGGBB</template>
				</FormInput>

				<FormTextarea v-model="defaultLightTheme" class="_formBlock">
					<template #label>{{ $ts.instanceDefaultLightTheme }}</template>
					<template #caption>{{ $ts.instanceDefaultThemeDescription }}</template>
				</FormTextarea>

				<FormTextarea v-model="defaultDarkTheme" class="_formBlock">
					<template #label>{{ $ts.instanceDefaultDarkTheme }}</template>
					<template #caption>{{ $ts.instanceDefaultThemeDescription }}</template>
				</FormTextarea>
			</FormSection>

			<FormSection>
				<template #label>{{ $ts.files }}</template>

				<FormSwitch v-model="cacheRemoteFiles" class="_formBlock">
					<template #label>{{ $ts.cacheRemoteFiles }}</template>
					<template #caption>{{ $ts.cacheRemoteFilesDescription }}</template>
				</FormSwitch>

				<FormSplit :min-width="280">
					<FormInput v-model="localDriveCapacityMb" type="number" class="_formBlock">
						<template #label>{{ $ts.driveCapacityPerLocalAccount }}</template>
						<template #suffix>MB</template>
						<template #caption>{{ $ts.inMb }}</template>
					</FormInput>

					<FormInput v-model="remoteDriveCapacityMb" type="number" :disabled="!cacheRemoteFiles" class="_formBlock">
						<template #label>{{ $ts.driveCapacityPerRemoteAccount }}</template>
						<template #suffix>MB</template>
						<template #caption>{{ $ts.inMb }}</template>
					</FormInput>
				</FormSplit>
			</FormSection>

			<FormSection>
				<template #label>ServiceWorker</template>

				<FormSwitch v-model="enableServiceWorker" class="_formBlock">
					<template #label>{{ $ts.enableServiceworker }}</template>
					<template #caption>{{ $ts.serviceworkerInfo }}</template>
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
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import FormSwitch from '@/components/form/switch.vue';
import FormInput from '@/components/form/input.vue';
import FormTextarea from '@/components/form/textarea.vue';
import FormInfo from '@/components/ui/info.vue';
import FormSection from '@/components/form/section.vue';
import FormSplit from '@/components/form/split.vue';
import FormSuspense from '@/components/form/suspense.vue';
import * as os from '@/os';
import * as symbols from '@/symbols';
import { fetchInstance } from '@/instance';

export default defineComponent({
	components: {
		FormSwitch,
		FormInput,
		FormSuspense,
		FormTextarea,
		FormInfo,
		FormSection,
		FormSplit,
	},

	emits: ['info'],

	data() {
		return {
			[symbols.PAGE_INFO]: {
				title: this.$ts.general,
				icon: 'fas fa-cog',
				bg: 'var(--bg)',
				actions: [{
					asFullButton: true,
					icon: 'fas fa-check',
					text: this.$ts.save,
					handler: this.save,
				}],
			},
			name: null,
			description: null,
			tosUrl: null as string | null,
			maintainerName: null,
			maintainerEmail: null,
			iconUrl: null,
			bannerUrl: null,
			backgroundImageUrl: null,
			themeColor: null,
			defaultLightTheme: null,
			defaultDarkTheme: null,
			enableLocalTimeline: false,
			enableGlobalTimeline: false,
			pinnedUsers: '',
			cacheRemoteFiles: false,
			localDriveCapacityMb: 0,
			remoteDriveCapacityMb: 0,
			enableRegistration: false,
			emailRequiredForSignup: false,
			enableServiceWorker: false,
			swPublicKey: null,
			swPrivateKey: null,
			deeplAuthKey: '',
			deeplIsPro: false,
		}
	},

	methods: {
		async init() {
			const meta = await os.api('meta', { detail: true });
			this.name = meta.name;
			this.description = meta.description;
			this.tosUrl = meta.tosUrl;
			this.iconUrl = meta.iconUrl;
			this.bannerUrl = meta.bannerUrl;
			this.backgroundImageUrl = meta.backgroundImageUrl;
			this.themeColor = meta.themeColor;
			this.defaultLightTheme = meta.defaultLightTheme;
			this.defaultDarkTheme = meta.defaultDarkTheme;
			this.maintainerName = meta.maintainerName;
			this.maintainerEmail = meta.maintainerEmail;
			this.enableLocalTimeline = !meta.disableLocalTimeline;
			this.enableGlobalTimeline = !meta.disableGlobalTimeline;
			this.pinnedUsers = meta.pinnedUsers.join('\n');
			this.cacheRemoteFiles = meta.cacheRemoteFiles;
			this.localDriveCapacityMb = meta.driveCapacityPerLocalUserMb;
			this.remoteDriveCapacityMb = meta.driveCapacityPerRemoteUserMb;
			this.enableRegistration = !meta.disableRegistration;
			this.emailRequiredForSignup = meta.emailRequiredForSignup;
			this.enableServiceWorker = meta.enableServiceWorker;
			this.swPublicKey = meta.swPublickey;
			this.swPrivateKey = meta.swPrivateKey;
			this.deeplAuthKey = meta.deeplAuthKey;
			this.deeplIsPro = meta.deeplIsPro;
		},

		save() {
			os.apiWithDialog('admin/update-meta', {
				name: this.name,
				description: this.description,
				tosUrl: this.tosUrl,
				iconUrl: this.iconUrl,
				bannerUrl: this.bannerUrl,
				backgroundImageUrl: this.backgroundImageUrl,
				themeColor: this.themeColor === '' ? null : this.themeColor,
				defaultLightTheme: this.defaultLightTheme === '' ? null : this.defaultLightTheme,
				defaultDarkTheme: this.defaultDarkTheme === '' ? null : this.defaultDarkTheme,
				maintainerName: this.maintainerName,
				maintainerEmail: this.maintainerEmail,
				disableLocalTimeline: !this.enableLocalTimeline,
				disableGlobalTimeline: !this.enableGlobalTimeline,
				pinnedUsers: this.pinnedUsers.split('\n'),
				cacheRemoteFiles: this.cacheRemoteFiles,
				localDriveCapacityMb: parseInt(this.localDriveCapacityMb, 10),
				remoteDriveCapacityMb: parseInt(this.remoteDriveCapacityMb, 10),
				disableRegistration: !this.enableRegistration,
				emailRequiredForSignup: this.emailRequiredForSignup,
				enableServiceWorker: this.enableServiceWorker,
				swPublicKey: this.swPublicKey,
				swPrivateKey: this.swPrivateKey,
				deeplAuthKey: this.deeplAuthKey,
				deeplIsPro: this.deeplIsPro,
			}).then(() => {
				fetchInstance();
			});
		}
	}
});
</script>
