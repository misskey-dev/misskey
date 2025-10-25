<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<header :class="$style.root">
	<div v-if="mock" :class="$style.name">
		<MkUserName :user="note.user"/>
	</div>
	<MkA v-else v-user-preview="note.user.id" :class="$style.name" :to="userPage(note.user)">
		<MkUserName :user="note.user"/>
	</MkA>
	<div v-if="note.user.isBot" :class="$style.isBot">bot</div>
	<div :class="$style.username"><MkAcct :user="note.user"/></div>
	<div
		v-if="note.user.badgeRoles && !hideRole"
		:class="[
			$style.badgeRoles,
			badgeIconCount >= 3 ? (badgeIconCount >= 6 ? $style.badgeRolesStackForce : $style.badgeRolesStack) : null,
		]"
	>
		<template v-if="badgeIconCount < 3">
			<template v-for="(role, i) in note.user.badgeRoles" :key="i">
				<img v-if="role.iconUrl" v-tooltip="role.name" :class="$style.badgeRole" :src="role.iconUrl"/>
			</template>
		</template>
		<template v-else>
			<div :class="$style.badgeRolesStackInner">
				<template v-for="(role, i) in note.user.badgeRoles" :key="i">
					<img
						v-if="role.iconUrl"
						v-tooltip="role.name"
						:class="[$style.badgeRole, $style.badgeRoleStack]"
						:src="role.iconUrl"
					/>
				</template>
			</div>
		</template>
	</div>
	<div :class="$style.info">
		<div v-if="mock">
			<MkTime :time="note.createdAt" colored/>
		</div>
		<MkA v-else :to="notePage(note)">
			<MkTime :time="note.createdAt" colored/>
		</MkA>
		<span v-if="note.visibility !== 'public'" style="margin-left: 0.5em;" :title="i18n.ts._visibility[note.visibility]">
			<i v-if="note.visibility === 'home'" class="ti ti-home"></i>
			<i v-else-if="note.visibility === 'followers'" class="ti ti-lock"></i>
			<i v-else-if="note.visibility === 'specified'" ref="specified" class="ti ti-mail"></i>
		</span>
		<span v-if="note.localOnly" style="margin-left: 0.5em;" :title="i18n.ts._visibility['disableFederation']"><i class="ti ti-rocket-off"></i></span>
		<span v-if="note.channel" style="margin-left: 0.5em;" :title="note.channel.name"><i class="ti ti-device-tv"></i></span>
	</div>
</header>
</template>

<script lang="ts" setup>
import { inject, computed } from 'vue';
import * as Misskey from 'misskey-js';
import { i18n } from '@/i18n.js';
import { notePage } from '@/filters/note.js';
import { userPage } from '@/filters/user.js';
import { DI } from '@/di.js';

const props = defineProps<{
	note: Misskey.entities.Note;
	pinned?: boolean;
	hideRole?: boolean;
}>();

const mock = inject(DI.mock, false);

const badgeIconCount = computed(() => props.note.user.badgeRoles?.filter((role) => role.iconUrl).length ?? 0);
</script>

<style lang="scss" module>
.root {
	display: flex;
	align-items: baseline;
	white-space: nowrap;
	align-items: center;
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

.badgeRolesStack {
	position: relative;
	margin: 0 .5em 0 0;
	width: auto;

	@media (max-width: 1400px) {
		& {
			max-width: 67%;
		}
	}

	@media (max-width: 1300px) {
		& {
			max-width: 67%;
		}
	}

	@media (max-width: 800px) {
		& {
			max-width: 69%;
		}
	}

	@media (max-width: 700px) {
		& {
			max-width: 62%;
		}
	}

	@media (max-width: 600px) {
		& {
			max-width: 170px;
		}
	}

	@media (max-width: 421px) {
		& {
			max-width: 160px;
		}
	}

	@media (max-width: 390px) {
		& {
			max-width: 130px;
		}
	}

	@media (max-width: 375px) {
		& {
			max-width: 100px;
		}
	}
}

.badgeRolesStackForce {
	position: relative;
	margin: 0 .5em 0 0;
	max-width: 67%;

	@media (max-width: 1400px) {
		& {
			max-width: 67%;
		}
	}

	@media (max-width: 1300px) {
		& {
			max-width: 67%;
		}
	}

	@media (max-width: 800px) {
		& {
			max-width: 69%;
		}
	}

	@media (max-width: 700px) {
		& {
			max-width: 62%;
		}
	}

	@media (max-width: 600px) {
		& {
			max-width: 170px;
		}
	}

	@media (max-width: 421px) {
		& {
			max-width: 160px;
		}
	}

	@media (max-width: 390px) {
		& {
			max-width: 130px;
		}
	}

	@media (max-width: 375px) {
		& {
			max-width: 100px;
		}
	}
}

.badgeRolesStackInner {
	display: flex;
	overflow-x: auto;
	width: 100%;

	&::-webkit-scrollbar {
		display: none;
	}
	-ms-overflow-style: none;
	scrollbar-width: none;

	&::after {
		content: '';
		display: -webkit-box;
		display: -ms-flexbox;
		display: flex;
		width: 40px;
		height: 20px;
		right: -1px;
		position: absolute;
		z-index: 9999999;
		margin-left: auto;
		top: -1px;
		background: linear-gradient(to right, #fff0 0, var(--MI_THEME-panel) 40%, var(--MI_THEME-panel) 70%);
	}
}

.badgeRole {
	height: 1.3em;
	vertical-align: -20%;

	& + .badgeRole {
		margin-left: 0.2em;
	}
}

.badgeRoleStack:last-child {
	margin-right: 2em;
}
</style>
