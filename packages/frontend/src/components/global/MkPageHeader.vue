<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div v-if="show" ref="el" :class="[$style.root]" :style="{ background: bg }">
	<div :class="[$style.upper, { [$style.slim]: narrow, [$style.thin]: thin_ }]">
		<div v-if="!thin_ && narrow && props.displayMyAvatar && $i" class="_button" :class="$style.buttonsLeft" @click="openAccountMenu">
			<MkAvatar :class="$style.avatar" :user="$i"/>
		</div>
		<div v-else-if="!thin_ && narrow && !hideTitle" :class="$style.buttonsLeft"/>

		<template v-if="metadata">
			<div v-if="!hideTitle" :class="$style.titleContainer" @click="top">
				<div v-if="metadata.avatar" :class="$style.titleAvatarContainer">
					<MkAvatar :class="$style.titleAvatar" :user="metadata.avatar" indicator/>
				</div>
				<i v-else-if="metadata.icon" :class="[$style.titleIcon, metadata.icon]"></i>

				<div :class="$style.title">
					<MkUserName v-if="metadata.userName" :user="metadata.userName" :nowrap="true"/>
					<div v-else-if="metadata.title">{{ metadata.title }}</div>
					<div v-if="metadata.subtitle" :class="$style.subtitle">
						{{ metadata.subtitle }}
					</div>
				</div>
			</div>
			<XTabs v-if="!narrow || hideTitle" :class="$style.tabs" :tab="tab" :tabs="tabs" :rootEl="el" @update:tab="key => emit('update:tab', key)" @tabClick="onTabClick"/>
		</template>
		<div v-if="(!thin_ && narrow && !hideTitle) || (actions && actions.length > 0)" :class="$style.buttonsRight">
			<template v-for="action in actions">
				<button v-tooltip.noDelay="action.text" class="_button" :class="[$style.button, { [$style.highlighted]: action.highlighted }]" @click.stop="action.handler" @touchstart="preventDrag"><i :class="action.icon"></i></button>
			</template>
		</div>
	</div>
	<div v-if="(narrow && !hideTitle) && hasTabs" :class="[$style.lower, { [$style.slim]: narrow, [$style.thin]: thin_ }]">
		<XTabs :class="$style.tabs" :tab="tab" :tabs="tabs" :rootEl="el" @update:tab="key => emit('update:tab', key)" @tabClick="onTabClick"/>
	</div>
</div>
</template>

<script lang="ts" setup>
import { onMounted, onUnmounted, ref, inject, shallowRef, computed } from 'vue';
import tinycolor from 'tinycolor2';
import XTabs, { Tab } from './MkPageHeader.tabs.vue';
import { scrollToTop } from '@/scripts/scroll.js';
import { globalEvents } from '@/events.js';
import { injectPageMetadata } from '@/scripts/page-metadata.js';
import { $i, openAccountMenu as openAccountMenu_ } from '@/account.js';
import { PageHeaderItem } from '@/types/page-header.js';

const props = withDefaults(defineProps<{
	tabs?: Tab[];
	tab?: string;
	actions?: PageHeaderItem[] | null;
	thin?: boolean;
	displayMyAvatar?: boolean;
}>(), {
	tabs: () => ([] as Tab[]),
});

const emit = defineEmits<{
	(ev: 'update:tab', key: string);
}>();

const metadata = injectPageMetadata();

const hideTitle = inject('shouldOmitHeaderTitle', false);
const thin_ = props.thin || inject('shouldHeaderThin', false);

const el = shallowRef<HTMLElement | undefined>(undefined);
const bg = ref<string | undefined>(undefined);
const narrow = ref(false);
const hasTabs = computed(() => props.tabs.length > 0);
const hasActions = computed(() => props.actions && props.actions.length > 0);
const show = computed(() => {
	return !hideTitle || hasTabs.value || hasActions.value;
});

const preventDrag = (ev: TouchEvent) => {
	ev.stopPropagation();
};

const top = () => {
	if (el.value) {
		scrollToTop(el.value as HTMLElement, { behavior: 'smooth' });
	}
};

