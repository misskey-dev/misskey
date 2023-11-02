<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkModal ref="modal" v-slot="{ type, maxHeight }" :preferType="preferedModalType" :anchor="anchor" :transparentBg="true" :src="src" @click="modal.close()" @closed="emit('closed')">
	<div class="szkkfdyq _popup _shadow" :class="{ asDrawer: type === 'drawer' }" :style="{ maxHeight: maxHeight ? maxHeight + 'px' : '' }">
		<div class="main">
			<template v-for="item in items" :key="item.text">
				<button v-if="item.action" v-click-anime class="_button item" :class="{gamingDark: gamingType === 'dark',gamingLight: gamingType === 'light' }" @click="$event => { item.action($event); close(); }">
					<i class="icon" :class="item.icon"></i>
					<div class="text">{{ item.text }}</div>
					<span v-if="item.indicate && item.indicateValue && indicatorCounterToggle" class="_indicateCounter indicatorWithValue">{{ item.indicateValue }}</span>
					<span v-else-if="item.indicate" class="indicator"><i class="_indicatorCircle"></i></span>
				</button>
				<MkA v-else v-click-anime :to="item.to" class="item" :class="{gamingDark: gamingType === 'dark',gamingLight: gamingType === 'light' }" @click.passive="close()">
					<i class="icon" :class="item.icon"></i>
					<div class="text">{{ item.text }}</div>
					<span v-if="item.indicate && item.indicateValue && indicatorCounterToggle" class="_indicateCounter indicatorWithValue">{{ item.indicateValue }}</span>
					<span v-else-if="item.indicate" class="indicator"><i class="_indicatorCircle"></i></span>
				</MkA>
			</template>
		</div>
	</div>
</MkModal>
</template>

<script lang="ts" setup>
import { ref , computed , watch} from 'vue';
import MkModal from '@/components/MkModal.vue';
import { navbarItemDef } from '@/navbar.js';
import { defaultStore } from '@/store.js';
import { deviceKind } from '@/scripts/device-kind.js';

const gamingType = computed(defaultStore.makeGetterSetter('gamingType'));
const indicatorCounterToggle = computed(defaultStore.makeGetterSetter('indicatorCounterToggle'));

const props = withDefaults(defineProps<{
	src?: HTMLElement;
	anchor?: { x: string; y: string; };
}>(), {
	anchor: () => ({ x: 'right', y: 'center' }),
});

const emit = defineEmits<{
	(ev: 'closed'): void;
}>();

const preferedModalType = (deviceKind === 'desktop' && props.src != null) ? 'popup' :
	deviceKind === 'smartphone' ? 'drawer' :
	'dialog';

const modal = $shallowRef<InstanceType<typeof MkModal>>();

const menu = defaultStore.state.menu;

const items = Object.keys(navbarItemDef).filter(k => !menu.includes(k)).map(k => navbarItemDef[k]).filter(def => def.show == null ? true : def.show).map(def => ({
	type: def.to ? 'link' : 'button',
	text: def.title,
	icon: def.icon,
	to: def.to,
	action: def.action,
	indicate: def.indicated,
	indicateValue: def.indicateValue,
}));

function close() {
	modal.close();
}
</script>

<style lang="scss" scoped>
.szkkfdyq {
	max-height: 100%;
	width: min(460px, 100vw);
	margin: auto;
	padding: 24px;
	box-sizing: border-box;
	overflow: auto;
	overscroll-behavior: contain;
	text-align: left;
	border-radius: 16px;

	&.asDrawer {
		width: 100%;
		padding: 16px 16px max(env(safe-area-inset-bottom, 0px), 16px) 16px;
		border-radius: 24px;
		border-bottom-right-radius: 0;
		border-bottom-left-radius: 0;
		text-align: center;
	}

	> .main {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));

		> .item {
			position: relative;
			display: flex;
			flex-direction: column;
			align-items: center;
			justify-content: center;
			vertical-align: bottom;
			height: 100px;
			border-radius: 10px;
      &.gamingDark:hover{
        background: linear-gradient(270deg, #e7a2a2, #e3cfa2, #ebefa1, #b3e7a6, #a6ebe7, #aec5e3, #cabded, #e0b9e3, #f4bddd);        background-size: 1800% 1800%;
        -webkit-animation: AnimationDark var(--gamingspeed) cubic-bezier(0, 0.2, 0.90, 1) infinite;
        -moz-animation: AnimationDark var(--gamingspeed) cubic-bezier(0, 0.2, 0.90, 1) infinite;
        animation: AnimationDark var(--gamingspeed) cubic-bezier(0, 0.2, 0.90, 1) infinite;
        color: black;
      }
      &.gamingLight:hover{
        background: linear-gradient(270deg, #c06161, #c0a567, #b6ba69, #81bc72, #63c3be, #8bacd6, #9f8bd6, #d18bd6, #d883b4);        background-size: 1800% 1800% !important;
        -webkit-animation: AnimationLight var(--gamingspeed) cubic-bezier(0, 0.2, 0.90, 1) infinite !important;
        -moz-animation: AnimationLight var(--gamingspeed) cubic-bezier(0, 0.2, 0.90, 1) infinite !important;
        animation: AnimationLight var(--gamingspeed) cubic-bezier(0, 0.2, 0.90, 1) infinite !important;
        color: white;
      }
			&:hover {
				color: var(--accent);
				background: var(--accentedBg);
				text-decoration: none;
			}

			> .icon {
				font-size: 24px;
				height: 24px;
			}

			> .text {
				margin-top: 12px;
				font-size: 0.8em;
				line-height: 1.5em;
			}

			> .indicatorWithValue {
				position: absolute;
				top: 32px;
				left: 16px;

				@media (max-width: 500px) {
					top: 16px;
					left: 8px;
				}
			}

			> .indicator {
				position: absolute;
				top: 32px;
				left: 32px;
				color: var(--indicator);
				font-size: 8px;
				animation: blink 1s infinite;

				@media (max-width: 500px) {
					top: 16px;
					left: 16px;
				}
			}
		}
	}
}
@-webkit-keyframes AnimationLight {
  0% {
    background-position: 0% 50%
  }
  50% {
    background-position: 100% 50%
  }
  100% {
    background-position: 0% 50%
  }
}
@-moz-keyframes AnimationLight {
  0% {
    background-position: 0% 50%
  }
  50% {
    background-position: 100% 50%
  }
  100% {
    background-position: 0% 50%
  }
}  @keyframes AnimationLight {
     0% {
       background-position: 0% 50%
     }
     50% {
       background-position: 100% 50%
     }
     100% {
       background-position: 0% 50%
     }
   }
@-webkit-keyframes AnimationDark {
  0% {
    background-position: 0% 50%
  }
  50% {
    background-position: 100% 50%
  }
  100% {
    background-position: 0% 50%
  }
}
@-moz-keyframes AnimationDark {
  0% {
    background-position: 0% 50%
  }
  50% {
    background-position: 100% 50%
  }
  100% {
    background-position: 0% 50%
  }
}
@keyframes AnimationDark {
  0% {
    background-position: 0% 50%
  }
  50% {
    background-position: 100% 50%
  }
  100% {
    background-position: 0% 50%
  }
}
</style>
