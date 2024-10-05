<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div class="_gaps_m">
	<div :class="$style.banner" :style="{ backgroundImage: `url(${ instance.bannerUrl })` }">
		<div style="overflow: clip;">
			<img :src="instance.iconUrl ?? instance.faviconUrl ?? '/favicon.ico'" alt="" :class="$style.bannerIcon"/>
			<div :class="$style.bannerName">
				<b>{{ instance.name ?? host }}</b>
			</div>
		</div>
	</div>

	<MkKeyValue>
		<template #key>{{ i18n.ts.description }}</template>
		<template #value><div v-html="instance.description"></div></template>
	</MkKeyValue>

	<FormSection>
		<div class="_gaps_m">
			<MkKeyValue :copy="version">
				<template #key>Misskey</template>
				<template #value>{{ version }}</template>
			</MkKeyValue>
			<div v-html="i18n.tsx.poweredByMisskeyDescription({ name: instance.name ?? host })">
			</div>
			<FormLink to="/about-misskey">
				<template #icon><i class="ti ti-info-circle"></i></template>
				{{ i18n.ts.aboutMisskey }}
			</FormLink>
			<FormLink v-if="instance.repositoryUrl || instance.providesTarball" :to="instance.repositoryUrl || `/tarball/misskey-${version}.tar.gz`" external>
				<template #icon><i class="ti ti-code"></i></template>
				{{ i18n.ts.sourceCode }}
			</FormLink>
			<MkInfo v-else warn>
				{{ i18n.ts.sourceCodeIsNotYetProvided }}
			</MkInfo>
		</div>
	</FormSection>

	<FormSection>
		<div class="_gaps_m">
			<FormSplit>
				<MkKeyValue :copy="instance.maintainerName">
					<template #key>{{ i18n.ts.administrator }}</template>
					<template #value>
						<template v-if="instance.maintainerName">{{ instance.maintainerName }}</template>
						<span v-else style="opacity: 0.7;">({{ i18n.ts.none }})</span>
					</template>
				</MkKeyValue>
				<MkKeyValue :copy="instance.maintainerEmail">
					<template #key>{{ i18n.ts.contact }}</template>
					<template #value>
						<template v-if="instance.maintainerEmail">{{ instance.maintainerEmail }}</template>
						<span v-else style="opacity: 0.7;">({{ i18n.ts.none }})</span>
					</template>
				</MkKeyValue>
				<MkKeyValue>
					<template #key>{{ i18n.ts.inquiry }}</template>
					<template #value>
						<MkLink v-if="instance.inquiryUrl" :url="instance.inquiryUrl" target="_blank">{{ instance.inquiryUrl }}</MkLink>
						<span v-else style="opacity: 0.7;">({{ i18n.ts.none }})</span>
					</template>
				</MkKeyValue>
			</FormSplit>
			<div class="_gaps_s">
				<FormLink v-if="instance.impressumUrl" :to="instance.impressumUrl" external>
					<template #icon><i class="ti ti-user-shield"></i></template>
					<template #default>{{ i18n.ts.impressum }}</template>
				</FormLink>
				<MkFolder v-if="instance.serverRules.length > 0">
					<template #icon><i class="ti ti-checkup-list"></i></template>
					<template #label>{{ i18n.ts.serverRules }}</template>
					<ol class="_gaps_s" :class="$style.rules">
						<li v-for="item in instance.serverRules" :key="item" :class="$style.rule">
							<div :class="$style.ruleText" v-html="item"></div>
						</li>
					</ol>
				</MkFolder>
				<FormLink v-if="instance.tosUrl" :to="instance.tosUrl" external>
					<template #icon><i class="ti ti-license"></i></template>
					<template #default>{{ i18n.ts.termsOfService }}</template>
				</FormLink>
				<FormLink v-if="instance.privacyPolicyUrl" :to="instance.privacyPolicyUrl" external>
					<template #icon><i class="ti ti-shield-lock"></i></template>
					<template #default>{{ i18n.ts.privacyPolicy }}</template>
				</FormLink>
				<FormLink v-if="instance.feedbackUrl" :to="instance.feedbackUrl" external>
					<template #icon><i class="ti ti-message"></i></template>
					<template #default>{{ i18n.ts.feedback }}</template>
				</FormLink>
			</div>
		</div>
	</FormSection>

	<FormSuspense v-slot="{ result: stats }" :p="initStats">
		<FormSection>
			<template #label>{{ i18n.ts.statistics }}</template>
			<FormSplit>
				<MkKeyValue>
					<template #key>{{ i18n.ts.users }}</template>
					<template #value>{{ number(stats.originalUsersCount) }}</template>
				</MkKeyValue>
				<MkKeyValue>
					<template #key>{{ i18n.ts.notes }}</template>
					<template #value>{{ number(stats.originalNotesCount) }}</template>
				</MkKeyValue>
			</FormSplit>
		</FormSection>
	</FormSuspense>

	<FormSection>
		<template #label>Well-known resources</template>
		<div class="_gaps_s">
			<FormLink to="/.well-known/host-meta" external>host-meta</FormLink>
			<FormLink to="/.well-known/host-meta.json" external>host-meta.json</FormLink>
			<FormLink to="/.well-known/nodeinfo" external>nodeinfo</FormLink>
			<FormLink to="/robots.txt" external>robots.txt</FormLink>
			<FormLink to="/manifest.json" external>manifest.json</FormLink>
		</div>
	</FormSection>
</div>
</template>

<script lang="ts" setup>
import { host, version } from '@@/js/config.js';
import { i18n } from '@/i18n.js';
import { instance } from '@/instance.js';
import number from '@/filters/number.js';
import { misskeyApi } from '@/scripts/misskey-api.js';
import FormLink from '@/components/form/link.vue';
import FormSection from '@/components/form/section.vue';
import FormSplit from '@/components/form/split.vue';
import FormSuspense from '@/components/form/suspense.vue';
import MkFolder from '@/components/MkFolder.vue';
import MkKeyValue from '@/components/MkKeyValue.vue';
import MkLink from '@/components/MkLink.vue';

const initStats = () => misskeyApi('stats', {});
</script>

<style lang="scss" module>
.banner {
	text-align: center;
	border-radius: 10px;
	overflow: clip;
	background-color: var(--panel);
	background-size: cover;
	background-position: center center;
}

.bannerIcon {
	display: block;
	margin: 16px auto 0 auto;
	height: 64px;
	border-radius: 8px;
}

.bannerName {
	display: block;
	padding: 16px;
	color: #fff;
	text-shadow: 0 0 8px #000;
	background: linear-gradient(transparent, rgba(0, 0, 0, 0.7));
}

.rules {
	counter-reset: item;
	list-style: none;
	padding: 0;
	margin: 0;
}

.rule {
	display: flex;
	gap: 8px;
	word-break: break-word;

	&::before {
		flex-shrink: 0;
		display: flex;
		position: sticky;
		top: calc(var(--stickyTop, 0px) + 8px);
		counter-increment: item;
		content: counter(item);
		width: 32px;
		height: 32px;
		line-height: 32px;
		background-color: var(--accentedBg);
		color: var(--accent);
		font-size: 13px;
		font-weight: bold;
		align-items: center;
		justify-content: center;
		border-radius: 999px;
	}
}

.ruleText {
	padding-top: 6px;
}
</style>
