<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<header :class="$style.root">
	<div v-if="mock" :class="$style.name">
		<MkUserName :user="appearNote.user"/>
	</div>
	<MkA v-else v-user-preview="appearNote.user.id" :class="$style.name" :to="userPage(appearNote.user)">
		<MkUserName :user="appearNote.user"/>
	</MkA>
	<div v-if="appearNote.user.isBot" :class="$style.isBot">bot</div>
	<div :class="$style.username"><MkAcct :user="appearNote.user"/></div>
	<div v-if="appearNote.user.badgeRoles" :class="$style.badgeRoles">
		<img v-for="(role, i) in appearNote.user.badgeRoles" :key="i" v-tooltip="role.name" :class="$style.badgeRole" :src="role.iconUrl!"/>
	</div>
	<div :class="$style.info">
		<div v-if="mock">
			<MkTime :time="appearNote.createdAt" colored/>
		</div>
		<MkA v-else :to="notePage(note)">
			<MkTime :time="appearNote.createdAt" colored/>
		</MkA>
		<span v-if="appearNote.visibility !== 'public'" style="margin-left: 0.5em;" :title="i18n.ts._visibility[appearNote.visibility]">
			<i v-if="appearNote.visibility === 'home'" class="ti ti-home"></i>
			<i v-else-if="appearNote.visibility === 'followers'" class="ti ti-lock"></i>
			<i v-else-if="appearNote.visibility === 'specified'" ref="specified" class="ti ti-mail"></i>
		</span>
		<span v-if="appearNote.localOnly" style="margin-left: 0.5em;" :title="i18n.ts._visibility['disableFederation']"><i class="ti ti-rocket-off"></i></span>
		<span v-if="appearNote.channel" style="margin-left: 0.5em;" :title="appearNote.channel.name"><i class="ti ti-device-tv"></i></span>
	</div>
</header>
</template>

<script lang="ts" setup>
import { computed, inject } from 'vue';
import * as Misskey from 'misskey-js';
import { i18n } from '@/i18n.js';
import { notePage } from '@/filters/note.js';
import { userPage } from '@/filters/user.js';
import { defaultStore } from '@/store.js';
import { getAppearNote } from '@/scripts/get-appear-note.js';

const props = defineProps<{
	note: Misskey.entities.Note;
}>();

const mock = inject<boolean>('mock', false);
const appearNote = computed(() => getAppearNote(props.note));
</script>

<style lang="scss" module>
.root {
	display: flex;
	align-items: baseline;
	white-space: nowrap;
}

.name {
	flex-shrink: 1;
	display: block;
	margin: 0 .5em 0 0;
	padding: 0;
	overflow: hidden;
	font-size: 1em;
	font-weight: bold;
	text-decoration: none;
	text-overflow: ellipsis;

	&:hover {
		text-decoration: underline;
	}
}

.isBot {
	flex-shrink: 0;
	align-self: center;
	margin: 0 .5em 0 0;
	padding: 1px 6px;
	font-size: 80%;
	border: solid 0.5px var(--MI_THEME-divider);
	border-radius: 3px;
}

.username {
	flex-shrink: 9999999;
	margin: 0 .5em 0 0;
	overflow: hidden;
	text-overflow: ellipsis;
}

.info {
	flex-shrink: 0;
	margin-left: auto;
	font-size: 0.9em;
}

.badgeRoles {
	margin: 0 .5em 0 0;
}

.badgeRole {
	height: 1.3em;
	vertical-align: -20%;

	& + .badgeRole {
		margin-left: 0.2em;
	}
}
</style>
