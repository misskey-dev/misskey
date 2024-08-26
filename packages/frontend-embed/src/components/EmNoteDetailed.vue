<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div
	v-show="!isDeleted"
	ref="rootEl"
	:class="$style.root"
>
	<MkNoteSub v-if="appearNote.reply" :note="appearNote.reply" :class="$style.replyTo"/>
	<div v-if="isRenote" :class="$style.renote">
		<MkAvatar :class="$style.renoteAvatar" :user="note.user" link/>
		<i class="ti ti-repeat" style="margin-right: 4px;"></i>
		<span :class="$style.renoteText">
			<I18n :src="i18n.ts.renotedBy" tag="span">
				<template #user>
					<MkA :class="$style.renoteName" :to="userPage(note.user)">
						<MkUserName :user="note.user"/>
					</MkA>
				</template>
			</I18n>
		</span>
		<div :class="$style.renoteInfo">
			<div class="$style.renoteTime">
				<MkTime :time="note.createdAt"/>
			</div>
			<span v-if="note.visibility !== 'public'" style="margin-left: 0.5em;" :title="i18n.ts._visibility[note.visibility]">
				<i v-if="note.visibility === 'home'" class="ti ti-home"></i>
				<i v-else-if="note.visibility === 'followers'" class="ti ti-lock"></i>
				<i v-else-if="note.visibility === 'specified'" ref="specified" class="ti ti-mail"></i>
			</span>
			<span v-if="note.localOnly" style="margin-left: 0.5em;" :title="i18n.ts._visibility['disableFederation']"><i class="ti ti-rocket-off"></i></span>
		</div>
	</div>
	<article :class="$style.note">
		<header :class="$style.noteHeader">
			<MkAvatar :class="$style.noteHeaderAvatar" :user="appearNote.user" indicator link/>
			<div :class="$style.noteHeaderBody">
				<div :class="$style.noteHeaderBodyUpper">
					<div style="min-width: 0;">
						<div class="_nowrap">
							<MkA :class="$style.noteHeaderName" :to="userPage(appearNote.user)">
								<MkUserName :nowrap="true" :user="appearNote.user"/>
							</MkA>
							<span v-if="appearNote.user.isBot" :class="$style.isBot">bot</span>
						</div>
						<div :class="$style.noteHeaderUsername"><MkAcct :user="appearNote.user"/></div>
					</div>
					<div :class="$style.noteHeaderInfo">
						<a :href="url" :class="$style.noteHeaderInstanceIconLink" target="_blank" rel="noopener noreferrer">
							<img :src="instance.iconUrl || '/favicon.ico'" alt="" :class="$style.noteHeaderInstanceIcon"/>
						</a>
					</div>
				</div>
				<MkInstanceTicker v-if="showTicker" :instance="appearNote.user.instance"/>
			</div>
		</header>
		<div :class="[$style.noteContent, { [$style.contentCollapsed]: collapsed }]">
			<p v-if="appearNote.cw != null" :class="$style.cw">
				<Mfm v-if="appearNote.cw != ''" style="margin-right: 8px;" :text="appearNote.cw" :author="appearNote.user" :nyaize="'respect'"/>
				<MkCwButton v-model="showContent" :text="appearNote.text" :renote="appearNote.renote" :files="appearNote.files" :poll="appearNote.poll"/>
			</p>
			<div v-show="appearNote.cw == null || showContent">
				<span v-if="appearNote.isHidden" style="opacity: 0.5">({{ i18n.ts.private }})</span>
				<MkA v-if="appearNote.replyId" :class="$style.noteReplyTarget" :to="`/notes/${appearNote.replyId}`"><i class="ti ti-arrow-back-up"></i></MkA>
				<Mfm
					v-if="appearNote.text"
					:parsedNodes="parsed"
					:text="appearNote.text"
					:author="appearNote.user"
					:nyaize="'respect'"
					:emojiUrls="appearNote.emojis"
				/>
				<a v-if="appearNote.renote != null" :class="$style.rn">RN:</a>
				<div v-if="appearNote.files && appearNote.files.length > 0">
					<EmMediaList :mediaList="appearNote.files" :originalEntityUrl="`${url}/notes/${appearNote.id}`"/>
				</div>
				<MkPoll v-if="appearNote.poll" ref="pollViewer" :noteId="appearNote.id" :poll="appearNote.poll" :readOnly="true" :class="$style.poll"/>
				<div v-if="appearNote.renote" :class="$style.quote"><MkNoteSimple :note="appearNote.renote" :class="$style.quoteNote"/></div>
				<button v-if="isLong && collapsed" :class="$style.collapsed" class="_button" @click="collapsed = false">
					<span :class="$style.collapsedLabel">{{ i18n.ts.showMore }}</span>
				</button>
				<button v-else-if="isLong && !collapsed" :class="$style.showLess" class="_button" @click="collapsed = true">
					<span :class="$style.showLessLabel">{{ i18n.ts.showLess }}</span>
				</button>
			</div>
			<MkA v-if="appearNote.channel && !inChannel" :class="$style.channel" :to="`/channels/${appearNote.channel.id}`"><i class="ti ti-device-tv"></i> {{ appearNote.channel.name }}</MkA>
		</div>
		<footer>
			<div :class="$style.noteFooterInfo">
				<span v-if="appearNote.visibility !== 'public'" style="display: inline-block; margin-right: 0.5em;" :title="i18n.ts._visibility[appearNote.visibility]">
					<i v-if="appearNote.visibility === 'home'" class="ti ti-home"></i>
					<i v-else-if="appearNote.visibility === 'followers'" class="ti ti-lock"></i>
					<i v-else-if="appearNote.visibility === 'specified'" ref="specified" class="ti ti-mail"></i>
				</span>
				<span v-if="appearNote.localOnly" style="display: inline-block; margin-right: 0.5em;" :title="i18n.ts._visibility['disableFederation']"><i class="ti ti-rocket-off"></i></span>
				<MkA :to="notePage(appearNote)">
					<MkTime :time="appearNote.createdAt" mode="detail" colored/>
				</MkA>
			</div>
			<MkReactionsViewer v-if="appearNote.reactionAcceptance !== 'likeOnly'" ref="reactionsViewer" :maxNumber="16" :note="appearNote">
				<template #more>
					<MkA :to="`/notes/${appearNote.id}`" :class="[$style.reactionOmitted]">{{ i18n.ts.more }}</MkA>
				</template>
			</MkReactionsViewer>
			<a :href="`/notes/${appearNote.id}`" target="_blank" rel="noopener" :class="[$style.noteFooterButton, $style.footerButtonLink]" class="_button">
				<i class="ti ti-arrow-back-up"></i>
			</a>
			<a v-if="canRenote" :href="`/notes/${appearNote.id}`" target="_blank" rel="noopener" :class="[$style.noteFooterButton, $style.footerButtonLink]" class="_button">
				<i class="ti ti-repeat"></i>
				<p v-if="appearNote.renoteCount > 0" :class="$style.noteFooterButtonCount">{{ number(appearNote.renoteCount) }}</p>
			</a>
			<a v-else :href="`/notes/${appearNote.id}`" target="_blank" rel="noopener" :class="[$style.noteFooterButton, $style.footerButtonLink]" class="_button" disabled>
				<i class="ti ti-ban"></i>
			</a>
			<a :href="`/notes/${appearNote.id}`" target="_blank" rel="noopener" :class="[$style.noteFooterButton, $style.footerButtonLink]" class="_button">
				<i v-if="appearNote.reactionAcceptance === 'likeOnly'" class="ti ti-heart"></i>
				<i v-else class="ti ti-plus"></i>
				<p v-if="(appearNote.reactionAcceptance === 'likeOnly' || defaultStore.state.showReactionsCount) && appearNote.reactionCount > 0" :class="$style.noteFooterButtonCount">{{ number(appearNote.reactionCount) }}</p>
			</a>
			<a :href="`/notes/${appearNote.id}`" target="_blank" rel="noopener" :class="[$style.noteFooterButton, $style.footerButtonLink]" class="_button">
				<i class="ti ti-dots"></i>
			</a>
		</footer>
	</article>
