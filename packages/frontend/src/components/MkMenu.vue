<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div
	role="menu"
	:class="{
		[$style.root]: true,
		[$style.asDrawer]: asDrawer,
	}"
	@focusin.passive.stop="() => {}"
>
	<div
		ref="itemsEl"
		v-hotkey="keymap"
		tabindex="0"
		class="_popup _shadow"
		:class="$style.menu"
		:style="{
			width: (width && !asDrawer) ? `${width}px` : '',
			maxHeight: maxHeight ? `min(${maxHeight}px, calc(100dvh - 32px))` : 'calc(100dvh - 32px)',
		}"
		@keydown.stop="() => {}"
		@contextmenu.self.prevent="() => {}"
	>
		<XItem
			v-for="item in items2 ?? []"
			:item="item"
			:childShowingItem="childShowingItem"
			:asDrawer="asDrawer"
			:big="big"
			:center="align === 'center'"
			@close="close"
			@showRadioOptions="showRadioOptions"
			@showChildren="showChildren"
			@onItemMouseEnter="onItemMouseEnter"
			@onItemMouseLeave="onItemMouseLeave"
		/>
		<span v-if="items2 == null || items2.length === 0" tabindex="-1" :class="[$style.none, $style.item]">
			<span>{{ i18n.ts.none }}</span>
		</span>
	</div>
	<div v-if="childMenu">
		<XChild ref="child" :items="childMenu" :targetElement="childTarget!" :rootElement="itemsEl!" @actioned="childActioned" @closed="closeChild"/>
	</div>
</div>
</template>

<script lang="ts">
import { computed, defineAsyncComponent, inject, nextTick, onBeforeUnmount, onMounted, ref, shallowRef, watch } from 'vue';
import { MenuItem, InnerMenuItem, MenuPending, MenuRadio, MenuRadioOption, MenuParent } from '@/types/menu.js';
import * as os from '@/os.js';
import { i18n } from '@/i18n.js';
import { isTouchUsing } from '@/scripts/touch.js';
import { type Keymap } from '@/scripts/hotkey.js';
import { isFocusable } from '@/scripts/focus.js';
import { getNodeOrNull } from '@/scripts/get-dom-node-or-null.js';

const childrenCache = new WeakMap<MenuParent, MenuItem[]>();
</script>

<script lang="ts" setup>
import XItem from '@/components/MkMenu.item.vue';

const XChild = defineAsyncComponent(() => import('./MkMenu.child.vue'));

const props = defineProps<{
	items: MenuItem[];
	asDrawer?: boolean;
	align?: 'center' | string;
	width?: number;
	maxHeight?: number;
}>();

const emit = defineEmits<{
	(ev: 'close', actioned?: boolean): void;
	(ev: 'hide'): void;
}>();

const big = isTouchUsing;

const isNestingMenu = inject<boolean>('isNestingMenu', false);

const itemsEl = shallowRef<HTMLElement>();

const items2 = ref<InnerMenuItem[]>();

const child = shallowRef<InstanceType<typeof XChild>>();

const keymap = {
	'up|k|shift+tab': {
		allowRepeat: true,
		callback: () => focusUp(),
	},
	'down|j|tab': {
		allowRepeat: true,
		callback: () => focusDown(),
	},
	'esc': {
		allowRepeat: true,
		callback: () => close(false),
	},
} as const satisfies Keymap;

const childShowingItem = ref<MenuItem | null>();

watch(() => props.items, () => {
	const items = [...props.items].filter(item => item !== undefined) as (NonNullable<MenuItem> | MenuPending)[];

	for (let i = 0; i < items.length; i++) {
		const item = items[i];

		if ('then' in item) { // if item is Promise
			items[i] = { type: 'pending' };
			item.then(actualItem => {
				if (items2.value?.[i]) items2.value[i] = actualItem;
			});
		}
	}

	items2.value = items as InnerMenuItem[];
}, {
	immediate: true,
});

const childMenu = ref<MenuItem[] | null>();
const childTarget = shallowRef<HTMLElement | null>();

function closeChild() {
	childMenu.value = null;
	childShowingItem.value = null;
}

function childActioned() {
	closeChild();
	close(true);
}

let childCloseTimer: null | number = null;

function onItemMouseEnter() {
	childCloseTimer = window.setTimeout(() => {
		closeChild();
	}, 300);
}

function onItemMouseLeave() {
	if (childCloseTimer) window.clearTimeout(childCloseTimer);
}

