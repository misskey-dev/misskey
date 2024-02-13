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
				<a v-if="item.type === 'a'" :href="item.href" :target="item.target" :tabindex="i" class="_button item" :class="{ danger: item.danger, active: item.active }">
					<span v-if="item.icon" class="icon"><i :class="item.icon" class="ti-fw"></i></span>
					<span class="text">{{ item.text }}</span>
				</a>
				<button v-else-if="item.type === 'button'" :tabindex="i" class="_button item" :class="{ danger: item.danger, active: item.active }" :disabled="item.active" @click="ev => item.action(ev)">
					<span v-if="item.icon" class="icon"><i :class="item.icon" class="ti-fw"></i></span>
					<span class="text">{{ item.text }}</span>
				</button>
				<MkA v-else :to="item.to" :tabindex="i" class="_button item" :class="{ danger: item.danger, active: item.active }">
					<span v-if="item.icon" class="icon"><i :class="item.icon" class="ti-fw"></i></span>
					<span class="text">{{ item.text }}</span>
				</MkA>
			</template>
		</div>
	</div>
</div>
</template>

<script lang="ts" setup>
import { } from 'vue';

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
</style>