</div>
</template>

<script lang="ts" setup>
import { computed, inject, ref } from 'vue';
import * as mfm from 'mfm-js';
import * as Misskey from 'misskey-js';
import EmMediaList from './EmMediaList.vue';
import MkNoteSub from '@/components/MkNoteSub.vue';
import MkNoteSimple from '@/components/EmNoteSimple.vue';
import MkReactionsViewer from '@/components/MkReactionsViewer.vue';
import MkCwButton from '@/components/MkCwButton.vue';
import MkPoll from '@/components/MkPoll.vue';
import MkInstanceTicker from '@/components/MkInstanceTicker.vue';
import { userPage } from '@/utils.js';
import { notePage } from '@/utils.js';
import number from '@/filters/number.js';
import { i18n } from '@/i18n.js';
import { deepClone } from '@/scripts/clone.js';
import { extractUrlFromMfm } from '@/scripts/extract-url-from-mfm.js';
import { shouldCollapsed } from '@/scripts/collapsed.js';
import { instance } from '@/instance.js';
import { url } from '@/config.js';

const props = defineProps<{
	note: Misskey.entities.Note;
}>();

const inChannel = inject('inChannel', null);

const note = ref(deepClone(props.note));

const isRenote = (
	note.value.renote != null &&
	note.value.reply == null &&
	note.value.text == null &&
	note.value.cw == null &&
	note.value.fileIds && note.value.fileIds.length === 0 &&
	note.value.poll == null
);

