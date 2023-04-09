<template>
<MkModal ref="modal" @click="$emit('click')" @closed="$emit('closed')">
	<div ref="rootEl" class="hrmcaedk" :style="{ width: `${width}px`, height: (height ? `min(${height}px, 100%)` : '100%') }">
		<div class="header" @contextmenu="onContextmenu">
			<button v-if="history.length > 0" v-tooltip="i18n.ts.goBack" class="_button" @click="back()"><i class="ti ti-arrow-left"></i></button>
			<span v-else style="display: inline-block; width: 20px"></span>
			<span v-if="pageMetadata?.value" class="title">
				<i v-if="pageMetadata?.value.icon" class="icon" :class="pageMetadata?.value.icon"></i>
				<span>{{ pageMetadata?.value.title }}</span>
			</span>
			<button class="_button" @click="$refs.modal.close()"><i class="ti ti-x"></i></button>
		</div>
		<div class="body" style="container-type: inline-size;">
			<MkStickyContainer>
				<template #header><MkPageHeader v-if="pageMetadata?.value && !pageMetadata?.value.hideHeader" :info="pageMetadata?.value"/></template>
				<RouterView :router="router"/>
			</MkStickyContainer>
		</div>
	</div>
</MkModal>
</template>

<script lang="ts" setup>
import { ComputedRef, provide } from 'vue';
import MkModal from '@/components/MkModal.vue';
import { popout as _popout } from '@/scripts/popout';
import copyToClipboard from '@/scripts/copy-to-clipboard';
import { url } from '@/config';
import * as os from '@/os';
import { mainRouter, routes } from '@/router';
import { i18n } from '@/i18n';
import { PageMetadata, provideMetadataReceiver } from '@/scripts/page-metadata';
import { Router } from '@/nirax';

const props = defineProps<{
	initialPath: string;
}>();

defineEmits<{
	(ev: 'closed'): void;
	(ev: 'click'): void;
}>();

const router = new Router(routes, props.initialPath);

router.addListener('push', ctx => {
	
});

let pageMetadata = $ref<null | ComputedRef<PageMetadata>>();
let rootEl = $ref();
let modal = $shallowRef<InstanceType<typeof MkModal>>();
let path = $ref(props.initialPath);
let width = $ref(860);
let height = $ref(660);
const history = [];

provide('router', router);
provideMetadataReceiver((info) => {
	pageMetadata = info;
});
provide('shouldOmitHeaderTitle', true);
provide('shouldHeaderThin', true);

const pageUrl = $computed(() => url + path);
const contextmenu = $computed(() => {
	return [{
		type: 'label',
		text: path,
	}, {
		icon: 'ti ti-player-eject',
		text: i18n.ts.showInPage,
		action: expand,
	}, {
		icon: 'ti ti-window-maximize',
		text: i18n.ts.popout,
		action: popout,
	}, null, {
		icon: 'ti ti-external-link',
		text: i18n.ts.openInNewTab,
		action: () => {
			window.open(pageUrl, '_blank');
			modal.close();
		},
	}, {
		icon: 'ti ti-link',
		text: i18n.ts.copyLink,
		action: () => {
			copyToClipboard(pageUrl);
		},
	}];
});

function navigate(path, record = true) {
	if (record) history.push(router.getCurrentPath());
	router.push(path);
}

function back() {
	navigate(history.pop(), false);
}

function expand() {
	mainRouter.push(path);
	modal.close();
}

function popout() {
	_popout(path, rootEl);
	modal.close();
}

function onContextmenu(ev: MouseEvent) {
	os.contextMenu(contextmenu, ev);
}
</script>

<style lang="scss" scoped>
.hrmcaedk {
	margin: auto;
	overflow: hidden;
	display: flex;
	flex-direction: column;
	contain: content;
	border-radius: var(--radius);

	--root-margin: 24px;

	@media (max-width: 500px) {
		--root-margin: 16px;
	}

	> .header {
		$height: 52px;
		$height-narrow: 42px;
		display: flex;
		flex-shrink: 0;
		height: $height;
		line-height: $height;
		font-weight: bold;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		background: var(--windowHeader);
		-webkit-backdrop-filter: var(--blur, blur(15px));
		backdrop-filter: var(--blur, blur(15px));

		> button {
			height: $height;
			width: $height;

			&:hover {
				color: var(--fgHighlighted);
			}
		}

		@media (max-width: 500px) {
			height: $height-narrow;
			line-height: $height-narrow;
			padding-left: 16px;

			> button {
				height: $height-narrow;
				width: $height-narrow;
			}
		}

		> .title {
			flex: 1;

			> .icon {
				margin-right: 0.5em;
			}
		}
	}

	> .body {
		overflow: auto;
		background: var(--bg);
	}
}
</style>
