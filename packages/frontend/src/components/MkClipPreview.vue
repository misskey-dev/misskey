<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkA :to="`/clips/${clip.id}`" :class="$style.link">
	<div :class="$style.root" class="_panel _gaps_s">
		<b>{{ clip.name }}</b>
		<div :class="$style.description">
			<div v-if="clip.description"><Mfm :text="clip.description" :plain="true" :nowrap="true"/></div>
			<div v-if="clip.lastClippedAt">{{ i18n.ts.updatedAt }}: <MkTime :time="clip.lastClippedAt" mode="detail"/></div>
			<div v-if="clip.notesCount != null">{{ i18n.ts.notesCount }}: {{ number(clip.notesCount) }} / {{ $i?.policies.noteEachClipsLimit }} ({{ i18n.tsx.remainingN({ n: remaining }) }})</div>
		</div>
		<template v-if="!props.noUserInfo">
			<div :class="$style.divider"></div>
			<div>
				<MkAvatar :user="clip.user" :class="$style.userAvatar" indicator link preview/> <MkUserName :user="clip.user" :nowrap="false"/>
			</div>
		</template>
	</div>
</MkA>
</template>

<script lang="ts" setup>
import * as Misskey from 'misskey-js';
import { computed } from 'vue';
import { i18n } from '@/i18n.js';
import { $i } from '@/account.js';
import number from '@/filters/number.js';

const props = withDefaults(defineProps<{
	clip: Misskey.entities.Clip;
	noUserInfo?: boolean;
}>(), {
	noUserInfo: false,
});

const remaining = computed(() => {
	return ($i?.policies && props.clip.notesCount != null) ? ($i.policies.noteEachClipsLimit - props.clip.notesCount) : i18n.ts.unknown;
});
</script>

<style lang="scss" module>
.link {
	display: block;

	&:focus-visible {
		outline: none;

		.root {
			box-shadow: inset 0 0 0 2px var(--focus);
		}
	}

	&:hover {
		text-decoration: none;
		color: var(--accent);
	}
}

.root {
	padding: 16px;
}

.divider {
	height: 1px;
	background: var(--divider);
}

.description {
	font-size: 90%;
}

.userAvatar {
	width: 32px;
	height: 32px;
}
</style>
