<template>
<div class="_gaps">
	<div class="_gaps_s">
		<input id="yami" v-model="mode" :class="$style.radio" type="radio" name="yamimodeSwitcher" value="yami">
		<label :class="$style.radioRoot" class="_gaps_s" for="yami">
			<div :class="$style.radioTitle">
				<div :class="$style.tick">
					<i class="ti ti-check"></i>
				</div>
				<div :class="$style.title"><i class="ti ti-moon"></i> {{ i18n.ts._yami.yamiMode }}</div>
			</div>
			<ul>
				<li>{{ i18n.ts._yami._yamiModeSwitcher.yami1 }}</li>
				<li>{{ i18n.ts._yami._yamiModeSwitcher.yami2 }}</li>
				<li>{{ i18n.ts._yami._yamiModeSwitcher.yami3 }}</li>
			</ul>
			<div :class="$style.radioRecommendedFor">
				<div :class="$style.title">{{ i18n.ts._yami._yamiModeSwitcher.recommendedFor }}</div>
				<div>{{ i18n.ts._yami._yamiModeSwitcher.yamiRecommend }}</div>
			</div>
		</label>
		<input id="normal" v-model="mode" :class="$style.radio" type="radio" name="yamimodeSwitcher" value="normal">
		<label :class="$style.radioRoot" class="_gaps_s" for="normal">
			<div :class="$style.radioTitle">
				<div :class="$style.tick">
					<i class="ti ti-check"></i>
				</div>
				<div :class="$style.title"><i class="ti ti-users-group"></i> {{ i18n.ts._yami._yamiModeSwitcher.normal }}</div>
			</div>
			<ul>
				<li>{{ i18n.ts._yami._yamiModeSwitcher.normal1 }}</li>
				<li>{{ i18n.ts._yami._yamiModeSwitcher.normal2 }}</li>
			</ul>
			<div :class="$style.radioRecommendedFor">
				<div :class="$style.title">{{ i18n.ts._yami._yamiModeSwitcher.recommendedFor }}</div>
				<div>{{ i18n.ts._yami._yamiModeSwitcher.normalRecommend }}</div>
			</div>
		</label>
	</div>
	<MkButton v-if="hasChanged" :disabled="!hasChanged" primary @click="setMode"><i class="ti ti-check"></i> {{ i18n.ts.save }}</MkButton>
</div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { signinRequired } from '@/account.js';
import { i18n } from '@/i18n.js';
import { globalEvents } from '@/events.js';
import { claimAchievement } from '@/scripts/achievements.js';
import * as os from '@/os.js';

import MkButton from '@/components/MkButton.vue';

const $i = signinRequired();

const originalMode = $i.isInYamiMode ? 'yami' : 'normal';
const mode = ref<'normal' | 'yami'>(originalMode);

const hasChanged = computed(() => mode.value !== originalMode);

async function setMode() {
	const { canceled } = await os.confirm({
		type: 'warning',
		title: i18n.ts.saveConfirm,
		text: i18n.ts._yami._yamiModeSwitcher.saveConfirmDescription,
	});

	if (canceled) return;

	os.apiWithDialog('i/update', {
		isInYamiMode: mode.value === 'yami',
	});
	globalEvents.emit('requestClearPageCache');
	if (mode.value === 'yami') {
		claimAchievement('markedAsYamiModeUser');
	}
}
</script>

<style module lang="scss">
.radio {
	position: absolute;
	clip: rect(0, 0, 0, 0);
	pointer-events: none;

	&:focus-visible + .radioRoot {
		outline: 2px solid var(--MI_THEME-focus);
		outline-offset: 2px;
	}

	&:checked + .radioRoot {
		border-color: var(--MI_THEME-accent);
	}

	&:checked + .radioRoot .tick {
		border-style: solid;
		border-color: var(--MI_THEME-accent);
		color: var(--MI_THEME-accent);
	}
}

.radioRoot {
	padding: var(--MI-margin);
	background-color: var(--MI_THEME-panel);
	border-radius: var(--MI-radius);
	cursor: pointer;

	border-width: 2px;
	border-style: solid;
	border-color: transparent;

	transition: border-color 0.2s;

	&:hover {
		border-color: var(--MI_THEME-focus);
	}

	ul {
		margin-top: 0;
		margin-bottom: 0;
	}
}

.radioTitle {
	display: flex;
	align-items: center;
	gap: var(--MI-marginHalf);

	.tick {
		flex-shrink: 0;

		width: 2rem;
		height: 2rem;
		text-align: center;
		font-size: 1rem;
		line-height: 2rem;
		color: var(--MI_THEME-fgTransparent);
		border-radius: 50%;
		border: 1px dashed var(--MI_THEME-fgTransparent);

		> i {
			display: inline-block;
			line-height: 2rem;
		}
	}

	.title {
		flex-grow: 1;
		font-size: 1.25rem;
		font-weight: 700;
	}
}

.radioRecommendedFor {
	margin: 8px 0 0;
	padding: 24px 12px 12px;
	border: 1px dashed var(--MI_THEME-fgTransparent);
	border-radius: var(--MI-radius);

	.title {
		margin: -34px 0 6px 12px;
    padding: 0 4px;
    width: fit-content;
		background-color: var(--MI_THEME-panel);
	}
}
</style>
