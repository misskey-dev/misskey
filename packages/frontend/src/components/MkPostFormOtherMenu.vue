<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkModal ref="modal" v-slot="{ type }" :zPriority="'high'" :src="src" :transparentBg="true" @click="modal?.close()" @closed="emit('closed')" @esc="modal?.close()">
	<div class="_popup _shadow" :class="{ [$style.root]: true, [$style.asDrawer]: type === 'drawer' }">
		<div :class="$style.textCountRoot">
			<div :class="$style.textCountLabel">{{ i18n.ts.textCount }}</div>
			<div
				:class="[$style.textCount,
					{ [$style.danger]: textCountPercentage > 100 },
					{ [$style.warning]: textCountPercentage > 90 && textCountPercentage <= 100 },
				]"
			>
				<div :class="$style.textCountGraph"></div>
				<div><span :class="$style.textCountCurrent">{{ number(textLength) }}</span> / {{ number(maxTextLength) }}</div>
			</div>
		</div>
		<div :class="$style.menuRoot">
			<button
				role="menuitem"
				tabindex="0"
				:class="['_button', $style.item]"
				@click.prevent="toggleReactionAcceptance"
			>
				<i
					class="ti-fw"
					:class="[$style.icon, {
						'ti ti-heart': props.currentReactionAcceptance === 'likeOnly',
						[$style.danger]: props.currentReactionAcceptance === 'likeOnly',
						'ti ti-heart-plus': props.currentReactionAcceptance === 'likeOnlyForRemote',
						'ti ti-icons': props.currentReactionAcceptance == null || !['likeOnly', 'likeOnlyForRemote'].includes(props.currentReactionAcceptance),
					}]"
				></i>
				<div :class="$style.menuItem_content">
					<span :class="$style.menuItem_content_text">{{ i18n.ts.reactionAcceptance }}</span>
				</div>
			</button>
			<div role="separator" tabindex="-1" :class="$style.divider"></div>
			<button
				role="menuitem"
				tabindex="0"
				:class="['_button', $style.item, $style.danger]"
				@click.prevent="reset"
			>
				<i
					class="ti-fw ti ti-trash"
					:class="$style.icon"
				></i>
				<div :class="$style.menuItem_content">
					<span :class="$style.menuItem_content_text">{{ i18n.ts.reset }}</span>
				</div>
			</button>
		</div>
	</div>
</MkModal>
</template>

<script lang="ts" setup>
import { shallowRef, computed } from 'vue';
import * as Misskey from 'misskey-js';
import MkModal from '@/components/MkModal.vue';
import { instance } from '@/instance.js';
import { i18n } from '@/i18n.js';
import * as os from '@/os.js';
import number from '@/filters/number.js';

const modal = shallowRef<InstanceType<typeof MkModal>>();

const props = defineProps<{
	currentReactionAcceptance: Misskey.entities.Note['reactionAcceptance'];
	textLength: number;
	src?: HTMLElement;
}>();

const emit = defineEmits<{
	(ev: 'changeReactionAcceptance', value: Misskey.entities.Note['reactionAcceptance']): void;
	(ev: 'reset'): void;
	(ev: 'closed'): void;
}>();

const maxTextLength = computed(() => {
	return instance ? instance.maxNoteTextLength : 1000;
});

const textCountPercentage = computed(() => {
	return props.textLength / maxTextLength.value * 100;
});

async function toggleReactionAcceptance() {
	const select = await os.select({
		title: i18n.ts.reactionAcceptance,
		items: [
			{ value: null, text: i18n.ts.all },
			{ value: 'likeOnlyForRemote' as const, text: i18n.ts.likeOnlyForRemote },
			{ value: 'nonSensitiveOnly' as const, text: i18n.ts.nonSensitiveOnly },
			{ value: 'nonSensitiveOnlyForLocalLikeOnlyForRemote' as const, text: i18n.ts.nonSensitiveOnlyForLocalLikeOnlyForRemote },
			{ value: 'likeOnly' as const, text: i18n.ts.likeOnly },
		],
		default: props.currentReactionAcceptance,
	});
	if (select.canceled) return;
	emit('changeReactionAcceptance', select.result);
	modal.value?.close();
}

async function reset() {
	const { canceled } = await os.confirm({
		type: 'question',
		text: i18n.ts.resetAreYouSure,
	});
	if (canceled) return;

	emit('reset');
	modal.value?.close();
}
</script>

