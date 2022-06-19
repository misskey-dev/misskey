<template>
<XWindow
	ref="windowEl"
	:initial-width="500"
	:initial-height="500"
	:can-resize="true"
	:close-button="false"
	:buttons-left="buttonsLeft"
	:buttons-right="buttonsRight"
	:contextmenu="contextmenu"
	@closed="$emit('closed')"
>
	<template #header>
		<template v-if="pageMetadata?.value">
			<i v-if="pageMetadata.value.icon" class="icon" :class="pageMetadata.value.icon" style="margin-right: 0.5em;"></i>
			<span>{{ pageMetadata.value.title }}</span>
		</template>
	</template>

	<div class="yrolvcoq" :style="{ background: pageMetadata?.value?.bg }">
		<MkStickyContainer>
			<template v-if="pageMetadata?.value?.tabs" #header>
				<div :class="$style.tabs" :style="{ background: pageMetadata?.value?.bg }">
					<button v-for="tab in pageMetadata?.value?.tabs" v-tooltip="tab.title" class="tab _button" :class="{ active: tab.active }" @click="tab.onClick">
						<i v-if="tab.icon" class="icon" :class="tab.icon"></i>
						<span v-if="!tab.iconOnly" class="title">{{ tab.title }}</span>
					</button>
				</div>
			</template>
			<RouterView :router="router"/>
		</MkStickyContainer>
	</div>
</XWindow>
</template>

<script lang="ts" setup>
import { ComputedRef, inject, provide } from 'vue';
import RouterView from './global/router-view.vue';
import XWindow from '@/components/ui/window.vue';
import { popout as _popout } from '@/scripts/popout';
import copyToClipboard from '@/scripts/copy-to-clipboard';
import { url } from '@/config';
import * as os from '@/os';
import { mainRouter, routes } from '@/router';
import { Router } from '@/nirax';
import { i18n } from '@/i18n';
import { PageMetadata, provideMetadataReceiver, setPageMetadata } from '@/scripts/page-metadata';

const props = defineProps<{
	initialPath: string;
}>();

defineEmits<{
	(ev: 'closed'): void;
}>();

const router = new Router(routes, props.initialPath);

let pageMetadata = $ref<null | ComputedRef<PageMetadata>>();
let windowEl = $ref<InstanceType<typeof XWindow>>();
const history = $ref<string[]>([props.initialPath]);
const buttonsLeft = $computed(() => {
	const buttons = [{
		icon: 'fas fa-times',
		onClick: close,
	}, {
		icon: 'fas fa-ellipsis-h',
		onClick: menu,
	}];

	if (history.length > 1) {
		buttons.push({
			icon: 'fas fa-arrow-left',
			onClick: back,
		});
	}

	return buttons;
});
const buttonsRight = $computed(() => {
	const buttons = [];

	for (const action of pageMetadata?.value?.actions ?? []) {
		buttons.push({
			icon: action.icon,
			title: action.text,
			onClick: action.handler,
			highlighted: action.highlighted,
		});
	}

	return buttons;
});

router.addListener('push', ctx => {
	history.push(router.getCurrentPath());
});

provide('router', router);
provideMetadataReceiver((info) => {
	pageMetadata = info;
});
provide('shouldHeaderThin', true);

const contextmenu = $computed(() => ([{
	icon: 'fas fa-expand-alt',
	text: i18n.ts.showInPage,
	action: expand,
}, {
	icon: 'fas fa-external-link-alt',
	text: i18n.ts.popout,
	action: popout,
}, {
	icon: 'fas fa-external-link-alt',
	text: i18n.ts.openInNewTab,
	action: () => {
		window.open(url + router.getCurrentPath(), '_blank');
		windowEl.close();
	},
}, {
	icon: 'fas fa-link',
	text: i18n.ts.copyLink,
	action: () => {
		copyToClipboard(url + router.getCurrentPath());
	},
}]));

function menu(ev) {
	os.popupMenu(contextmenu, ev.currentTarget ?? ev.target);
}

function back() {
	history.pop();
	router.change(history[history.length - 1]);
}

function close() {
	windowEl.close();
}

function expand() {
	mainRouter.push(router.getCurrentPath());
	windowEl.close();
}

function popout() {
	_popout(router.getCurrentPath(), windowEl.$el);
	windowEl.close();
}

defineExpose({
	close,
});
</script>

<style lang="scss" scoped>
.yrolvcoq {
	min-height: 100%;
}
</style>

<style lang="scss" module>
.tabs {
	display: flex;
	justify-content: center;
	position: sticky;
	top: var(--stickyTop, 0);
	z-index: 1000;
	width: 100%;
	height: 45px;
	-webkit-backdrop-filter: var(--blur, blur(15px));
	backdrop-filter: var(--blur, blur(15px));
	border-bottom: solid 0.5px var(--divider);
	font-size: 0.8em;
	overflow: auto;
	white-space: nowrap;

	:global {
		.tab {
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
