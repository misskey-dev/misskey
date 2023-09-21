<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div :class="$style.root">
	<div
		v-for="x in defaultStore.reactiveState.statusbars.value" :key="x.id" :class="[$style.item, { [$style.black]: x.black,
			[$style.verySmall]: x.size === 'verySmall',
			[$style.small]: x.size === 'small',
			[$style.large]: x.size === 'large',
			[$style.veryLarge]: x.size === 'veryLarge',
		}]"
	>
		<span :class="$style.name">{{ x.name }}</span>
		<XRss v-if="x.type === 'rss'" :class="$style.body" :refreshIntervalSec="x.props.refreshIntervalSec" :marqueeDuration="x.props.marqueeDuration" :marqueeReverse="x.props.marqueeReverse" :display="x.props.display" :url="x.props.url" :shuffle="x.props.shuffle"/>
		<XFederation v-else-if="x.type === 'federation'" :class="$style.body" :refreshIntervalSec="x.props.refreshIntervalSec" :marqueeDuration="x.props.marqueeDuration" :marqueeReverse="x.props.marqueeReverse" :display="x.props.display" :colored="x.props.colored"/>
		<XUserList v-else-if="x.type === 'userList'" :class="$style.body" :refreshIntervalSec="x.props.refreshIntervalSec" :marqueeDuration="x.props.marqueeDuration" :marqueeReverse="x.props.marqueeReverse" :display="x.props.display" :userListId="x.props.userListId"/>
	</div>
</div>
</template>

<script lang="ts" setup>
import { defineAsyncComponent } from 'vue';
import { defaultStore } from '@/store.js';
const XRss = defineAsyncComponent(() => import('./statusbar-rss.vue'));
const XFederation = defineAsyncComponent(() => import('./statusbar-federation.vue'));
const XUserList = defineAsyncComponent(() => import('./statusbar-user-list.vue'));
</script>

<style lang="scss" module>
.root {
	font-size: 15px;
	background: var(--panel);
}

.item {
	--height: 24px;
	--nameMargin: 10px;
	font-size: 0.85em;

	&.verySmall {
		--nameMargin: 7px;
		--height: 16px;
		font-size: 0.75em;
	}

	&.small {
		--nameMargin: 8px;
		--height: 20px;
		font-size: 0.8em;
	}

	&.large {
		--nameMargin: 12px;
		--height: 26px;
		font-size: 0.875em;
	}

	&.veryLarge {
		--nameMargin: 14px;
		--height: 30px;
		font-size: 0.9em;
	}

	display: flex;
	vertical-align: bottom;
	width: 100%;
	line-height: var(--height);
	height: var(--height);
	overflow: clip;
	contain: strict;

	&.black {
		background: #000;
		color: #fff;
	}
}

.name {
	padding: 0 var(--nameMargin);
	font-weight: bold;
	color: var(--accent);

	&:empty {
		display: none;
	}
}

.body {
	min-width: 0;
	flex: 1;
}
</style>
