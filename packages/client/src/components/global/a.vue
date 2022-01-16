<template>
<a :href="to" :class="active ? activeClass : null" @click.prevent="nav" @contextmenu.prevent.stop="onContextmenu">
	<slot></slot>
</a>
</template>

<script lang="ts" setup>
import { inject } from 'vue';
import * as os from '@/os';
import copyToClipboard from '@/scripts/copy-to-clipboard';
import { router } from '@/router';
import { url } from '@/config';
import { popout as popout_ } from '@/scripts/popout';
import { i18n } from '@/i18n';
import { defaultStore } from '@/store';

const props = withDefaults(defineProps<{
	to: string;
	activeClass?: null | string;
	behavior?: null | 'window' | 'browser' | 'modalWindow';
}>(), {
	activeClass: null,
	behavior: null,
});

const navHook = inject('navHook', null);
const sideViewHook = inject('sideViewHook', null);

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
		text: i18n.locale.openInWindow,
		action: () => {
			os.pageWindow(props.to);
		}
	}, sideViewHook ? {
		icon: 'fas fa-columns',
		text: i18n.locale.openInSideView,
		action: () => {
			sideViewHook(props.to);
		}
	} : undefined, {
		icon: 'fas fa-expand-alt',
		text: i18n.locale.showInPage,
		action: () => {
			router.push(props.to);
		}
	}, null, {
		icon: 'fas fa-external-link-alt',
		text: i18n.locale.openInNewTab,
		action: () => {
			window.open(props.to, '_blank');
		}
	}, {
		icon: 'fas fa-link',
		text: i18n.locale.copyLink,
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

	if (navHook) {
		navHook(props.to);
	} else {
		if (defaultStore.state.defaultSideView && sideViewHook && props.to !== '/') {
			return sideViewHook(props.to);
		}

		if (router.currentRoute.value.path === props.to) {
			window.scroll({ top: 0, behavior: 'smooth' });
		} else {
			router.push(props.to);
		}
	}
}
</script>
