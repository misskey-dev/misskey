<template>
<div
	class="dlrsnxqu" :class="{
		verySmall: defaultStore.reactiveState.statusbarSize.value === 'verySmall',
		small: defaultStore.reactiveState.statusbarSize.value === 'small',
		medium: defaultStore.reactiveState.statusbarSize.value === 'medium',
		large: defaultStore.reactiveState.statusbarSize.value === 'large',
		veryLarge: defaultStore.reactiveState.statusbarSize.value === 'veryLarge',
	}"
>
	<div v-for="x in defaultStore.reactiveState.statusbars.value" :key="x.id" class="item" :class="{ black: x.black }">
		<span class="name">{{ x.name }}</span>
		<XRss v-if="x.type === 'rss'" class="body" :refresh-interval-sec="x.props.refreshIntervalSec" :marquee-duration="x.props.marqueeDuration" :marquee-reverse="x.props.marqueeReverse" :display="x.props.display" :url="x.props.url"/>
		<XFederation v-else-if="x.type === 'federation'" class="body" :refresh-interval-sec="x.props.refreshIntervalSec" :marquee-duration="x.props.marqueeDuration" :marquee-reverse="x.props.marqueeReverse" :display="x.props.display" :colored="x.props.colored"/>
		<XUserList v-else-if="x.type === 'userList'" class="body" :refresh-interval-sec="x.props.refreshIntervalSec" :marquee-duration="x.props.marqueeDuration" :marquee-reverse="x.props.marqueeReverse" :display="x.props.display" :user-list-id="x.props.userListId"/>
	</div>
</div>
</template>

<script lang="ts" setup>
import { computed, defineAsyncComponent, ref, toRef, watch } from 'vue';
import * as os from '@/os';
import { defaultStore } from '@/store';
const XRss = defineAsyncComponent(() => import('./statusbar-rss.vue'));
const XFederation = defineAsyncComponent(() => import('./statusbar-federation.vue'));
const XUserList = defineAsyncComponent(() => import('./statusbar-user-list.vue'));
</script>

<style lang="scss" scoped>
.dlrsnxqu {
	--height: 24px;
	background: var(--panel);
	font-size: 0.85em;

	&.verySmall {
		--height: 16px;
		font-size: 0.75em;
	}

	&.small {
		--height: 20px;
		font-size: 0.8em;
	}

	&.large {
		--height: 26px;
		font-size: 0.875em;
	}

	&.veryLarge {
		--height: 30px;
		font-size: 0.9em;
	}

	> .item {
		display: inline-flex;
		vertical-align: bottom;
		width: 100%;
		line-height: var(--height);
		height: var(--height);
		overflow: hidden; overflow: clip;
		contain: strict;

		> .name {
			padding: 0 6px;
			font-weight: bold;
			color: var(--accent);
		}

		> .body {
			min-width: 0;
			flex: 1;
		}

		&.black {
			background: #000;
			color: #fff;
		}
	}
}
</style>
