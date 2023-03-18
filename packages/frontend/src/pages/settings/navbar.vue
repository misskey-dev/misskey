<template>
<div class="_gaps_m">
	<FormSlot v-model="items">
		<template #label>{{ i18n.ts.navbar }}</template>
		<MkContainer v-model="items" :show-header="false">
			<Sortable 
				v-model="items"
				:animation="150"
				class="navbar_items"
				handle=".item_handle"
				@start="e=>e.item.classList.add('active')"
				@end="e=>e.item.classList.remove('active')"
			>
				<template #item="{element,index}">
					<div
						v-if="element === '-' || navbarItemDef[element]"
						class="item _button"
					>
						<button class="item_handle _button" ><i class="ti ti-menu-2"></i></button>
						<i class="icon ti-fw" :class="navbarItemDef[element]?.icon"></i><span class="text">{{ navbarItemDef[element]?.title ?? i18n.ts.divider }}</span>
						<button class="navbar_item_remove _button" @click="removeItem(index)"><i class="ti ti-x"></i></button>
					</div>
				</template>
			</Sortable>
		</MkContainer>
		<template #caption>
			<button class="_textButton" @click="addItem">{{ i18n.ts.addItem }}</button>
		</template>
	</FormSlot>
	<MkButton danger @click="reset"><i class="ti ti-reload"></i> {{ i18n.ts.default }}</MkButton>
	<MkButton primary class="save" @click="save"><i class="ti ti-device-floppy"></i> {{ i18n.ts.save }}</MkButton>

	<MkRadios v-model="menuDisplay">
		<template #label>{{ i18n.ts.display }}</template>
		<option value="sideFull">{{ i18n.ts._menuDisplay.sideFull }}</option>
		<option value="sideIcon">{{ i18n.ts._menuDisplay.sideIcon }}</option>
		<option value="top">{{ i18n.ts._menuDisplay.top }}</option>
		<!-- <MkRadio v-model="menuDisplay" value="hide" disabled>{{ i18n.ts._menuDisplay.hide }}</MkRadio>--> <!-- TODO: サイドバーを完全に隠せるようにすると、別途ハンバーガーボタンのようなものをUIに表示する必要があり面倒 -->
	</MkRadios>
</div>
</template>

<script lang="ts" setup>
import { computed, defineAsyncComponent, ref, watch } from 'vue';
import MkRadios from '@/components/MkRadios.vue';
import MkButton from '@/components/MkButton.vue';
import FormSlot from '@/components/form/slot.vue';
import MkContainer from '@/components/MkContainer.vue';
import * as os from '@/os';
import { navbarItemDef } from '@/navbar';
import { defaultStore } from '@/store';
import { unisonReload } from '@/scripts/unison-reload';
import { i18n } from '@/i18n';
import { definePageMetadata } from '@/scripts/page-metadata';

const Sortable = defineAsyncComponent(() => import('vuedraggable').then(x => x.default));

const items = ref(defaultStore.state.menu);

const menuDisplay = computed(defaultStore.makeGetterSetter('menuDisplay'));

async function reloadAsk() {
	const { canceled } = await os.confirm({
		type: 'info',
		text: i18n.ts.reloadToApplySetting,
	});
	if (canceled) return;

	unisonReload();
}

async function addItem() {
	const menu = Object.keys(navbarItemDef).filter(k => !defaultStore.state.menu.includes(k));
	const { canceled, result: item } = await os.select({
		title: i18n.ts.addItem,
		items: [...menu.map(k => ({
			value: k, text: navbarItemDef[k].title,
		})), {
			value: '-', text: i18n.ts.divider,
		}],
	});
	if (canceled) return;
	items.value = [...items.value, item];
}

function removeItem(index: number) {
	items.value.splice(index, 1);
}

async function save() {
	defaultStore.set('menu', items.value);
	await reloadAsk();
}

function reset() {
	items.value = defaultStore.def.menu.default;
}

watch(menuDisplay, async () => {
	await reloadAsk();
});

const headerActions = $computed(() => []);

const headerTabs = $computed(() => []);

definePageMetadata({
	title: i18n.ts.navbar,
	icon: 'ti ti-list',
});
</script>
<style lang="scss">
.navbar_items {
	flex: 1;

	.item {
		position: relative;
		display: block;
		line-height: 2.85rem;
		text-overflow: ellipsis;
		overflow: hidden;
		white-space: nowrap;
		width: 100%;
		text-align: left;
		box-sizing: border-box;
		color: var(--navFg);

		.icon {
			position: relative;
			width: 32px;
			margin-right: 8px;
		}

		.text {
			position: relative;
			font-size: 0.9em;
		}

		.navbar_item_remove {
			position: absolute;
			z-index: 10000;
			width: 32px;
			height: 32px;
			color: #ff2a2a;
			right: 8px;
		}

		.item_handle{
			cursor: move;
			width: 32px;
			height: 32px;
			margin: 0 8px;
			opacity: 0.5;
		}

		&.active {
			text-decoration: none;
			color: var(--accent);

			&:before {
				content: "";
				display: block;
				height: 100%;
				width: 100%;
				aspect-ratio: 1;
				margin: auto;
				position: absolute;
				top: 0;
				left: 0;
				right: 0;
				bottom: 0;
				border-radius: 999px;
				background: var(--accentedBg);
			}

			> .icon, > .text {
				opacity: 1;
			}
		}
	}
}
</style>
