<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div class="_gaps">
	<div style="text-align: center; padding: 0 16px;">{{ i18n.ts._initialTutorial._timeline.description1 }}</div>
	<div class="_gaps_s">
		<div><i class="ti ti-home"></i> <b>{{ i18n.ts._timelines.home }}</b> … {{ i18n.ts._initialTutorial._timeline.home }}</div>
		<div><i class="ti ti-planet"></i> <b>{{ i18n.ts._timelines.local }}</b> … {{ i18n.ts._initialTutorial._timeline.local }}</div>
		<div><i class="ti ti-universe"></i> <b>{{ i18n.ts._timelines.social }}</b> … {{ i18n.ts._initialTutorial._timeline.social }}</div>
		<div><i class="ti ti-whirl"></i> <b>{{ i18n.ts._timelines.global }}</b> … {{ i18n.ts._initialTutorial._timeline.global }}</div>
	</div>
	<div class="_gaps_s">
		<div>{{ i18n.ts._initialTutorial._timeline.description2 }}</div>
		<img :class="$style.image" src="/client-assets/tutorial/timeline_tab.png"/>
	</div>
	<div :class="$style.divider"></div>
	<I18n :src="i18n.ts._initialTutorial._timeline.description3" tag="div" style="padding: 0 16px;">
		<template #link>
			<a href="https://misskey-hub.net/docs/for-users/features/timeline/" target="_blank" class="_link">{{ i18n.ts.help }}</a>
		</template>
	</I18n>

</div>
</template>

<script setup lang="ts">
import { i18n } from '@/i18n.js';
</script>

<style lang="scss" module>
.exampleNoteRoot {
	border-radius: var(--radius);
	border: var(--panelBorder);
	background: var(--panel);
}

.divider {
	height: 1px;
	background: var(--divider);
}

.image {
	max-width: 300px;
	margin: 0 auto;
}

.post {
	position: relative;
	display: block;
	width: 100%;
	height: 40px;
	color: var(--fgOnAccent);
	font-weight: bold;
	text-align: left;

	&::before {
		content: "";
		display: block;
		width: calc(100% - 38px);
		height: 100%;
		margin: auto;
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		border-radius: 999px;
		background: linear-gradient(90deg, var(--buttonGradateA), var(--buttonGradateB));
	}

}

.postIcon {
	position: relative;
	margin-left: 30px;
	margin-right: 8px;
	width: 32px;
}

.postText {
	position: relative;
	line-height: 40px;
}
</style>
