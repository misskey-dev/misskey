<template>
<MkSpacer :content-max="600" :margin-min="20">
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
			<div class="_inputSplit">
				<MkKeyValue class="_formBlock">
					<template #key>{{ $ts.administrator }}</template>
					<template #value>{{ $instance.maintainerName }}</template>
				</MkKeyValue>
				<MkKeyValue class="_formBlock">
					<template #key>{{ $ts.contact }}</template>
					<template #value>{{ $instance.maintainerEmail }}</template>
				</MkKeyValue>
			</div>
		</FormSection>

		<FormLink v-if="$instance.tosUrl" :to="$instance.tosUrl" external>{{ $ts.tos }}</FormLink>

		<FormSuspense :p="initStats">
			<FormSection>
				<template #label>{{ $ts.statistics }}</template>
				<div class="_inputSplit">
					<MkKeyValue class="_formBlock">
						<template #key>{{ $ts.users }}</template>
						<template #value>{{ number(stats.originalUsersCount) }}</template>
					</MkKeyValue>
					<MkKeyValue class="_formBlock">
						<template #key>{{ $ts.notes }}</template>
						<template #value>{{ number(stats.originalNotesCount) }}</template>
					</MkKeyValue>
				</div>
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
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { version, instanceName } from '@/config';
import FormLink from '@/components/form/link.vue';
import FormSection from '@/components/form/section.vue';
import FormSuspense from '@/components/form/suspense.vue';
import MkKeyValue from '@/components/key-value.vue';
import * as os from '@/os';
import number from '@/filters/number';
import * as symbols from '@/symbols';
import { host } from '@/config';

export default defineComponent({
	components: {
		MkKeyValue,
		FormSection,
		FormLink,
		FormSuspense,
	},

	data() {
		return {
			[symbols.PAGE_INFO]: {
				title: this.$ts.instanceInfo,
				icon: 'fas fa-info-circle'
			},
			host,
			version,
			instanceName,
			stats: null,
			initStats: () => os.api('stats', {
			}).then((stats) => {
				this.stats = stats;
			})
		}
	},

	methods: {
		number
	}
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
