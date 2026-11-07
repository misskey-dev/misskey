<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkModalWindow
	ref="windowEl"
	:withOkButton="false"
	:okButtonDisabled="false"
	:width="500"
	:height="600"
	@close="onCloseModalWindow"
	@closed="emit('closed')"
>
	<template #header>Server setup wizard</template>
	<div class="_spacer" style="--MI_SPACER-min: 20px; --MI_SPACER-max: 28px;">
		<Suspense>
			<template #default>
				<MkServerSetupWizard @finished="onWizardFinished"/>
			</template>
			<template #fallback>
				<MkLoading/>
			</template>
		</Suspense>
	</div>
</MkModalWindow>
</template>

<script setup lang="ts">
import { useTemplateRef } from 'vue';
import MkModalWindow from '@/components/MkModalWindow.vue';
import MkServerSetupWizard from '@/components/MkServerSetupWizard.vue';

const emit = defineEmits<{
	(ev: 'closed'): void;
}>();

const windowEl = useTemplateRef('windowEl');

function onWizardFinished() {
	windowEl.value?.close();
}

function onCloseModalWindow() {
	windowEl.value?.close();
}
</script>

<style module lang="scss">
.root {
	max-height: 410px;
	height: 410px;
	display: flex;
	flex-direction: column;
}
</style>
