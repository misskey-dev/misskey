<!--
SPDX-FileCopyrightText: syuilo and misskey-project , Type4ny-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
	<div class="_gaps_m">
		<MkButton rounded primary style="margin: 0 auto" @click="addUser()">{{
			i18n.ts.addUser
		}}</MkButton>

		<div v-for="(userAndWords , index) in mutedUserWords" class="_gaps">
			<div :class="$style.flex">
				<button class="_button" @click="unUserMute(index)"><i class="ti ti-x"></i></button>
				<MkUserCardMini :style="{flexGrow: 1}"  :user="userAndWords.user" :withChart="false" />
			</div>

			<MkTextarea v-model="userAndWords.words" />
		</div>
		<MkButton primary inline :disabled="!changed" @click="save()"><i class="ti ti-device-floppy"></i> {{ i18n.ts.save }}</MkButton
		>
	</div>
</template>

<script lang="ts" setup>
import { Ref, ref, watch } from "vue";
import MkTextarea from "@/components/MkTextarea.vue";
import MkButton from "@/components/MkButton.vue";
import * as os from "@/os.js";
import { i18n } from "@/i18n.js";
import { misskeyApi } from "@/scripts/misskey-api.js";
import * as Misskey from "misskey-js";
import MkUserCardMini from "@/components/MkUserCardMini.vue";
import { watchEffect } from "@vue/runtime-core";

const props = defineProps<{
	muted: { user: userType; words: string }[];
}>();

const emit = defineEmits<{
	(ev: "save", value: { user: userType; words: string }[]): void;
}>();

const changed = ref(false);

type userType = {
	id: string;
	avatarBlurhash: string;
	avatarDecorations: string;
	avatarUrl: string;
	isCat: string;
	name: string;
	username: string;
	host: string;
};
function unUserMute(index: number) {
	mutedUserWords.value.splice(index, 1);
}
const renderWord = (mutedWords) => mutedWords.map(x => {
	if (Array.isArray(x)) {
		return x.join(' ');
	} else {
		return x;
	}
}).join('\n');
const render = (mutedWords: { user: userType; words: string }[]): { user: userType; words: string }[] =>
	mutedWords.map((x) => {
		return {
			user: {
				id: x.user.id,
				avatarBlurhash: x.user.avatarBlurhash,
				avatarDecorations: x.user.avatarDecorations,
				avatarUrl: x.user.avatarUrl,
				isCat: x.user.isCat,
				name: x.user.name,
				username: x.user.username,
				host: x.user.host,
			},
			words: renderWord(x.words),
		};
	});

const mutedUserWords = ref<{ user: userType; words: string }[]>(props.muted ? render(props.muted) : []);

watch(
	() => mutedUserWords.value.map((userAndWords) => userAndWords.words),
	() => {
		changed.value = true;
	},
	{ deep: true }
);

const save = () => {
	const parseMutes = (mutes) => {
		// split into lines, remove empty lines and unnecessary whitespace
		let lines = mutes.trim().split('\n').map(line => line.trim()).filter(line => line !== '');

		// check each line if it is a RegExp or not
		for (let i = 0; i < lines.length; i++) {
			const line = lines[i];
			const regexp = line.match(/^\/(.+)\/(.*)$/);
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
			} else {
				lines[i] = line.split(' ');
			}
		}

		return lines;
	};
	const parsed = mutedUserWords.value.map((x) => {
		return {
			user: {
				id: x.user.id,
				avatarBlurhash: x.user.avatarBlurhash,
				avatarDecorations: x.user.avatarDecorations,
				avatarUrl: x.user.avatarUrl,
				isCat: x.user.isCat,
				name: x.user.name,
				username: x.user.username,
				host: x.user.host,
			},
			words: parseMutes(x.words),
		};
	});
	emit("save", parsed);
	changed.value = false;
};

function addUser() {
	os.selectUser().then((user) => {
		if (mutedUserWords.value.find((x) => x.user.id === user.id)) return;
		mutedUserWords.value.push({ user: user, words: "" });
	});
}
</script>

<style lang="scss" module>
.flex {
	display: flex;
	align-items: center;
}
</style>
