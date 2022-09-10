<template>
<div>
	<div
		ref="itemsEl" v-hotkey="keymap"
		class="rrevdjwt _popup _shadow"
		:class="{ center: align === 'center', asDrawer }"
		:style="{ width: (width && !asDrawer) ? width + 'px' : '', maxHeight: maxHeight ? maxHeight + 'px' : '' }"
		@contextmenu.self="e => e.preventDefault()"
	>
		<template v-for="(item, i) in items2">
			<div v-if="item === null" class="divider"></div>
			<span v-else-if="item.type === 'label'" class="label item">
				<span>{{ item.text }}</span>
			</span>
			<span v-else-if="item.type === 'pending'" :tabindex="i" class="pending item">
				<span><MkEllipsis/></span>
			</span>
			<MkA v-else-if="item.type === 'link'" :to="item.to" :tabindex="i" class="_button item" @click.passive="close(true)" @mouseenter.passive="onItemMouseEnter(item)" @mouseleave.passive="onItemMouseLeave(item)">
				<i v-if="item.icon" class="fa-fw" :class="item.icon"></i>
				<MkAvatar v-if="item.avatar" :user="item.avatar" class="avatar"/>
				<span>{{ item.text }}</span>
				<span v-if="item.indicate" class="indicator"><i class="fas fa-circle"></i></span>
			</MkA>
			<a v-else-if="item.type === 'a'" :href="item.href" :target="item.target" :download="item.download" :tabindex="i" class="_button item" @click="close(true)" @mouseenter.passive="onItemMouseEnter(item)" @mouseleave.passive="onItemMouseLeave(item)">
				<i v-if="item.icon" class="fa-fw" :class="item.icon"></i>
				<span>{{ item.text }}</span>
				<span v-if="item.indicate" class="indicator"><i class="fas fa-circle"></i></span>
			</a>
			<button v-else-if="item.type === 'user'" :tabindex="i" class="_button item" :class="{ active: item.active }" :disabled="item.active" @click="clicked(item.action, $event)" @mouseenter.passive="onItemMouseEnter(item)" @mouseleave.passive="onItemMouseLeave(item)">
				<MkAvatar :user="item.user" class="avatar"/><MkUserName :user="item.user"/>
				<span v-if="item.indicate" class="indicator"><i class="fas fa-circle"></i></span>
			</button>
			<span v-else-if="item.type === 'switch'" :tabindex="i" class="item" @mouseenter.passive="onItemMouseEnter(item)" @mouseleave.passive="onItemMouseLeave(item)">
				<FormSwitch v-model="item.ref" :disabled="item.disabled" class="form-switch">{{ item.text }}</FormSwitch>
			</span>
			<button v-else-if="item.type === 'parent'" :tabindex="i" class="_button item parent" :class="{ childShowing: childShowingItem === item }" @mouseenter="showChildren(item, $event)">
				<i v-if="item.icon" class="fa-fw" :class="item.icon"></i>
				<span>{{ item.text }}</span>
				<span class="caret"><i class="fas fa-caret-right fa-fw"></i></span>
			</button>
			<button v-else :tabindex="i" class="_button item" :class="{ danger: item.danger, active: item.active }" :disabled="item.active" @click="clicked(item.action, $event)" @mouseenter.passive="onItemMouseEnter(item)" @mouseleave.passive="onItemMouseLeave(item)">
				<i v-if="item.icon" class="fa-fw" :class="item.icon"></i>
				<MkAvatar v-if="item.avatar" :user="item.avatar" class="avatar"/>
				<span>{{ item.text }}</span>
				<span v-if="item.indicate" class="indicator"><i class="fas fa-circle"></i></span>
			</button>
		</template>
		<span v-if="items2.length === 0" class="none item">
			<span>{{ i18n.ts.none }}</span>
		</span>
	</div>
	<div v-if="childMenu" class="child">
		<XChild ref="child" :items="childMenu" :target-element="childTarget" :root-element="itemsEl" showing @actioned="childActioned"/>
	</div>
</div>
</template>

<script lang="ts" setup>
import { defineAsyncComponent, nextTick, onBeforeUnmount, onMounted, onUnmounted, Ref, ref, watch } from 'vue';
import { focusPrev, focusNext } from '@/scripts/focus';
import FormSwitch from '@/components/form/switch.vue';
import { MenuItem, InnerMenuItem, MenuPending, MenuAction } from '@/types/menu';
import * as os from '@/os';
import { i18n } from '@/i18n';

const XChild = defineAsyncComponent(() => import('./MkMenu.child.vue'));

const props = defineProps<{
	items: MenuItem[];
	viaKeyboard?: boolean;
	asDrawer?: boolean;
	align?: 'center' | string;
	width?: number;
	maxHeight?: number;
}>();

const emit = defineEmits<{
	(ev: 'close', actioned?: boolean): void;
}>();

let itemsEl = $ref<HTMLDivElement>();

let items2: InnerMenuItem[] = $ref([]);

let child = $ref<InstanceType<typeof XChild>>();

let keymap = $computed(() => ({
	'up|k|shift+tab': focusUp,
	'down|j|tab': focusDown,
	'esc': close,
}));

let childShowingItem = $ref<MenuItem | null>();

