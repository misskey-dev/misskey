<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<component
	:is="self ? EmA : 'a'" ref="el" :class="$style.root" class="_link" :[attr]="maybeRelativeUrl" :rel="rel ?? 'nofollow noopener'" :target="target"
	@contextmenu.stop="() => {}"
>
	<template v-if="!self">
		<span :class="$style.schema">{{ urlForDisplay.schema }}//</span>
		<span :class="$style.hostname">{{ urlForDisplay.hostname }}</span>
		<span v-if="urlForDisplay.port != ''">:{{ urlForDisplay.port }}</span>
	</template>
	<template v-if="urlForDisplay.pathname === '/' && self">
		<span :class="$style.self">{{ urlForDisplay.hostname }}</span>
	</template>
	<span v-if="urlForDisplay.pathname != ''" :class="$style.pathname">{{ self ? urlForDisplay.pathname.substring(1) : urlForDisplay.pathname }}</span>
	<span :class="$style.query">{{ urlForDisplay.query }}</span>
	<span :class="$style.hash">{{ urlForDisplay.hash }}</span>
	<i v-if="target === '_blank'" :class="$style.icon" class="ti ti-external-link"></i>
</component>
</template>

<script lang="ts" setup>
import { ref, computed } from 'vue';
import EmA from './EmA.vue';
import { url as local } from '@@/js/config.js';
import { maybeMakeRelative, parseUrlForDisplay } from '@@/js/url.js';

const props = withDefaults(defineProps<{
	url: string;
	rel?: string;
	showUrlPreview?: boolean;
}>(), {
	showUrlPreview: true,
});

const maybeRelativeUrl = computed(() => maybeMakeRelative(props.url, local));
const self = computed(() => maybeRelativeUrl.value !== props.url);
const urlForDisplay = computed(() => parseUrlForDisplay(props.url));
const attr = computed(() => self.value ? 'to' : 'href');
const target = computed(() => self.value ? null : '_blank');

const el = ref();
</script>

<style lang="scss" module>
.root {
	word-break: break-all;
}

.icon {
	padding-left: 2px;
	font-size: .9em;
}

.self {
	font-weight: bold;
}

.schema {
	opacity: 0.5;
}

.hostname {
	font-weight: bold;
}

.pathname {
	opacity: 0.8;
}

.query {
	opacity: 0.5;
}

.hash {
	font-style: italic;
}
</style>
