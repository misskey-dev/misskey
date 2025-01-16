<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkModal ref="modal" v-slot="{ type, maxHeight }" :zPriority="'high'" :src="src" :transparentBg="true" @click="modal?.close()" @closed="emit('closed')" @esc="modal?.close()">
	<MkMenu
		:items="menuDef"
		:align="align"
		:width="width"
		:maxHeight="maxHeight"
		:asDrawer="type === 'drawer'"
	>
		<template #header>
			<div :class="[$style.textCountRoot, { [$style.asDrawer]: type === 'drawer' }]">
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
		</template>
	</MkMenu>
</MkModal>
</template>

<script lang="ts" setup>
import { shallowRef, computed, inject } from 'vue';
import * as Misskey from 'misskey-js';
import MkModal from '@/components/MkModal.vue';
import MkMenu from '@/components/MkMenu.vue';
import { instance } from '@/instance.js';
import { i18n } from '@/i18n.js';
import * as os from '@/os.js';
import number from '@/filters/number.js';
import type { MenuItem } from '@/types/menu.js';

const mock = inject<boolean>('mock', false);

const modal = shallowRef<InstanceType<typeof MkModal>>();

const props = defineProps<{
	currentReactionAcceptance: Misskey.entities.Note['reactionAcceptance'];
	textLength: number;
	align?: 'center' | string;
	width?: number;
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

// actionを発火した瞬間にMkMenuItemからcloseイベントが出るが、それを利用すると正しくemitできないため、action内で別途closeを呼ぶ
const menuDef = computed<MenuItem[]>(() => {
	let reactionAcceptanceIcon = 'ti ti-icons';

	if (props.currentReactionAcceptance === 'likeOnly') {
		reactionAcceptanceIcon = 'ti ti-heart _love';
	} else if (props.currentReactionAcceptance === 'likeOnlyForRemote') {
		reactionAcceptanceIcon = 'ti ti-heart-plus';
	}

	return [{
		icon: reactionAcceptanceIcon,
		text: i18n.ts.reactionAcceptance,
		action: () => {
			toggleReactionAcceptance();
		},
	}, { type: 'divider' }, {
		icon: 'ti ti-trash',
		text: i18n.ts.reset,
		danger: true,
		action: () => {
			if (mock) return;
			reset();
		},
	}];
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

	if (!select.canceled) {
		emit('changeReactionAcceptance', select.result);
	}

	modal.value?.close();
}

async function reset() {
	const { canceled } = await os.confirm({
		type: 'question',
		text: i18n.ts.resetAreYouSure,
	});

	if (!canceled) {
		emit('reset');
	}

	modal.value?.close();
}
</script>

<style lang="scss" module>
.textCountRoot {
	--textCountBg: color-mix(in srgb, var(--MI_THEME-panel), var(--MI_THEME-fg) 15%);
	background-color: var(--textCountBg);
	padding: 10px 14px;

	&.asDrawer {
		padding: 12px 24px;
	}
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
</style>