async function showRadioOptions(item: MenuRadio, ev: Event) {
	const children: MenuItem[] = Object.keys(item.options).map<MenuRadioOption>(key => {
		const value = item.options[key];
		return {
			type: 'radioOption',
			text: key,
			action: () => {
				item.ref = value;
			},
			active: computed(() => item.ref === value),
		};
	});

	if (props.asDrawer) {
		os.popupMenu(children, ev.currentTarget ?? ev.target).finally(() => {
			close(false);
		});
		emit('hide');
	} else {
		childTarget.value = (ev.currentTarget ?? ev.target) as HTMLElement;
		childMenu.value = children;
		childShowingItem.value = item;
	}
}

async function showChildren(item: MenuParent, ev: Event) {
	ev.stopPropagation();

	const children: MenuItem[] = await (async () => {
		if (childrenCache.has(item)) {
			return childrenCache.get(item)!;
		} else {
			if (typeof item.children === 'function') {
				return Promise.resolve(item.children());
			} else {
				return item.children;
			}
		}
	})();

	childrenCache.set(item, children);

	if (props.asDrawer) {
		os.popupMenu(children, ev.currentTarget ?? ev.target).finally(() => {
			close(false);
		});
		emit('hide');
	} else {
		childTarget.value = (ev.currentTarget ?? ev.target) as HTMLElement;
		// これでもリアクティビティは保たれる
		childMenu.value = children;
		childShowingItem.value = item;
	}
}

function close(actioned = false) {
	disposeHandlers();
	nextTick(() => {
		closeChild();
		emit('close', actioned);
	});
}

function focusUp() {
	if (disposed) return;
	if (!itemsEl.value?.contains(document.activeElement)) return;

	const focusableElements = Array.from(itemsEl.value.children).filter(isFocusable);
	const activeIndex = focusableElements.findIndex(el => el === document.activeElement);
	const targetIndex = (activeIndex !== -1 && activeIndex !== 0) ? (activeIndex - 1) : (focusableElements.length - 1);
	const targetElement = focusableElements.at(targetIndex) ?? itemsEl.value;

	targetElement.focus();
}

function focusDown() {
	if (disposed) return;
	if (!itemsEl.value?.contains(document.activeElement)) return;

	const focusableElements = Array.from(itemsEl.value.children).filter(isFocusable);
	const activeIndex = focusableElements.findIndex(el => el === document.activeElement);
	const targetIndex = (activeIndex !== -1 && activeIndex !== (focusableElements.length - 1)) ? (activeIndex + 1) : 0;
	const targetElement = focusableElements.at(targetIndex) ?? itemsEl.value;

	targetElement.focus();
}

const onGlobalFocusin = (ev: FocusEvent) => {
	if (disposed) return;
	if (itemsEl.value?.parentElement?.contains(getNodeOrNull(ev.target))) return;
	nextTick(() => {
		if (itemsEl.value != null && isFocusable(itemsEl.value)) {
			itemsEl.value.focus({ preventScroll: true });
			nextTick(() => focusDown());
		}
	});
};

const onGlobalMousedown = (ev: MouseEvent) => {
	if (disposed) return;
	if (childTarget.value?.contains(getNodeOrNull(ev.target))) return;
	if (child.value?.checkHit(ev)) return;
	closeChild();
};

const setupHandlers = () => {
	if (!isNestingMenu) {
		document.addEventListener('focusin', onGlobalFocusin, { passive: true });
	}
	document.addEventListener('mousedown', onGlobalMousedown, { passive: true });
};

let disposed = false;

const disposeHandlers = () => {
	disposed = true;
	if (!isNestingMenu) {
		document.removeEventListener('focusin', onGlobalFocusin);
	}
	document.removeEventListener('mousedown', onGlobalMousedown);
};

onMounted(() => {
	setupHandlers();

	if (!isNestingMenu) {
		nextTick(() => itemsEl.value?.focus({ preventScroll: true }));
	}
});

onBeforeUnmount(() => {
	disposeHandlers();
});
</script>

<style lang="scss" module>
.root {
	&.asDrawer {
		max-width: 600px;
		margin: auto;

		> .menu {
			padding: 12px 0 max(env(safe-area-inset-bottom, 0px), 12px) 0;
			width: 100%;
			border-radius: 24px;
			border-bottom-right-radius: 0;
			border-bottom-left-radius: 0;
		}
	}
}

.menu {
	padding: 8px 0;
	box-sizing: border-box;
	max-width: 100vw;
	min-width: 200px;
	overflow: auto;
	overscroll-behavior: contain;

	&:focus-visible {
		outline: none;
	}
}
</style>
