<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<PageWithHeader :tabs="headerTabs">
	<div class="_spacer" style="--MI_SPACER-w: 700px; --MI_SPACER-min: 16px; --MI_SPACER-max: 32px;">
		<SearchMarker path="/admin/branding" :label="i18n.ts.branding" :keywords="['branding']" icon="ti ti-paint">
			<div class="_gaps_m">
				<SearchMarker :keywords="['entrance', 'welcome', 'landing', 'front', 'home', 'page', 'style']">
					<MkRadios
						v-model="entrancePageStyle"
						:options="[
							{ value: 'classic' },
							{ value: 'simple' },
						]"
					>
						<template #label><SearchLabel>{{ i18n.ts._serverSettings.entrancePageStyle }}</SearchLabel></template>
					</MkRadios>
				</SearchMarker>

				<SearchMarker :keywords="['timeline']">
					<MkSwitch v-model="showTimelineForVisitor">
						<template #label><SearchLabel>{{ i18n.ts._serverSettings.showTimelineForVisitor }}</SearchLabel></template>
					</MkSwitch>
				</SearchMarker>

				<SearchMarker :keywords="['activity', 'activities']">
					<MkSwitch v-model="showActivitiesForVisitor">
						<template #label><SearchLabel>{{ i18n.ts._serverSettings.showActivitiesForVisitor }}</SearchLabel></template>
					</MkSwitch>
				</SearchMarker>

				<SearchMarker :keywords="['icon', 'image']">
					<MkInput v-model="iconUrl" type="url">
						<template #prefix><i class="ti ti-link"></i></template>
						<template #label><SearchLabel>{{ i18n.ts._serverSettings.iconUrl }}</SearchLabel></template>
					</MkInput>
				</SearchMarker>

				<SearchMarker :keywords="['icon', 'image']">
					<MkInput v-model="app192IconUrl" type="url">
						<template #prefix><i class="ti ti-link"></i></template>
						<template #label><SearchLabel>{{ i18n.ts._serverSettings.iconUrl }} (App/192px)</SearchLabel></template>
						<template #caption>
							<div>{{ i18n.tsx._serverSettings.appIconDescription({ host: instance.name ?? host }) }}</div>
							<div>({{ i18n.ts._serverSettings.appIconUsageExample }})</div>
							<div>{{ i18n.ts._serverSettings.appIconStyleRecommendation }}</div>
							<div><strong>{{ i18n.tsx._serverSettings.appIconResolutionMustBe({ resolution: '192x192px' }) }}</strong></div>
						</template>
					</MkInput>
				</SearchMarker>

				<SearchMarker :keywords="['icon', 'image']">
					<MkInput v-model="app512IconUrl" type="url">
						<template #prefix><i class="ti ti-link"></i></template>
						<template #label><SearchLabel>{{ i18n.ts._serverSettings.iconUrl }} (App/512px)</SearchLabel></template>
						<template #caption>
							<div>{{ i18n.tsx._serverSettings.appIconDescription({ host: instance.name ?? host }) }}</div>
							<div>({{ i18n.ts._serverSettings.appIconUsageExample }})</div>
							<div>{{ i18n.ts._serverSettings.appIconStyleRecommendation }}</div>
							<div><strong>{{ i18n.tsx._serverSettings.appIconResolutionMustBe({ resolution: '512x512px' }) }}</strong></div>
						</template>
					</MkInput>
				</SearchMarker>

				<SearchMarker :keywords="['banner', 'image']">
					<MkInput v-model="bannerUrl" type="url">
						<template #prefix><i class="ti ti-link"></i></template>
						<template #label><SearchLabel>{{ i18n.ts.bannerUrl }}</SearchLabel></template>
					</MkInput>
				</SearchMarker>

				<SearchMarker :keywords="['background', 'image']">
					<MkInput v-model="backgroundImageUrl" type="url">
						<template #prefix><i class="ti ti-link"></i></template>
						<template #label><SearchLabel>{{ i18n.ts.backgroundImageUrl }}</SearchLabel></template>
					</MkInput>
				</SearchMarker>

				<SearchMarker :keywords="['image']">
					<MkInput v-model="notFoundImageUrl" type="url">
						<template #prefix><i class="ti ti-link"></i></template>
						<template #label><SearchLabel>{{ i18n.ts.notFoundDescription }}</SearchLabel></template>
					</MkInput>
				</SearchMarker>

				<SearchMarker :keywords="['image']">
					<MkInput v-model="infoImageUrl" type="url">
						<template #prefix><i class="ti ti-link"></i></template>
						<template #label><SearchLabel>{{ i18n.ts.nothing }}</SearchLabel></template>
					</MkInput>
				</SearchMarker>

				<SearchMarker :keywords="['image']">
					<MkInput v-model="serverErrorImageUrl" type="url">
						<template #prefix><i class="ti ti-link"></i></template>
						<template #label><SearchLabel>{{ i18n.ts.somethingHappened }}</SearchLabel></template>
					</MkInput>
				</SearchMarker>

				<SearchMarker :keywords="['theme', 'color']">
					<MkColorInput v-model="themeColor">
						<template #label><SearchLabel>{{ i18n.ts.themeColor }}</SearchLabel></template>
					</MkColorInput>
				</SearchMarker>

				<SearchMarker :keywords="['theme', 'default', 'light']">
					<MkTextarea v-model="defaultLightTheme">
						<template #label><SearchLabel>{{ i18n.ts.instanceDefaultLightTheme }}</SearchLabel></template>
						<template #caption>{{ i18n.ts.instanceDefaultThemeDescription }}</template>
					</MkTextarea>
				</SearchMarker>

				<SearchMarker :keywords="['theme', 'default', 'dark']">
					<MkTextarea v-model="defaultDarkTheme">
						<template #label><SearchLabel>{{ i18n.ts.instanceDefaultDarkTheme }}</SearchLabel></template>
						<template #caption>{{ i18n.ts.instanceDefaultThemeDescription }}</template>
					</MkTextarea>
				</SearchMarker>

				<SearchMarker>
					<MkInput v-model="repositoryUrl" type="url">
						<template #prefix><i class="ti ti-link"></i></template>
						<template #label><SearchLabel>{{ i18n.ts.repositoryUrl }}</SearchLabel></template>
					</MkInput>
				</SearchMarker>

				<SearchMarker>
					<MkInput v-model="feedbackUrl" type="url">
						<template #prefix><i class="ti ti-link"></i></template>
						<template #label><SearchLabel>{{ i18n.ts.feedbackUrl }}</SearchLabel></template>
					</MkInput>
				</SearchMarker>

				<SearchMarker>
					<MkTextarea v-model="manifestJsonOverride">
						<template #label><SearchLabel>{{ i18n.ts._serverSettings.manifestJsonOverride }}</SearchLabel></template>
					</MkTextarea>
				</SearchMarker>
			</div>
		</SearchMarker>
	</div>
	<template #footer>
		<div :class="$style.footer">
			<div class="_spacer" style="--MI_SPACER-w: 700px; --MI_SPACER-min: 16px; --MI_SPACER-max: 16px;">
				<MkButton primary rounded @click="save"><i class="ti ti-check"></i> {{ i18n.ts.save }}</MkButton>
			</div>
		</div>
	</template>
