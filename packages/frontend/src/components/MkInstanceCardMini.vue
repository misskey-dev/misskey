<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div
	:class="['_stripe', $style.root, {
		[$style.isNotResponding]: instance.isNotResponding,
		[$style.isSilenced]: instance.isSilenced,
		[$style.isSuspended]: instance.isSuspended,
		[$style.isBlocked]: instance.isBlocked,
	}]"
>
	<img :class="$style.icon" :src="getInstanceIcon(instance)" alt="" loading="lazy"/>
	<div :class="$style.body">
		<span :class="$style.host">{{ instance.name || instance.host }}</span>
		<span :class="$style.sub">
			<span class="_monospace">
				<span style="font-weight: 700;">{{ instance.host }}</span> / {{ instance.softwareName || '?' }} {{ instance.softwareVersion }}
			</span>
		</span>
	</div>
	<MkMiniChart v-if="chartValues" :class="$style.chart" :src="chartValues"/>
</div>
</template>

<script lang="ts" setup>
import { shallowRef, watch } from 'vue';
import * as Misskey from 'misskey-js';
import MkMiniChart from '@/components/MkMiniChart.vue';
import { misskeyApiGet } from '@/utility/misskey-api.js';
import { getProxiedImageUrlNullable } from '@/utility/media-proxy.js';

const props = defineProps<{
	instance: Misskey.entities.FederationInstance;
}>();

const chartValues = shallowRef<number[] | null>(null);

watch(() => props.instance.host, (host) => {
	misskeyApiGet('charts/instance', {
		host,
		limit: 16 + 1,
		span: 'day',
	}).then(res => {
		// 今日のぶんの値はまだ途中の値であり、それも含めると大抵の場合前日よりも下降しているようなグラフになってしまうため今日は弾く
		res.requests.received.shift();
		chartValues.value = res.requests.received;
	}).catch(() => {
		chartValues.value = null;
	});
}, {
	immediate: true,
});

function getInstanceIcon(instance: Misskey.entities.FederationInstance): string {
	return getProxiedImageUrlNullable(instance.iconUrl, 'preview') ?? getProxiedImageUrlNullable(instance.faviconUrl, 'preview') ?? '/client-assets/dummy.png';
}
</script>

<style lang="scss" module>
$bodyTitleHieght: 18px;
$bodyInfoHieght: 16px;

.root {
	display: flex;
	align-items: center;
	padding: 16px;
	border-radius: 8px;
	background-color: var(--MI_THEME-panel);

	&.isNotResponding {
		--MI_STRIPE-color: light-dark(
			color(from color-mix(in srgb, var(--MI_THEME-panel), orange 50%) srgb r g b / 0.25),
			color(from color-mix(in srgb, var(--MI_THEME-panel), orange 50%) srgb r g b / 0.5)
		);
	}

	&.isSilenced {
		--MI_STRIPE-color: light-dark(
			color(from color-mix(in srgb, var(--MI_THEME-panel), blue 50%) srgb r g b / 0.25),
			color(from color-mix(in srgb, var(--MI_THEME-panel), blue 50%) srgb r g b / 0.5)
		);
	}

	&.isSuspended {
		--MI_STRIPE-color: light-dark(
			color(from color-mix(in srgb, var(--MI_THEME-panel), black 15%) srgb r g b / 0.25),
			color(from color-mix(in srgb, var(--MI_THEME-panel), white 15%) srgb r g b / 0.5)
		);
	}

	&.isBlocked {
		--MI_STRIPE-color: light-dark(
			color(from color-mix(in srgb, var(--MI_THEME-panel), red 50%) srgb r g b / 0.25),
			color(from color-mix(in srgb, var(--MI_THEME-panel), red 50%) srgb r g b / 0.5)
		);
	}
}

.icon {
	display: block;
	width: ($bodyTitleHieght + $bodyInfoHieght);
	height: ($bodyTitleHieght + $bodyInfoHieght);
	object-fit: cover;
	border-radius: 4px;
	margin-right: 12px;
}

.body {
	flex: 1;
	overflow: hidden;
	font-size: 0.9em;
	color: var(--MI_THEME-fg);
	padding-right: 8px;
}

.host {
	display: block;
	width: 100%;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
	line-height: $bodyTitleHieght;
}

.sub {
	display: block;
	width: 100%;
	font-size: 80%;
	opacity: 0.7;
	line-height: $bodyInfoHieght;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
}

.chart {
	height: 30px;
}
</style>
