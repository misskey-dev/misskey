<template>
<MkSpacer v-if="tab === 'overview'" :content-max="600" :margin-min="20">
	<div class="_formRoot">
		<div class="_formBlock fwhjspax" :style="{ backgroundImage: `url(${ $instance.bannerUrl })` }">
			<div class="content">
				<img :src="$instance.iconUrl || $instance.faviconUrl || '/favicon.ico'" alt="" class="icon"/>
				<div class="name">
					<b>{{ $instance.name || host }}</b>
				</div>
			</div>
		</div>

		<MkKeyValue class="_formBlock">
			<template #key>{{ $ts.description }}</template>
			<template #value>{{ $instance.description }}</template>
		</MkKeyValue>

		<FormSection>
			<MkKeyValue class="_formBlock" :copy="version">
				<template #key>Misskey</template>
				<template #value>{{ version }}</template>
			</MkKeyValue>
			<FormLink to="/about-misskey">{{ $ts.aboutMisskey }}</FormLink>
		</FormSection>

		<FormSection>
			<FormSplit>
				<MkKeyValue class="_formBlock">
					<template #key>{{ $ts.administrator }}</template>
					<template #value>{{ $instance.maintainerName }}</template>
				</MkKeyValue>
				<MkKeyValue class="_formBlock">
					<template #key>{{ $ts.contact }}</template>
					<template #value>{{ $instance.maintainerEmail }}</template>
				</MkKeyValue>
			</FormSplit>
			<FormLink v-if="$instance.tosUrl" :to="$instance.tosUrl" class="_formBlock" external>{{ $ts.tos }}</FormLink>
		</FormSection>

		<FormSuspense :p="initStats">
			<FormSection>
				<template #label>{{ $ts.statistics }}</template>
				<FormSplit>
					<MkKeyValue class="_formBlock">
						<template #key>{{ $ts.users }}</template>
						<template #value>{{ number(stats.originalUsersCount) }}</template>
					</MkKeyValue>
					<MkKeyValue class="_formBlock">
						<template #key>{{ $ts.notes }}</template>
						<template #value>{{ number(stats.originalNotesCount) }}</template>
					</MkKeyValue>
				</FormSplit>
			</FormSection>
		</FormSuspense>

		<FormSection>
			<template #label>Well-known resources</template>
			<div class="_formLinks">
				<FormLink :to="`/.well-known/host-meta`" external>host-meta</FormLink>
				<FormLink :to="`/.well-known/host-meta.json`" external>host-meta.json</FormLink>
				<FormLink :to="`/.well-known/nodeinfo`" external>nodeinfo</FormLink>
				<FormLink :to="`/robots.txt`" external>robots.txt</FormLink>
				<FormLink :to="`/manifest.json`" external>manifest.json</FormLink>
			</div>
		</FormSection>
	</div>
</MkSpacer>
<MkSpacer v-else-if="tab === 'charts'" :content-max="1200" :margin-min="20">
	<MkInstanceStats :chart-limit="500" :detailed="true"/>
</MkSpacer>
</template>

<script lang="ts" setup>
import { ref, computed } from 'vue';
import { version, instanceName } from '@/config';
import FormLink from '@/components/form/link.vue';
import FormSection from '@/components/form/section.vue';
import FormSuspense from '@/components/form/suspense.vue';
import FormSplit from '@/components/form/split.vue';
import MkKeyValue from '@/components/key-value.vue';
import MkInstanceStats from '@/components/instance-stats.vue';
import * as os from '@/os';
import number from '@/filters/number';
import * as symbols from '@/symbols';
import { host } from '@/config';
import { i18n } from '@/i18n';

let stats = $ref(null);
let tab = $ref('overview');

const initStats = () => os.api('stats', {
}).then((res) => {
	stats = res;
});

defineExpose({
	[symbols.PAGE_INFO]: computed(() => ({
		title: i18n.ts.instanceInfo,
		icon: 'fas fa-info-circle',
		bg: 'var(--bg)',
		tabs: [{
			active: tab === 'overview',
			title: i18n.ts.overview,
			onClick: () => { tab = 'overview'; },
		}, {
			active: tab === 'charts',
			title: i18n.ts.charts,
			icon: 'fas fa-chart-bar',
			onClick: () => { tab = 'charts'; },
		},],
	})),
});
</script>

<style lang="scss" scoped>
.fwhjspax {
	text-align: center;
	border-radius: 10px;
	overflow: clip;
	background-size: cover;
	background-position: center center;

	> .content {
		overflow: hidden;

		> .icon {
			display: block;
			margin: 16px auto 0 auto;
			height: 64px;
			border-radius: 8px;
		}

		> .name {
			display: block;
			padding: 16px;
			color: #fff;
			text-shadow: 0 0 8px #000;
			background: linear-gradient(transparent, rgba(0, 0, 0, 0.7));
		}
	}
}
</style>