<style lang="scss" module>
.root {
	min-width: 200px;

	&.asDrawer {
		width: 100%;
		border-radius: 24px;
		border-bottom-right-radius: 0;
		border-bottom-left-radius: 0;

		.textCountRoot {
			padding: 12px 24px;
		}

		.menuRoot {
			padding-bottom: max(env(safe-area-inset-bottom, 0px), 12px);

			> .item {
				font-size: 1em;
				padding: 12px 24px;

				&::before {
					width: calc(100% - 24px);
					border-radius: 12px;
				}

				> .icon {
					margin-right: 14px;
					width: 24px;
				}
			}

			> .divider {
				margin: 12px 0;
			}
		}
	}
}

.textCountRoot {
	--textCountBg: color-mix(in srgb, var(--MI_THEME-panel), var(--MI_THEME-fg) 15%);
	background-color: var(--textCountBg);
	padding: 10px 14px;
}

.textCountLabel {
	font-size: 11px;
	opacity: 0.8;
	margin-bottom: 4px;
}

.textCount {
	display: flex;
	gap: var(--MI-marginHalf);
	align-items: center;
	font-size: 12px;
	--countColor: var(--MI_THEME-accent);

	&.danger {
		--countColor: var(--MI_THEME-error);
	}

	&.warning {
		--countColor: var(--MI_THEME-warn);
	}

	.textCountGraph {
		position: relative;
		width: 24px;
		height: 24px;
		border-radius: 50%;
		background-image: conic-gradient(
			var(--countColor) 0% v-bind("Math.min(100, textCountPercentage) + '%'"),
			rgba(0, 0, 0, .2) v-bind("Math.min(100, textCountPercentage) + '%'") 100%
		);

		&::after {
			content: '';
			position: absolute;
			width: 16px;
			height: 16px;
			border-radius: 50%;
			background-color: var(--textCountBg);
			top: 50%;
			left: 50%;
			transform: translate(-50%, -50%);
		}
	}

	.textCountCurrent {
		color: var(--countColor);
		font-weight: 700;
		font-size: 18px;
	}
}

.menuRoot {
	padding: 8px 0;

	> .item {
		display: flex;
		align-items: center;
		position: relative;
		padding: 5px 16px;
		width: 100%;
		box-sizing: border-box;
		white-space: nowrap;
		font-size: 0.9em;
		line-height: 20px;
		text-align: left;
		overflow: hidden;
		text-overflow: ellipsis;
		text-decoration: none !important;
		color: var(--menuFg, var(--MI_THEME-fg));

		&::before {
			content: "";
			display: block;
			position: absolute;
			z-index: -1;
			top: 0;
			left: 0;
			right: 0;
			margin: auto;
			width: calc(100% - 16px);
			height: 100%;
			border-radius: 6px;
		}

		&:focus-visible {
			outline: none;

			&:not(:hover):not(:active)::before {
				outline: var(--MI_THEME-focus) solid 2px;
				outline-offset: -2px;
			}
		}

		&:hover,
		&:focus-visible:active,
		&:focus-visible.active {
			color: var(--menuHoverFg, var(--MI_THEME-accent));

			&::before {
				background-color: var(--menuHoverBg, var(--MI_THEME-accentedBg));
			}
		}

		&:not(:focus-visible):active,
		&:not(:focus-visible).active {
			color: var(--menuActiveFg, var(--MI_THEME-fgOnAccent));

			&::before {
				background-color: var(--menuActiveBg, var(--MI_THEME-accent));
			}
		}

		&:disabled {
			cursor: not-allowed;
		}

		&.danger {
			--menuFg: #ff2a2a;
			--menuHoverFg: #fff;
			--menuHoverBg: #ff4242;
			--menuActiveFg: #fff;
			--menuActiveBg: #d42e2e;
		}

		.icon {
			margin-right: 8px;
			line-height: 1;
		}

		.icon.danger {
			color: var(--MI_THEME-error);
		}
	}

	> .divider {
		margin: 8px 0;
		border-top: solid 0.5px var(--MI_THEME-divider);
	}
}

.menuItem_content {
	width: 100%;
	max-width: 100vw;
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 8px;
	text-overflow: ellipsis;
}

.menuItem_content_text {
	max-width: calc(100vw - 4rem);
	text-overflow: ellipsis;
	overflow: hidden;
}
</style>