watch(() => props.items, () => {
	const items: (MenuItem | MenuPending)[] = [...props.items].filter(item => item !== undefined);

	for (let i = 0; i < items.length; i++) {
		const item = items[i];

		if (item && 'then' in item) { // if item is Promise
			items[i] = { type: 'pending' };
			item.then(actualItem => {
				items2[i] = actualItem;
			});
		}
	}

	items2 = items as InnerMenuItem[];
}, {
	immediate: true,
});

let childMenu = $ref<MenuItem[] | null>();
let childTarget = $ref<HTMLElement | null>();

function closeChild() {
	childMenu = null;
	childShowingItem = null;
}

function childActioned() {
	closeChild();
	close(true);
}

function onGlobalMousedown(event: MouseEvent) {
	if (childTarget && (event.target === childTarget || childTarget.contains(event.target))) return;
	if (child && child.checkHit(event)) return;
	closeChild();
}

let childCloseTimer: null | number = null;
function onItemMouseEnter(item) {
	childCloseTimer = window.setTimeout(() => {
		closeChild();
	}, 300);
}
function onItemMouseLeave(item) {
	if (childCloseTimer) window.clearTimeout(childCloseTimer);
}

async function showChildren(item: MenuItem, ev: MouseEvent) {
	if (props.asDrawer) {
		os.popupMenu(item.children, ev.currentTarget ?? ev.target);
		close();
	} else {
		childTarget = ev.currentTarget ?? ev.target;
		childMenu = item.children;
		childShowingItem = item;
	}
}

function clicked(fn: MenuAction, ev: MouseEvent) {
	fn(ev);
	close(true);
}

function close(actioned = false) {
	emit('close', actioned);
}

function focusUp() {
	focusPrev(document.activeElement);
}

function focusDown() {
	focusNext(document.activeElement);
}

onMounted(() => {
	if (props.viaKeyboard) {
		nextTick(() => {
			focusNext(itemsEl.children[0], true, false);
		});
	}

	document.addEventListener('mousedown', onGlobalMousedown, { passive: true });
});

onBeforeUnmount(() => {
	document.removeEventListener('mousedown', onGlobalMousedown);
});
</script>

<style lang="scss" scoped>
.rrevdjwt {
	padding: 8px 0;
	box-sizing: border-box;
	min-width: 200px;
	overflow: auto;
	overscroll-behavior: contain;

	&.center {
		> .item {
			text-align: center;
		}
	}

	> .item {
		display: block;
		position: relative;
		padding: 6px 16px;
		width: 100%;
		box-sizing: border-box;
		white-space: nowrap;
		font-size: 0.9em;
		line-height: 20px;
		text-align: left;
		overflow: hidden;
		text-overflow: ellipsis;

		&:before {
			content: "";
			display: block;
			position: absolute;
			top: 0;
			left: 0;
			right: 0;
			margin: auto;
			width: calc(100% - 16px);
			height: 100%;
			border-radius: 6px;
		}

		> * {
			position: relative;
		}

		&:not(:disabled):hover {
			color: var(--accent);
			text-decoration: none;

			&:before {
				background: var(--accentedBg);
			}
		}

		&.danger {
			color: #ff2a2a;

			&:hover {
				color: #fff;

				&:before {
					background: #ff4242;
				}
			}

			&:active {
				color: #fff;

				&:before {
					background: #d42e2e;
				}
			}
		}

		&.active {
			color: var(--fgOnAccent);
			opacity: 1;

			&:before {
				background: var(--accent);
			}
		}

		&:not(:active):focus-visible {
			box-shadow: 0 0 0 2px var(--focus) inset;
		}

		&.label {
			pointer-events: none;
			font-size: 0.7em;
			padding-bottom: 4px;

			> span {
				opacity: 0.7;
			}
		}

		&.pending {
			pointer-events: none;
			opacity: 0.7;
		}

		&.none {
			pointer-events: none;
			opacity: 0.7;
		}

		&.parent {
			display: flex;
			align-items: center;
			cursor: default;

			> .caret {
				margin-left: auto;
			}

			&.childShowing {
				color: var(--accent);
				text-decoration: none;

				&:before {
					background: var(--accentedBg);
				}
			}
		}

		> i {
			margin-right: 5px;
			width: 20px;
		}

		> .avatar {
			margin-right: 5px;
			width: 20px;
			height: 20px;
		}

		> .indicator {
			position: absolute;
			top: 5px;
			left: 13px;
			color: var(--indicator);
			font-size: 12px;
			animation: blink 1s infinite;
		}
	}

	> .divider {
		margin: 8px 0;
		border-top: solid 0.5px var(--divider);
	}

	&.asDrawer {
		padding: 12px 0 calc(env(safe-area-inset-bottom, 0px) + 12px) 0;
		width: 100%;
		border-radius: 24px;
		border-bottom-right-radius: 0;
		border-bottom-left-radius: 0;

		> .item {
			font-size: 1em;
			padding: 12px 24px;

			&:before {
				width: calc(100% - 24px);
				border-radius: 12px;
			}

			> i {
				margin-right: 14px;
				width: 24px;
			}
		}

		> .divider {
			margin: 12px 0;
		}
	}
}
</style>
