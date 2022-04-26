<template>
<a :href="to" :class="active ? activeClass : null" @click.prevent="nav" @contextmenu.prevent.stop="onContextmenu">
	<slot></slot>
</a>
</template>

<script lang="ts" setup>
import * as os from '@/os';
import copyToClipboard from '@/scripts/copy-to-clipboard';
import { router } from '@/router';
import { url } from '@/config';
import { popout as popout_ } from '@/scripts/popout';
import { i18n } from '@/i18n';
import { MisskeyNavigator } from '@/scripts/navigate';

const props = withDefaults(defineProps<{
	to: string;
	activeClass?: null | string;
	behavior?: null | 'window' | 'browser' | 'modalWindow';
}>(), {
	activeClass: null,
	behavior: null,
});

const mkNav = new MisskeyNavigator();

const active = $computed(() => {
	if (props.activeClass == null) return false;
	const resolved = router.resolve(props.to);
	if (resolved.path === router.currentRoute.value.path) return true;
	if (resolved.name == null) return false;
	if (router.currentRoute.value.name == null) return false;
	return resolved.name === router.currentRoute.value.name;
});

function onContextmenu(ev) {
	const selection = window.getSelection();
	if (selection && selection.toString() !== '') return;
	os.contextMenu([{
		type: 'label',
		text: props.to,
	}, {
		icon: 'fas fa-window-maximize',
		text: i18n.ts.openInWindow,
		action: () => {
			os.pageWindow(props.to);
		}
	}, mkNav.sideViewHook ? {
		icon: 'fas fa-columns',
		text: i18n.ts.openInSideView,
		action: () => {
			if (mkNav.sideViewHook) mkNav.sideViewHook(props.to);
		}
	} : undefined, {
		icon: 'fas fa-expand-alt',
		text: i18n.ts.showInPage,
		action: () => {
			router.push(props.to);
		}
	}, null, {
		icon: 'fas fa-external-link-alt',
		text: i18n.ts.openInNewTab,
		action: () => {
			window.open(props.to, '_blank');
		}
	}, {
		icon: 'fas fa-link',
		text: i18n.ts.copyLink,
		action: () => {
			copyToClipboard(`${url}${props.to}`);
		}
	}], ev);
}

function openWindow() {
	os.pageWindow(props.to);
}

function modalWindow() {
	os.modalPageWindow(props.to);
}

function popout() {
	popout_(props.to);
}

function nav() {
	if (props.behavior === 'browser') {
		location.href = props.to;
		return;
	}

	if (props.behavior) {
		if (props.behavior === 'window') {
			return openWindow();
		} else if (props.behavior === 'modalWindow') {
			return modalWindow();
		}
	}

	mkNav.push(props.to);
}
</script>
