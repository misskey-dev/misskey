<template>
<div
	ref="itemsEl" v-hotkey="keymap"
	class="rrevdjwt"
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
		<MkA v-else-if="item.type === 'link'" :to="item.to" :tabindex="i" class="_button item" @click.passive="close()">
			<i v-if="item.icon" class="fa-fw" :class="item.icon"></i>
			<MkAvatar v-if="item.avatar" :user="item.avatar" class="avatar"/>
			<span>{{ item.text }}</span>
			<span v-if="item.indicate" class="indicator"><i class="fas fa-circle"></i></span>
		</MkA>
		<a v-else-if="item.type === 'a'" :href="item.href" :target="item.target" :download="item.download" :tabindex="i" class="_button item" @click="close()">
			<i v-if="item.icon" class="fa-fw" :class="item.icon"></i>
			<span>{{ item.text }}</span>
			<span v-if="item.indicate" class="indicator"><i class="fas fa-circle"></i></span>
		</a>
		<button v-else-if="item.type === 'user'" :tabindex="i" class="_button item" :class="{ active: item.active }" :disabled="item.active" @click="clicked(item.action, $event)">
			<MkAvatar :user="item.user" class="avatar"/><MkUserName :user="item.user"/>
			<span v-if="item.indicate" class="indicator"><i class="fas fa-circle"></i></span>
		</button>
		<span v-else-if="item.type === 'switch'" :tabindex="i" class="item">
			<FormSwitch v-model="item.ref" :disabled="item.disabled" class="form-switch">{{ item.text }}</FormSwitch>
		</span>
		<button v-else :tabindex="i" class="_button item" :class="{ danger: item.danger, active: item.active }" :disabled="item.active" @click="clicked(item.action, $event)">
			<i v-if="item.icon" class="fa-fw" :class="item.icon"></i>
			<MkAvatar v-if="item.avatar" :user="item.avatar" class="avatar"/>
			<span>{{ item.text }}</span>
			<span v-if="item.indicate" class="indicator"><i class="fas fa-circle"></i></span>
		</button>
	</template>
	<span v-if="items2.length === 0" class="none item">
		<span>{{ $ts.none }}</span>
	</span>
</div>
</template>

<script lang="ts" setup>
import { nextTick, onMounted, watch } from 'vue';
import { focusPrev, focusNext } from '@/scripts/focus';
import FormSwitch from '@/components/form/switch.vue';
import { MenuItem, InnerMenuItem, MenuPending, MenuAction } from '@/types/menu';

const props = defineProps<{
	items: MenuItem[];
	viaKeyboard?: boolean;
	asDrawer?: boolean;
	align?: 'center' | string;
	width?: number;
	maxHeight?: number;
}>();

const emit = defineEmits<{
	(ev: 'close'): void;
}>();

let itemsEl = $ref<HTMLDivElement>();

let items2: InnerMenuItem[] = $ref([]);

let keymap = $computed(() => ({
	'up|k|shift+tab': focusUp,
	'down|j|tab': focusDown,
	'esc': close,
}));

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

onMounted(() => {
	if (props.viaKeyboard) {
		nextTick(() => {
			focusNext(itemsEl.children[0], true, false);
		});
	}
});

function clicked(fn: MenuAction, ev: MouseEvent) {
	fn(ev);
	close();
}

function close() {
	emit('close');
}

function focusUp() {
	focusPrev(document.activeElement);
}

function focusDown() {
	focusNext(document.activeElement);
}
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
		padding: 8px 18px;
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