</PageWithHeader>
</template>

<script lang="ts" setup>
import { ref, computed } from 'vue';
import JSON5 from 'json5';
import * as Misskey from 'misskey-js';
import { host } from '@@/js/config.js';
import MkInput from '@/components/MkInput.vue';
import MkTextarea from '@/components/MkTextarea.vue';
import * as os from '@/os.js';
import { misskeyApi } from '@/utility/misskey-api.js';
import { instance, fetchInstance } from '@/instance.js';
import { i18n } from '@/i18n.js';
import { definePage } from '@/page.js';
import MkButton from '@/components/MkButton.vue';
import MkColorInput from '@/components/MkColorInput.vue';
import MkRadios from '@/components/MkRadios.vue';
import MkSwitch from '@/components/MkSwitch.vue';

const meta = await misskeyApi('admin/meta');

// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
const entrancePageStyle = ref<Misskey.entities.MetaClientOptions['entrancePageStyle']>(meta.clientOptions.entrancePageStyle ?? 'classic');
// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
const showTimelineForVisitor = ref<Misskey.entities.MetaClientOptions['showTimelineForVisitor']>(meta.clientOptions.showTimelineForVisitor ?? true);
// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
const showActivitiesForVisitor = ref<Misskey.entities.MetaClientOptions['showActivitiesForVisitor']>(meta.clientOptions.showActivitiesForVisitor ?? true);

const iconUrl = ref(meta.iconUrl);
const app192IconUrl = ref(meta.app192IconUrl);
const app512IconUrl = ref(meta.app512IconUrl);
const bannerUrl = ref(meta.bannerUrl);
const backgroundImageUrl = ref(meta.backgroundImageUrl);
const themeColor = ref(meta.themeColor);
const defaultLightTheme = ref(meta.defaultLightTheme);
const defaultDarkTheme = ref(meta.defaultDarkTheme);
const serverErrorImageUrl = ref(meta.serverErrorImageUrl);
const infoImageUrl = ref(meta.infoImageUrl);
const notFoundImageUrl = ref(meta.notFoundImageUrl);
const repositoryUrl = ref(meta.repositoryUrl);
const feedbackUrl = ref(meta.feedbackUrl);
const manifestJsonOverride = ref(meta.manifestJsonOverride === '' ? '{}' : JSON.stringify(JSON.parse(meta.manifestJsonOverride), null, '\t'));

function save() {
	os.apiWithDialog('admin/update-meta', {
		clientOptions: {
			entrancePageStyle: entrancePageStyle.value,
			showTimelineForVisitor: showTimelineForVisitor.value,
			showActivitiesForVisitor: showActivitiesForVisitor.value,
		},
		iconUrl: iconUrl.value,
		app192IconUrl: app192IconUrl.value,
		app512IconUrl: app512IconUrl.value,
		bannerUrl: bannerUrl.value,
		backgroundImageUrl: backgroundImageUrl.value,
		themeColor: themeColor.value === '' ? null : themeColor.value,
		defaultLightTheme: defaultLightTheme.value === '' ? null : defaultLightTheme.value,
		defaultDarkTheme: defaultDarkTheme.value === '' ? null : defaultDarkTheme.value,
		infoImageUrl: infoImageUrl.value === '' ? null : infoImageUrl.value,
		notFoundImageUrl: notFoundImageUrl.value === '' ? null : notFoundImageUrl.value,
		serverErrorImageUrl: serverErrorImageUrl.value === '' ? null : serverErrorImageUrl.value,
		repositoryUrl: repositoryUrl.value === '' ? null : repositoryUrl.value,
		feedbackUrl: feedbackUrl.value === '' ? null : feedbackUrl.value,
		manifestJsonOverride: manifestJsonOverride.value === '' ? '{}' : JSON.stringify(JSON5.parse(manifestJsonOverride.value)),
	}).then(() => {
		fetchInstance(true);
	});
}

const headerTabs = computed(() => []);

definePage(() => ({
	title: i18n.ts.branding,
	icon: 'ti ti-paint',
}));
</script>

<style lang="scss" module>
.footer {
	-webkit-backdrop-filter: var(--MI-blur, blur(15px));
	backdrop-filter: var(--MI-blur, blur(15px));
}
</style>
