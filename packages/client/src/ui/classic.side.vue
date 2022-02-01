<template>
<div v-if="component" class="qvzfzxam _narrow_">
	<div class="container">
		<header class="header" @contextmenu.prevent.stop="onContextmenu">
			<button v-if="history.length > 0" class="_button" @click="back()"><i class="fas fa-chevron-left"></i></button>
			<button v-else class="_button" style="pointer-events: none;"><!-- マージンのバランスを取るためのダミー --></button>
			<span class="title" v-text="pageInfo?.title" />
			<button class="_button" @click="close()"><i class="fas fa-times"></i></button>
		</header>
		<MkHeader class="pageHeader" :info="pageInfo"/>
		<component :is="component" v-bind="props" :ref="changePage"/>
	</div>
</div>
</template>

<script lang="ts" setup>
import { provide } from 'vue';
import * as os from '@/os';
import copyToClipboard from '@/scripts/copy-to-clipboard';
import { resolve, router } from '@/router';
import { url as root } from '@/config';
import * as symbols from '@/symbols';
import { i18n } from '@/i18n';

provide('navHook', navigate);

let path: string | null = $ref(null);
let component: ReturnType<typeof resolve>['component'] | null = $ref(null);
let props: any | null = $ref(null);
let pageInfo: any | null = $ref(null);
let history: string[] = $ref([]);

let url = $computed(() => `${root}${path}`);

function changePage(page) {
	if (page == null) return;
	if (page[symbols.PAGE_INFO]) {
		pageInfo = page[symbols.PAGE_INFO];
	}
}

function navigate(_path: string, record = true) {
	if (record && path) history.push($$(path).value);
	path = _path;
	const resolved = resolve(path);
	component = resolved.component;
	props = resolved.props;
}

function back() {
	const prev = history.pop();
	if (prev) navigate(prev, false);
}

function close() {
	path = null;
	component = null;
	props = {};
}

function onContextmenu(ev: MouseEvent) {
	os.contextMenu([{
		type: 'label',
		text: path || '',
	}, {
		icon: 'fas fa-expand-alt',
		text: i18n.ts.showInPage,
		action: () => {
			if (path) router.push(path);
			close();
		}
	}, {
		icon: 'fas fa-window-maximize',
		text: i18n.ts.openInWindow,
		action: () => {
			if (path) os.pageWindow(path);
			close();
		}
	}, null, {
		icon: 'fas fa-external-link-alt',
		text: i18n.ts.openInNewTab,
		action: () => {
			window.open(url, '_blank');
			close();
		}
	}, {
		icon: 'fas fa-link',
		text: i18n.ts.copyLink,
		action: () => {
			copyToClipboard(url);
		}
	}], ev);
}

defineExpose({
	navigate,
	back,
	close,
});
</script>

<style lang="scss" scoped>
.qvzfzxam {
	$header-height: 58px; // TODO: どこかに集約したい

	--root-margin: 16px;
	--margin: var(--marginHalf);

	> .container {
		position: fixed;
		width: 370px;
		height: 100vh;
		overflow: auto;
		box-sizing: border-box;

		> .header {
			display: flex;
			position: sticky;
			z-index: 1000;
			top: 0;
			height: $header-height;
			width: 100%;
			line-height: $header-height;
			text-align: center;
			font-weight: bold;
			//background-color: var(--panel);
			-webkit-backdrop-filter: var(--blur, blur(32px));
			backdrop-filter: var(--blur, blur(32px));
			background-color: var(--header);

			> ._button {
				height: $header-height;
				width: $header-height;

				&:hover {
					color: var(--fgHighlighted);
				}
			}

			> .title {
				flex: 1;
				position: relative;
			}
		}
	}
}
</style>

