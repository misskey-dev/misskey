<template>
<div v-if="show" ref="el" :class="[$style.root]" :style="{ background: bg }">
	<div :class="[$style.upper, { [$style.slim]: narrow, [$style.thin]: thin_ }]">
		<div v-if="narrow && props.displayMyAvatar && $i" class="_button" :class="$style.buttonsLeft" @click="openAccountMenu">
			<MkAvatar :class="$style.avatar" :user="$i" />
		</div>
		<div v-else-if="narrow && !hideTitle" :class="$style.buttonsLeft" />

		<template v-if="metadata">
			<div v-if="!hideTitle" :class="$style.titleContainer" @click="top">
				<MkAvatar v-if="metadata.avatar" :class="$style.titleAvatar" :user="metadata.avatar" indicator/>
				<i v-else-if="metadata.icon" :class="[$style.titleIcon, metadata.icon]"></i>

				<div :class="$style.title">
					<MkUserName v-if="metadata.userName" :user="metadata.userName" :nowrap="true"/>
					<div v-else-if="metadata.title">{{ metadata.title }}</div>
					<div v-if="metadata.subtitle" :class="$style.subtitle">
						{{ metadata.subtitle }}
					</div>
				</div>
			</div>
			<div v-if="!narrow || hideTitle" :class="$style.tabs" @wheel="onTabWheel">
				<div :class="$style.tabsInner">
					<button v-for="t in tabs" :ref="(el) => tabRefs[t.key] = (el as HTMLElement)" v-tooltip.noDelay="t.title" class="_button" :class="[$style.tab, { [$style.active]: t.key != null && t.key === props.tab }]" @mousedown="(ev) => onTabMousedown(t, ev)" @click="(ev) => onTabClick(t, ev)">
						<div :class="$style.tabInner">
							<i v-if="t.icon" :class="[$style.tabIcon, t.icon]"></i>
							<div v-if="!t.iconOnly" :class="$style.tabTitle">{{ t.title }}</div>
							<Transition
								v-else
								@enter="enter"
								@after-enter="afterEnter"
								@leave="leave"
								@after-leave="afterLeave"
								mode="in-out"
							>
								<div v-if="t.key === tab" :class="$style.tabTitle">{{ t.title }}</div>
							</Transition>
						</div>
					</button>
				</div>
				<div ref="tabHighlightEl" :class="$style.tabHighlight"></div>
			</div>
		</template>
		<div v-if="(narrow && !hideTitle) || (actions && actions.length > 0)" :class="$style.buttonsRight">
			<template v-for="action in actions">
				<button v-tooltip.noDelay="action.text" class="_button" :class="[$style.button, { [$style.highlighted]: action.highlighted }]" @click.stop="action.handler" @touchstart="preventDrag"><i :class="action.icon"></i></button>
			</template>
		</div>
	</div>
	<div v-if="(narrow && !hideTitle) && hasTabs" :class="[$style.lower, { [$style.slim]: narrow, [$style.thin]: thin_ }]">
		<div :class="$style.tabs" @wheel="onTabWheel">
			<div :class="$style.tabsInner">
				<button v-for="tab in tabs" :ref="(el) => tabRefs[tab.key] = (el as HTMLElement)" v-tooltip.noDelay="tab.title" class="_button" :class="[$style.tab, { [$style.active]: tab.key != null && tab.key === props.tab }]" @mousedown="(ev) => onTabMousedown(tab, ev)" @click="(ev) => onTabClick(tab, ev)">
					<i v-if="tab.icon" :class="[$style.tabIcon, tab.icon]"></i>
					<span v-if="!tab.iconOnly" :class="$style.tabTitle">{{ tab.title }}</span>
				</button>
			</div>
			<div ref="tabHighlightEl" :class="$style.tabHighlight"></div>
		</div>
	</div>
</div>
</template>

