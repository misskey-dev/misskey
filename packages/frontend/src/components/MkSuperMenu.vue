<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div class="rrevdjwu" :class="{ grid }">
	<div v-for="group in def" class="group">
		<div v-if="group.title" class="title">{{ group.title }}</div>

		<div class="items">
			<template v-for="(item, i) in group.items">
				<a v-if="item.type === 'a'" :href="item.href" :target="item.target" :tabindex="i" class="_button item" :class="{ danger: item.danger, active: item.active, gamingDark: gamingType === 'dark',gamingLight: gamingType === 'light' }">
					<span v-if="item.icon" class="icon"><i :class="item.icon" class="ti-fw"></i></span>
					<span class="text">{{ item.text }}</span>
				</a>
				<button v-else-if="item.type === 'button'" :tabindex="i" class="_button item" :class="{ danger: item.danger, active: item.active , gamingDark: gamingType === 'dark',gamingLight: gamingType === 'light' }" :disabled="item.active" @click="ev => item.action(ev)">
					<span v-if="item.icon" class="icon"><i :class="item.icon" class="ti-fw"></i></span>
					<span class="text">{{ item.text }}</span>
				</button>
				<MkA v-else :to="item.to" :tabindex="i" class="_button item" :class="{ danger: item.danger, active: item.active , gamingDark: gamingType === 'dark',gamingLight: gamingType === 'light' }">
					<span v-if="item.icon" class="icon"><i :class="item.icon" class="ti-fw"></i></span>
					<span class="text">{{ item.text }}</span>
				</MkA>
			</template>
		</div>
	</div>
</div>
</template>

<script lang="ts" setup>
import {ref , computed , watch } from 'vue';
import {defaultStore} from "@/store.js";

let gamingType = computed(defaultStore.makeGetterSetter('gamingType'));

defineProps<{
	def: any[];
	grid?: boolean;
}>();
</script>

<style lang="scss" scoped>
.rrevdjwu {
	> .group {
		& + .group {
			margin-top: 16px;
			padding-top: 16px;
			border-top: solid 0.5px var(--divider);
		}

		> .title {
			opacity: 0.7;
			margin: 0 0 8px 0;
			font-size: 0.9em;
		}

		> .items {
			> .item {
				display: flex;
				align-items: center;
				width: 100%;
				box-sizing: border-box;
				padding: 9px 16px 9px 8px;
				border-radius: 9px;
				font-size: 0.9em;

				&:hover {
					text-decoration: none;
					background: var(--panelHighlight);
				}

				&.active {
					color: var(--accent);
					background: var(--accentedBg);
          &.gamingDark{
            color: black !important;
            background: linear-gradient(270deg, #e7a2a2, #e3cfa2, #ebefa1, #b3e7a6, #a6ebe7, #aec5e3, #cabded, #e0b9e3, #f4bddd);            background-size: 1800% 1800%;
            -webkit-animation: AnimationDark var(--gamingspeed) cubic-bezier(0, 0.2, 0.90, 1) infinite;
            -moz-animation: AnimationDark var(--gamingspeed) cubic-bezier(0, 0.2, 0.90, 1) infinite;
            animation: AnimationDark var(--gamingspeed) cubic-bezier(0, 0.2, 0.90, 1) infinite;
          }
          &.gamingLight{
            color: white;
            background: linear-gradient(270deg, #c06161, #c0a567, #b6ba69, #81bc72, #63c3be, #8bacd6, #9f8bd6, #d18bd6, #d883b4);
            background-size: 1800% 1800% !important;
            -webkit-animation: AnimationLight var(--gamingspeed) cubic-bezier(0, 0.2, 0.90, 1) infinite !important;
            -moz-animation: AnimationLight var(--gamingspeed) cubic-bezier(0, 0.2, 0.90, 1) infinite !important;
            animation: AnimationLight var(--gamingspeed) cubic-bezier(0, 0.2, 0.90, 1) infinite !important;
          }
				}

				&.danger {
					color: var(--error);
				}

				> .icon {
					width: 32px;
					margin-right: 2px;
					flex-shrink: 0;
					text-align: center;
					opacity: 0.8;
				}

				> .text {
					white-space: normal;
					padding-right: 12px;
					flex-shrink: 1;
				}

			}
		}
	}

	&.grid {
		> .group {
			& + .group {
				padding-top: 0;
				border-top: none;
			}

			margin-left: 0;
			margin-right: 0;

			> .title {
				font-size: 1em;
				opacity: 0.7;
				margin: 0 0 8px 16px;
			}

			> .items {
				display: grid;
				grid-template-columns: repeat(auto-fill, minmax(70px, 1fr));
				grid-gap: 16px;
				padding: 0 16px;

				> .item {
					flex-direction: column;
					text-align: center;
					padding: 0;

					&:hover {
						text-decoration: none;
						background: none;
						color: var(--accent);

						> .icon {
							background: var(--accentedBg);
						}
					}

					> .icon {
						display: grid;
						place-content: center;
						margin-right: 0;
						margin-bottom: 6px;
						font-size: 1.5em;
						width: 60px;
						height: 60px;
						aspect-ratio: 1;
						background: var(--panel);
						border-radius: 100%;
					}

					> .text {
						padding-right: 0;
						width: 100%;
						font-size: 0.8em;
					}
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

