<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div class="_gaps_m">
	<div>
		<MkTextarea v-model="mutedWords">
			<span>{{ i18n.ts._wordMute.muteWords }}</span>
			<template #caption>{{ i18n.ts._wordMute.muteWordsDescription }}<br>{{ i18n.ts._wordMute.muteWordsDescription2 }}</template>
		</MkTextarea>
	</div>
	<MkButton primary inline :disabled="!changed" @click="save()"><i class="ti ti-device-floppy"></i> {{ i18n.ts.save }}</MkButton>
</div>
</template>

<script lang="ts" setup>
import { ref, watch } from 'vue';
import MkTextarea from '@/components/MkTextarea.vue';
import MkButton from '@/components/MkButton.vue';
import * as os from '@/os.js';
import { $i } from '@/account.js';
import { i18n } from '@/i18n.js';
import { misskeyApi } from '@/scripts/misskey-api.js';

const render = (mutedWords?: (string | string[])[]) => mutedWords?.map(x => {
	if (Array.isArray(x)) {
		return x.join(' ');
	} else {
		return x;
	}
}).join('\n');

const mutedWords = ref(render($i?.mutedWords));
const changed = ref(false);

watch(mutedWords, () => {
	changed.value = true;
});

async function save() {
	const parseMutes = (mutes?: string): (string | string[])[] => {
		const parsed: (string | string[])[] = [];
		if (!mutes) return parsed;

		// split into lines, remove empty lines and unnecessary whitespace
		// check each line if it is a RegExp or not
		for (const [i, line] of mutes.trim().split('\n').map(line => line.trim()).filter(line => line !== '').entries()) {
			const regexp = RegExp(/^\/(.+)\/(.*)$/).exec(line);
			if (regexp) {
				// check that the RegExp is valid
				try {
					new RegExp(regexp[1], regexp[2]);
					// note that regex lines will not be split by spaces!
				} catch (err: any) {
					// invalid syntax: do not save, do not reset changed flag
					os.alert({
						type: 'error',
						title: i18n.ts.regexpError,
						text: i18n.tsx.regexpErrorDescription({ tab: 'word mute', line: i + 1 }) + '\n' + err.toString(),
					});
					// re-throw error so these invalid settings are not saved
					throw err;
				}
				parsed.push(line);
			} else {
				parsed.push(line.split(' '));
			}
		}

		return parsed;
	};

	let parsed: (string | string[])[];
	try {
		parsed = parseMutes(mutedWords.value);
	} catch (err) {
		// already displayed error message in parseMutes
		return;
	}

	await misskeyApi('i/update', {
		mutedWords: parsed,
	});

	changed.value = false;
}
</script>