<script lang="ts" setup>
import { onMounted, onUnmounted, ref, inject, watch, nextTick } from 'vue';
import tinycolor from 'tinycolor2';
import { scrollToTop } from '@/scripts/scroll';
import { globalEvents } from '@/events';
import { injectPageMetadata } from '@/scripts/page-metadata';
import { $i, openAccountMenu as openAccountMenu_ } from '@/account';

type Tab = {
	key: string;
	title: string;
	icon?: string;
	iconOnly?: boolean;
	onClick?: (ev: MouseEvent) => void;
};

const props = withDefaults(defineProps<{
	tabs?: Tab[];
	tab?: string;
	actions?: {
		text: string;
		icon: string;
		highlighted?: boolean;
		handler: (ev: MouseEvent) => void;
	}[];
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

let el = $shallowRef<HTMLElement | undefined>(undefined);
const tabRefs: Record<string, HTMLElement | null> = {};
let tabHighlightEl = $shallowRef<HTMLElement | null>(null);
const bg = ref<string | undefined>(undefined);
let narrow = $ref(false);
const hasTabs = $computed(() => props.tabs.length > 0);
const hasActions = $computed(() => props.actions && props.actions.length > 0);
const show = $computed(() => {
	return !hideTitle || hasTabs || hasActions;
});

const preventDrag = (ev: TouchEvent) => {
	ev.stopPropagation();
};

const top = () => {
	if (el) {
		scrollToTop(el as HTMLElement, { behavior: 'smooth' });
	}
};

function openAccountMenu(ev: MouseEvent) {
	openAccountMenu_({
		withExtraOperation: true,
	}, ev);
}

function onTabMousedown(tab: Tab, ev: MouseEvent): void {
	// ユーザビリティの観点からmousedown時にはonClickは呼ばない
	if (tab.key) {
		emit('update:tab', tab.key);
	}
}

function onTabClick(t: Tab, ev: MouseEvent): void {
	if (t.key === props.tab) {
		top();
	} else if (t.onClick) {
		ev.preventDefault();
		ev.stopPropagation();
		t.onClick(ev);
	}

	if (t.key) {
		emit('update:tab', t.key);
	}
}

const calcBg = () => {
	const rawBg = metadata?.bg || 'var(--bg)';
	const tinyBg = tinycolor(rawBg.startsWith('var(') ? getComputedStyle(document.documentElement).getPropertyValue(rawBg.slice(4, -1)) : rawBg);
	tinyBg.setAlpha(0.85);
	bg.value = tinyBg.toRgbString();
};

let ro1: ResizeObserver | null;
let ro2: ResizeObserver | null;

function renderTab() {
	const tabEl = props.tab ? tabRefs[props.tab] : undefined;
	if (tabEl && tabHighlightEl && tabHighlightEl.parentElement) {
		// offsetWidth や offsetLeft は少数を丸めてしまうため getBoundingClientRect を使う必要がある
		// https://developer.mozilla.org/ja/docs/Web/API/HTMLElement/offsetWidth#%E5%80%A4
		const parentRect = tabHighlightEl.parentElement.getBoundingClientRect();
		const rect = tabEl.getBoundingClientRect();
		tabHighlightEl.style.width = rect.width + 'px';
		tabHighlightEl.style.left = (rect.left - parentRect.left + tabHighlightEl.parentElement.scrollLeft) + 'px';
	}
}

function onTabWheel(ev: WheelEvent) {
	if (ev.deltaY !== 0 && ev.deltaX === 0) {
		ev.preventDefault();
		ev.stopPropagation();
		(ev.currentTarget as HTMLElement).scrollBy({
			left: ev.deltaY,
			behavior: 'smooth',
		});
	}
	return false;
}

function enter(el: HTMLElement) {
	const elementWidth = el.getBoundingClientRect().width;
	el.style.width = '0';
	el.offsetWidth; // reflow
	el.style.width = elementWidth + 'px';
	setTimeout(renderTab, 70);
}
function afterEnter(el: HTMLElement) {
	el.style.width = '';
	nextTick(renderTab);
}
function leave(el: HTMLElement) {
	const elementWidth = el.getBoundingClientRect().width;
	el.style.width = elementWidth + 'px';
	el.offsetWidth; // reflow
	el.style.width = '0';
}
function afterLeave(el: HTMLElement) {
	el.style.width = '';
}

onMounted(() => {
	calcBg();
	globalEvents.on('themeChanged', calcBg);

	watch([() => props.tab, () => props.tabs], () => {
		nextTick(() => renderTab());
	}, {
		immediate: true,
	});

	if (el && el.parentElement) {
		narrow = el.parentElement.offsetWidth < 500;
		ro1 = new ResizeObserver((entries, observer) => {
			if (el && el.parentElement && document.body.contains(el as HTMLElement)) {
				narrow = el.parentElement.offsetWidth < 500;
			}
		});
		ro1.observe(el.parentElement as HTMLElement);
	}

	if (el) {
		ro2 = new ResizeObserver((entries, observer) => {
			if (document.body.contains(el as HTMLElement)) {
				nextTick(() => renderTab());
			}
		});
		ro2.observe(el);
	}
});

onUnmounted(() => {
	globalEvents.off('themeChanged', calcBg);
	if (ro1) ro1.disconnect();
	if (ro2) ro2.disconnect();
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
	height: var(--height);

	.tabs:first-child {
		margin-left: auto;
	}
	.tabs:not(:first-child) {
		padding-left: 16px;
		mask-image: linear-gradient(90deg, rgba(0,0,0,0), rgb(0,0,0) 16px, rgb(0,0,0) 100%);
	}
	.tabs:last-child {
		margin-right: auto;
	}
	.tabs:not(:last-child) {
		margin-right: 0;
	}

	&.thin {
		--height: 42px;

		> .buttons {
			> .button {
				font-size: 0.9em;
			}
		}
	}

	&.slim {
		text-align: center;

		> .titleContainer {
			flex: 1;
			margin: 0 auto;
			max-width: 100%;

			> *:first-child {
				margin-left: auto;
			}

			> *:last-child {
				margin-right: auto;
			}
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
	margin: 0 var(--margin);

	&:empty {
		width: var(--height);
	}
}

.buttonsLeft {
	composes: buttons;
	margin-right: auto;
}

.buttonsRight {
	composes: buttons;
	margin-left: auto;
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
	overflow: auto;
	white-space: nowrap;
	text-align: left;
	font-weight: bold;
	flex-shrink: 0;
	margin-left: 24px;
}

.titleAvatar {
	$size: 32px;
	display: inline-block;
	width: $size;
	height: $size;
	vertical-align: bottom;
	margin: 0 8px;
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

.tabs {
	display: block;
	position: relative;
	margin: 0;
	height: var(--height);
	font-size: 0.8em;
	text-align: center;
	overflow-x: auto;
	overflow-y: hidden;
	scrollbar-width: none;

	&::-webkit-scrollbar {
		display: none;
	}
}

.tabsInner {
	display: inline-block;
	height: var(--height);
	white-space: nowrap;
}

.tab {
	display: inline-block;
	position: relative;
	padding: 0 10px;
	height: 100%;
	font-weight: normal;
	opacity: 0.7;
	transition: opacity 0.2s ease;

	&:hover {
		opacity: 1;
	}

	&.active {
		opacity: 1;
	}
}

.tabInner {
	display: flex;
	align-items: center;
}

.tabIcon + .tabTitle {
	margin-left: 8px;
} 

.tabTitle {
	overflow: hidden;
	transition: width 0.15s ease-in-out;
}

.tabHighlight {
	position: absolute;
	bottom: 0;
	height: 3px;
	background: var(--accent);
	border-radius: 999px;
	transition: width 0.15s ease, left 0.15s ease;
	pointer-events: none;
}
</style>