const appearNote = computed(() => isRenote ? note.value.renote as Misskey.entities.Note : note.value);
const showContent = ref(false);
const isDeleted = ref(false);
const parsed = appearNote.value.text ? mfm.parse(appearNote.value.text) : null;
const urls = parsed ? extractUrlFromMfm(parsed).filter((url) => appearNote.value.renote?.url !== url && appearNote.value.renote?.uri !== url) : null;
const isLong = shouldCollapsed(appearNote.value, urls ?? []);
const collapsed = ref(appearNote.value.cw == null && isLong);
const showTicker = appearNote.value.user.instance != null;
</script>

<style lang="scss" module>
.root {
	position: relative;
	transition: box-shadow 0.1s ease;
	overflow: clip;
	contain: content;
}

.replyTo {
	opacity: 0.7;
	padding-bottom: 0;
}

.renote {
	display: flex;
	align-items: center;
	padding: 16px 32px 8px 32px;
	line-height: 28px;
	white-space: pre;
	color: var(--renote);
}

.renoteAvatar {
	flex-shrink: 0;
	display: inline-block;
	width: 28px;
	height: 28px;
	margin: 0 8px 0 0;
	border-radius: 6px;
}

.renoteText {
	overflow: hidden;
	flex-shrink: 1;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.renoteName {
	font-weight: bold;
}

.renoteInfo {
	margin-left: auto;
	font-size: 0.9em;
}

.renoteTime {
	flex-shrink: 0;
	color: inherit;
}

.renote + .note {
	padding-top: 8px;
}

.note {
	padding: 24px 32px 16px;
	font-size: 1.2em;

	&:hover > .main > .footer > .button {
		opacity: 1;
	}
}

.noteHeader {
	display: flex;
	position: relative;
	margin-bottom: 16px;
	align-items: center;
}

.noteHeaderAvatar {
	display: block;
	flex-shrink: 0;
	width: 50px;
	height: 50px;
}

.noteHeaderBody {
	flex: 1;
	display: flex;
	min-width: 0;
	flex-direction: column;
	justify-content: center;
	padding-left: 16px;
	font-size: 0.95em;
}

.noteHeaderBodyUpper {
	display: flex;
	min-width: 0;
}

.noteHeaderName {
	font-weight: bold;
	line-height: 1.3;
}

.isBot {
	display: inline-block;
	margin: 0 0.5em;
	padding: 4px 6px;
	font-size: 80%;
	line-height: 1;
	border: solid 0.5px var(--divider);
	border-radius: 4px;
}

.noteHeaderInfo {
	margin-left: auto;
	display: flex;
	gap: 0.5em;
	align-items: center;
}

.noteHeaderInstanceIconLink {
	display: inline-block;
	margin-left: 4px;
}

.noteHeaderInstanceIcon {
	width: 32px;
	height: 32px;
	border-radius: 4px;
}

.noteHeaderUsername {
	margin-bottom: 2px;
	line-height: 1.3;
	word-wrap: anywhere;
}

.noteContent {
	container-type: inline-size;
	overflow-wrap: break-word;
}

.cw {
	cursor: default;
	display: block;
	margin: 0;
	padding: 0;
	overflow-wrap: break-word;
}

.noteReplyTarget {
	color: var(--accent);
	margin-right: 0.5em;
}

.rn {
	margin-left: 4px;
	font-style: oblique;
	color: var(--renote);
}

.reactionOmitted {
	display: inline-block;
	margin-left: 8px;
	opacity: .8;
	font-size: 95%;
}

.poll {
	font-size: 80%;
}

.quote {
	padding: 8px 0;
}

.quoteNote {
	padding: 16px;
	border: dashed 1px var(--renote);
	border-radius: 8px;
	overflow: clip;
}

.channel {
	opacity: 0.7;
	font-size: 80%;
}

.showLess {
	width: 100%;
	margin-top: 14px;
	position: sticky;
	bottom: calc(var(--stickyBottom, 0px) + 14px);
}

.showLessLabel {
	display: inline-block;
	background: var(--popup);
	padding: 6px 10px;
	font-size: 0.8em;
	border-radius: 999px;
	box-shadow: 0 2px 6px rgb(0 0 0 / 20%);
}

.contentCollapsed {
	position: relative;
	max-height: 9em;
	overflow: clip;
}

.collapsed {
	display: block;
	position: absolute;
	bottom: 0;
	left: 0;
	z-index: 2;
	width: 100%;
	height: 64px;
	background: linear-gradient(0deg, var(--panel), var(--X15));

	&:hover > .collapsedLabel {
		background: var(--panelHighlight);
	}
}

.collapsedLabel {
	display: inline-block;
	background: var(--panel);
	padding: 6px 10px;
	font-size: 0.8em;
	border-radius: 999px;
	box-shadow: 0 2px 6px rgb(0 0 0 / 20%);
}

.noteFooterInfo {
	margin: 16px 0;
	opacity: 0.7;
	font-size: 0.9em;
}

.noteFooterButton {
	margin: 0;
	padding: 8px;
	opacity: 0.7;

	&:not(:last-child) {
		margin-right: 28px;
	}

	&:hover {
		color: var(--fgHighlighted);
	}
}

.footerButtonLink:hover,
.footerButtonLink:focus,
.footerButtonLink:active {
	text-decoration: none;
}

.noteFooterButtonCount {
	display: inline;
	margin: 0 0 0 8px;
	opacity: 0.7;

	&.reacted {
		color: var(--accent);
	}
}

@container (max-width: 500px) {
	.root {
		font-size: 0.9em;
	}
}

@container (max-width: 450px) {
	.renote {
		padding: 8px 16px 0 16px;
	}

	.note {
		padding: 16px;
	}

	.noteHeaderAvatar {
		width: 50px;
		height: 50px;
	}
}

@container (max-width: 350px) {
	.noteFooterButton {
		&:not(:last-child) {
			margin-right: 18px;
		}
	}
}

@container (max-width: 300px) {
	.root {
		font-size: 0.825em;
	}

	.noteHeaderAvatar {
		width: 50px;
		height: 50px;
	}

	.noteFooterButton {
		&:not(:last-child) {
			margin-right: 12px;
		}
	}
}
</style>
