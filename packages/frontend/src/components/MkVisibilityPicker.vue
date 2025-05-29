<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkModal ref="modal" v-slot="{ type }" :zPriority="'high'" :src="src" @click="modal?.close()" @closed="emit('closed')" @esc="modal?.close()">
	<div class="_popup" :class="{ [$style.root]: true, [$style.asDrawer]: type === 'drawer' }">
		<div :class="[$style.label, $style.item]">
			{{ i18n.ts.visibility }}
		</div>
		<button key="public" :disabled="isSilenced || isReplyVisibilitySpecified" class="_button" :class="[$style.item, { [$style.active]: v === 'public' }]" data-index="1" @click="choose('public')">
			<div :class="$style.icon"><i class="ti ti-world"></i></div>
			<div :class="$style.body">
				<span :class="$style.itemTitle">{{ i18n.ts._visibility.public }}{{ isNoteInYamiMode ? ` (${i18n.ts._yami.yamiModeShort})` : '' }}</span>
				<span :class="$style.itemDescription">{{ isNoteInYamiMode ? i18n.ts._visibility.yamiDescription : i18n.ts._visibility.publicDescription }}</span>
			</div>
		</button>
		<button key="home" :disabled="isReplyVisibilitySpecified" class="_button" :class="[$style.item, { [$style.active]: v === 'home' }]" data-index="2" @click="choose('home')">
			<div :class="$style.icon"><i class="ti ti-home"></i></div>
			<div :class="$style.body">
				<span :class="$style.itemTitle">{{ i18n.ts._visibility.home }}{{ isNoteInYamiMode ? ` (${i18n.ts._yami.yamiModeShort})` : '' }}</span>
				<span :class="$style.itemDescription">{{ isNoteInYamiMode ? i18n.ts._visibility.yamiDescription : i18n.ts._visibility.homeDescription }}</span>
			</div>
		</button>
		<button key="followers" :disabled="isReplyVisibilitySpecified" class="_button" :class="[$style.item, { [$style.active]: v === 'followers' }]" data-index="3" @click="choose('followers')">
			<div :class="$style.icon"><i class="ti ti-lock"></i></div>
			<div :class="$style.body">
				<span :class="$style.itemTitle">{{ i18n.ts._visibility.followers }}{{ isNoteInYamiMode ? ` (${i18n.ts._yami.yamiModeShort})` : '' }}</span>
				<span :class="$style.itemDescription">{{ isNoteInYamiMode ? i18n.ts._visibility.yamiDescription : i18n.ts._visibility.followersDescription }}</span>
			</div>
		</button>
		<button key="specified" :disabled="localOnly" class="_button" :class="[$style.item, { [$style.active]: v === 'specified' }]" data-index="4" @click="choose('specified')">
			<div :class="$style.icon"><i class="ti ti-mail"></i></div>
			<div :class="$style.body">
				<span :class="$style.itemTitle">{{ i18n.ts._visibility.specified }}{{ isNoteInYamiMode ? ` (${i18n.ts._yami.yamiModeShort})` : '' }}</span>
				<span :class="$style.itemDescription">{{ isNoteInYamiMode ? i18n.ts._visibility.yamiDescription : i18n.ts._visibility.specifiedDescription }}</span>
			</div>
		</button>
		<button key="private" class="_button" :class="[$style.item, { [$style.active]: isPrivate }]" @click="choosePrivate()">
			<div :class="$style.icon">
				<i class="ti ti-eye-closed"></i>
			</div>
			<div :class="$style.body">
				<span :class="$style.itemTitle">{{ i18n.ts._visibility.private }}</span>
				<span :class="$style.itemDescription">{{ i18n.ts._visibility.privateDescription }}</span>
			</div>
		</button>
	</div>
</MkModal>
</template>

<script lang="ts" setup>
import { nextTick, useTemplateRef, computed } from 'vue';
import * as Misskey from 'misskey-js';
import MkModal from '@/components/MkModal.vue';
import { i18n } from '@/i18n.js';
import { $i } from '@/i.js';

const modal = useTemplateRef('modal');

const props = withDefaults(defineProps<{
	currentVisibility: typeof Misskey.noteVisibilities[number];
	currentVisibleUsers?: Misskey.entities.UserLite[];
	isSilenced: boolean;
	localOnly: boolean;
	src?: HTMLElement;
	isReplyVisibilitySpecified?: boolean;
	isNoteInYamiMode: boolean;
	reply?: Misskey.entities.Note;
}>(), {
	currentVisibleUsers: () => [],
	isNoteInYamiMode: false,
	reply: undefined,
});

const emit = defineEmits<{
	(ev: 'changeVisibility', v: typeof Misskey.noteVisibilities[number]): void;
	(ev: 'changeVisibleUsers', users: Misskey.entities.UserLite[]): void;
	(ev: 'closed'): void;
}>();

// 自分のみ投稿の判定
const isPrivate = computed(() => {
	if (props.currentVisibility === 'specified' && props.currentVisibleUsers.length === 0) {
		return true;
	}

	if (props.currentVisibility === 'specified' &&
        props.currentVisibleUsers.length === 1 &&
        props.currentVisibleUsers[0].id === $i.id &&
        props.reply) {
		const replyIsPrivate = props.reply.visibility === 'specified' &&
            (!props.reply.visibleUserIds || props.reply.visibleUserIds.length === 0);

		if (replyIsPrivate) {
			return true;
		}
	}

	return false;
});

// 表示用のvisibility
const v = computed(() => {
	if (isPrivate.value) return 'private';
	return props.currentVisibility;
});

function choose(visibility: typeof Misskey.noteVisibilities[number]): void {
	emit('changeVisibility', visibility);
	if (visibility !== 'specified') {
		emit('changeVisibleUsers', []);
	}
	nextTick(() => {
		if (modal.value) modal.value.close();
	});
}

function choosePrivate(): void {
	emit('changeVisibility', 'specified');
	emit('changeVisibleUsers', []);
	nextTick(() => {
		if (modal.value) modal.value.close();
	});
}
</script>

<style lang="scss" module>
.root {
	min-width: 240px;
	padding: 8px 0;

	&.asDrawer {
		padding: 12px 0 max(env(safe-area-inset-bottom, 0px), 12px) 0;
		width: 100%;
		border-radius: 24px;
		border-bottom-right-radius: 0;
		border-bottom-left-radius: 0;

		.label {
			pointer-events: none;
			font-size: 12px;
			padding-bottom: 4px;
			opacity: 0.7;
		}

		.item {
			font-size: 14px;
			padding: 10px 24px;
		}
	}
}

.label {
	pointer-events: none;
	font-size: 10px;
	padding-bottom: 4px;
	opacity: 0.7;
}

.item {
	display: flex;
	padding: 8px 14px;
	font-size: 12px;
	text-align: left;
	width: 100%;
	box-sizing: border-box;

	&:hover {
		background: rgba(0, 0, 0, 0.05);
	}

	&:active {
		background: rgba(0, 0, 0, 0.1);
	}

	&.active {
		color: var(--MI_THEME-accent);
	}
}

.icon {
	display: flex;
	justify-content: center;
	align-items: center;
	margin-right: 10px;
	width: 16px;
	top: 0;
	bottom: 0;
	margin-top: auto;
	margin-bottom: auto;
}

.body {
	flex: 1 1 auto;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
}

.itemTitle {
	display: block;
	font-weight: bold;
}

.itemDescription {
	opacity: 0.6;
}
</style>
