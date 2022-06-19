<template>
<div v-if="show" ref="el" class="fdidabkb" :class="{ slim: narrow, thin: thin_ }" :style="{ background: bg }" @click="onClick">
	<template v-if="metadata">
		<div v-if="!hideTitle" class="titleContainer" @click="showTabsPopup">
			<MkAvatar v-if="metadata.avatar" class="avatar" :user="metadata.avatar" :disable-preview="true" :show-indicator="true"/>
			<i v-else-if="metadata.icon" class="icon" :class="metadata.icon"></i>

			<div class="title">
				<MkUserName v-if="metadata.userName" :user="metadata.userName" :nowrap="true" class="title"/>
				<div v-else-if="metadata.title" class="title">{{ metadata.title }}</div>
				<div v-if="!narrow && metadata.subtitle" class="subtitle">
					{{ metadata.subtitle }}
				</div>
				<div v-if="narrow && hasTabs" class="subtitle activeTab">
					{{ tabs.find(tab => tab.active)?.title }}
					<i class="chevron fas fa-chevron-down"></i>
				</div>
			</div>
		</div>
		<div v-if="!narrow || hideTitle" class="tabs">
			<button v-for="tab in tabs" v-tooltip="tab.title" class="tab _button" :class="{ active: tab.active }" @click="tab.onClick">
				<i v-if="tab.icon" class="icon" :class="tab.icon"></i>
				<span v-if="!tab.iconOnly" class="title">{{ tab.title }}</span>
			</button>
		</div>
	</template>
	<div class="buttons right">
		<template v-for="action in actions">
			<button v-tooltip="action.text" class="_button button" :class="{ highlighted: action.highlighted }" @click.stop="action.handler" @touchstart="preventDrag"><i :class="action.icon"></i></button>
		</template>
	</div>
</div>
</template>

<script lang="ts" setup>
import { computed, onMounted, onUnmounted, ref, inject } from 'vue';
import tinycolor from 'tinycolor2';
import { popupMenu } from '@/os';
import { scrollToTop } from '@/scripts/scroll';
import { i18n } from '@/i18n';
import { globalEvents } from '@/events';
import { injectPageMetadata, PageMetadata } from '@/scripts/page-metadata';

const props = defineProps<{
	tabs?: {
		title: string;
		active: boolean;
		icon?: string;
		iconOnly?: boolean;
		onClick: () => void;
	}[];
	actions?: {
		text: string;
		icon: string;
		handler: (ev: MouseEvent) => void;
	}[];
	thin?: boolean;
}>();

const metadata = injectPageMetadata();

const hideTitle = inject('shouldOmitHeaderTitle', false);
const thin_ = props.thin || inject('shouldHeaderThin', false);

const el = $ref<HTMLElement | null>(null);
const bg = ref(null);
const narrow = $ref(false);
const height = ref(0);
const hasTabs = $computed(() => props.tabs && props.tabs.length > 0);
const hasActions = $computed(() => props.actions && props.actions.length > 0);
const show = $computed(() => {
	return !hideTitle || hasTabs || hasActions;
});

const showTabsPopup = (ev: MouseEvent) => {
	if (!hasTabs) return;
	if (!narrow) return;
	ev.preventDefault();
	ev.stopPropagation();
	const menu = props.tabs.map(tab => ({
		text: tab.title,
		icon: tab.icon,
		action: tab.onClick,
	}));
	popupMenu(menu, ev.currentTarget ?? ev.target);
};

const preventDrag = (ev: TouchEvent) => {
	ev.stopPropagation();
};

const onClick = () => {
	scrollToTop(el, { behavior: 'smooth' });
};

const calcBg = () => {
	const rawBg = metadata?.bg || 'var(--bg)';
	const tinyBg = tinycolor(rawBg.startsWith('var(') ? getComputedStyle(document.documentElement).getPropertyValue(rawBg.slice(4, -1)) : rawBg);
	tinyBg.setAlpha(0.85);
	bg.value = tinyBg.toRgbString();
};

let ro: ResizeObserver | null;

onMounted(() => {
	calcBg();
	globalEvents.on('themeChanged', calcBg);

	if (el && el.parentElement) {
		narrow = el.parentElement.offsetWidth < 500;
		ro = new ResizeObserver((entries, observer) => {
			if (el) {
				narrow = el.parentElement.offsetWidth < 500;
			}
		});
		ro.observe(el.parentElement);
	}
});

onUnmounted(() => {
	globalEvents.off('themeChanged', calcBg);
	if (ro) ro.disconnect();
});
</script>

<style lang="scss" scoped>
.fdidabkb {
	--height: 60px;
	display: flex;
	position: sticky;
	top: var(--stickyTop, 0);
	z-index: 1000;
	width: 100%;
	-webkit-backdrop-filter: var(--blur, blur(15px));
	backdrop-filter: var(--blur, blur(15px));
	border-bottom: solid 0.5px var(--divider);

	&.thin {
		--height: 50px;

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
			margin-left: var(--height);

			> *:first-child {
				margin-left: auto;
			}

			> *:last-child {
				margin-right: auto;
			}
		}
	}

	> .buttons {
		--margin: 8px;
		display: flex;
    align-items: center;
		height: var(--height);
		margin: 0 var(--margin);

		&.right {
			margin-left: auto;
		}

		&:empty {
			width: var(--height);
		}

		> .button {
			display: flex;
			align-items: center;
			justify-content: center;
			height: calc(var(--height) - (var(--margin) * 2));
			width: calc(var(--height) - (var(--margin) * 2));
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

		> .fullButton {
			& + .fullButton {
				margin-left: 12px;
			}
		}
	}

	> .titleContainer {
		display: flex;
		align-items: center;
		max-width: 400px;
		overflow: auto;
		white-space: nowrap;
		text-align: left;
		font-weight: bold;
		flex-shrink: 0;
		margin-left: 24px;

		> .avatar {
			$size: 32px;
			display: inline-block;
			width: $size;
			height: $size;
			vertical-align: bottom;
			margin: 0 8px;
			pointer-events: none;
		}

		> .icon {
			margin-right: 8px;
		}

		> .title {
			min-width: 0;
			overflow: hidden;
			text-overflow: ellipsis;
			white-space: nowrap;
			line-height: 1.1;

			> .subtitle {
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
		}
	}

	> .tabs {
		margin-left: 16px;
		font-size: 0.8em;
		overflow: auto;
		white-space: nowrap;

		> .tab {
			display: inline-block;
			position: relative;
			padding: 0 10px;
			height: 100%;
			font-weight: normal;
			opacity: 0.7;

			&:hover {
				opacity: 1;
			}

			&.active {
				opacity: 1;

				&:after {
					content: "";
					display: block;
					position: absolute;
					bottom: 0;
					left: 0;
					right: 0;
					margin: 0 auto;
					width: 100%;
					height: 3px;
					background: var(--accent);
				}
			}

			> .icon + .title {
				margin-left: 8px;
			}
		}
	}
}
</style>