function openAccountMenu(ev: MouseEvent) {
	openAccountMenu_({
		withExtraOperation: true,
	}, ev);
}

function onTabClick(): void {
	top();
}

const calcBg = () => {
	const rawBg = 'var(--bg)';
	const tinyBg = tinycolor(rawBg.startsWith('var(') ? getComputedStyle(document.documentElement).getPropertyValue(rawBg.slice(4, -1)) : rawBg);
	tinyBg.setAlpha(0.85);
	bg.value = tinyBg.toRgbString();
};

let ro: ResizeObserver | null;

onMounted(() => {
	calcBg();
	globalEvents.on('themeChanged', calcBg);

	if (el.value && el.value.parentElement) {
		narrow.value = el.value.parentElement.offsetWidth < 500;
		ro = new ResizeObserver((entries, observer) => {
			if (el.value && el.value.parentElement && document.body.contains(el.value as HTMLElement)) {
				narrow.value = el.value.parentElement.offsetWidth < 500;
			}
		});
		ro.observe(el.value.parentElement as HTMLElement);
	}
});

onUnmounted(() => {
	globalEvents.off('themeChanged', calcBg);
	if (ro) ro.disconnect();
});
</script>

<style lang="scss" module>
.root {
	-webkit-backdrop-filter: var(--blur, blur(15px));
	backdrop-filter: var(--blur, blur(15px));
	border-bottom: solid 0.5px var(--divider);
	width: 100%;
}

.upper,
.lower {
	width: 100%;
	background: transparent;
}

.upper {
	--height: 50px;
	display: flex;
	gap: var(--margin);
	height: var(--height);

	.tabs:first-child {
		margin-left: auto;
		padding: 0 12px;
	}
	.tabs {
		margin-right: auto;
	}

	&.thin {
		--height: 40px;

		> .buttons {
			> .button {
				font-size: 0.9em;
			}
		}
	}

	&.slim {
		text-align: center;
		gap: 0;

		.tabs:first-child {
			margin-left: 0;
		}
		> .titleContainer {
			margin: 0 auto;
			max-width: 100%;
		}
	}
}

.lower {
	--height: 40px;
	height: var(--height);
}

.buttons {
	--margin: 8px;
	display: flex;
	align-items: center;
	min-width: var(--height);
	height: var(--height);
	&:empty {
		width: var(--height);
	}
}

.buttonsLeft {
	composes: buttons;
	margin: 0 var(--margin) 0 0;
}

.buttonsRight {
	composes: buttons;
	margin: 0 0 0 var(--margin);
}

.avatar {
	$size: 32px;
	display: inline-block;
	width: $size;
	height: $size;
	vertical-align: bottom;
	margin: 0 8px;
}

.button {
	display: flex;
	align-items: center;
	justify-content: center;
	height: var(--height);
	width: calc(var(--height) - (var(--margin)));
	box-sizing: border-box;
	position: relative;
	border-radius: 5px;

	&:hover {
		background: rgba(0, 0, 0, 0.05);
	}

	&.highlighted {
		color: var(--accent);
	}
}

.fullButton {
	& + .fullButton {
		margin-left: 12px;
	}
}

.titleContainer {
	display: flex;
	align-items: center;
	max-width: min(30vw, 400px);
	overflow: clip;
	white-space: nowrap;
	text-align: left;
	font-weight: bold;
	flex-shrink: 1;
	margin-left: 24px;
}

.titleAvatarContainer {
	$size: 32px;
	contain: strict;
	overflow: clip;
	width: $size;
	height: $size;
	padding: 8px;
	flex-shrink: 0;
}

.titleAvatar {
	width: 100%;
	height: 100%;
	pointer-events: none;
}

.titleIcon {
	margin-right: 8px;
	width: 16px;
	text-align: center;
}

.title {
	min-width: 0;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
	line-height: 1.1;
}

.subtitle {
	opacity: 0.6;
	font-size: 0.8em;
	font-weight: normal;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;

	&.activeTab {
		text-align: center;

		> .chevron {
			display: inline-block;
			margin-left: 6px;
		}
	}
}
</style>
