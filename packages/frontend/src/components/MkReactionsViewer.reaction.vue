<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<button
	ref="buttonEl"
	v-ripple="canToggle"
	class="_button"
	:class="[$style.root, { [$style.gamingDark]: gamingType === 'dark',[$style.gamingLight]: gamingType === 'light' ,[$style.reacted]: note.myReactions?.includes(reaction) , [$style.canToggle]: canToggle, [$style.small]: defaultStore.state.reactionsDisplaySize === 'small', [$style.large]: defaultStore.state.reactionsDisplaySize === 'large' }]"
	@click="toggleReaction()"
	@contextmenu.prevent.stop="menu"
>
	<MkReactionIcon :class="defaultStore.state.limitWidthOfReaction ? $style.limitWidth : ''" :reaction="reaction" :emojiUrl="note.reactionEmojis[reaction.substring(1, reaction.length - 1)]"/>
	<span :class="[$style.count,{ [$style.gamingDark]: gamingType === 'dark',[$style.gamingLight]: gamingType === 'light'}]">{{ count }}</span>
</button>
</template>

<script lang="ts" setup>
import { computed, inject, onMounted, ref, shallowRef, watch } from 'vue';
import * as Misskey from 'misskey-js';
import MkCustomEmojiDetailedDialog from './MkCustomEmojiDetailedDialog.vue';
import XDetails from '@/components/MkReactionsViewer.details.vue';
import MkReactionIcon from '@/components/MkReactionIcon.vue';
import * as os from '@/os.js';
import { misskeyApi, misskeyApiGet } from '@/scripts/misskey-api.js';
import { useTooltip } from '@/scripts/use-tooltip.js';
import { $i } from '@/account.js';
import MkReactionEffect from '@/components/MkReactionEffect.vue';
import { claimAchievement } from '@/scripts/achievements.js';
import { defaultStore } from '@/store.js';
import { i18n } from '@/i18n.js';
import * as sound from '@/scripts/sound.js';
import { checkReactionPermissions } from '@/scripts/check-reaction-permissions.js';
import { customEmojisMap } from '@/custom-emojis.js';
import { getUnicodeEmoji } from '@/scripts/emojilist.js';

let gamingType = computed(defaultStore.makeGetterSetter('gamingType'));

const props = defineProps<{
	reaction: string;
	count: number;
	isInitial: boolean;
	note: Misskey.entities.Note & {
		myReactions: string[];
	}
}>();

const mock = inject<boolean>('mock', false);

const emit = defineEmits<{
	(ev: 'reactionToggled', emoji: string, newCount: number): void;
}>();

const buttonEl = shallowRef<HTMLElement>();

const emojiName = computed(() => props.reaction.replace(/:/g, '').replace(/@\./, ''));
const emoji = computed(() => customEmojisMap.get(emojiName.value) ?? getUnicodeEmoji(props.reaction));

const canToggle = computed(() => {
	return !props.reaction.match(/@\w/) && $i && emoji.value && checkReactionPermissions($i, props.note, emoji.value);
});
const canGetInfo = computed(() => !props.reaction.match(/@\w/) && props.reaction.includes(':'));

async function toggleReaction() {
	if (!canToggle.value) return;

	const oldReaction = props.note.myReactions.includes(props.reaction) ? props.reaction : null;
	console.log(oldReaction);
	if (oldReaction) {
		const confirm = await os.confirm({
			type: 'warning',
			text: oldReaction !== props.reaction ? i18n.ts.changeReactionConfirm : i18n.ts.cancelReactionConfirm,
		});
		if (confirm.canceled) return;
		props.note.myReactions.splice(props.note.myReactions.indexOf(oldReaction), 1);
		if (oldReaction !== props.reaction) {
			sound.playMisskeySfx('reaction');
		}

		if (mock) {
			emit('reactionToggled', props.reaction, (props.count - 1));
			return;
		}

		misskeyApi('notes/reactions/delete', {
			noteId: props.note.id,
			reaction: oldReaction,
		}).then(() => {
			if (oldReaction !== props.reaction ) {
				misskeyApi('notes/reactions/create', {
					noteId: props.note.id,
					reaction: props.reaction,
				});
			}
		});
	} else {
		sound.playMisskeySfx('reaction');

		if (mock) {
			emit('reactionToggled', props.reaction, (props.count + 1));
			return;
		}

		misskeyApi('notes/reactions/create', {
			noteId: props.note.id,
			reaction: props.reaction,
		});
		if (props.note.text && props.note.text.length > 100 && (Date.now() - new Date(props.note.createdAt).getTime() < 1000 * 3)) {
			claimAchievement('reactWithoutRead');
		}
	}
}

async function menu(ev) {
	if (!canGetInfo.value) return;

	os.popupMenu([{
		text: i18n.ts.info,
		icon: 'ti ti-info-circle',
		action: async () => {
			os.popup(MkCustomEmojiDetailedDialog, {
				emoji: await misskeyApiGet('emoji', {
					name: props.reaction.replace(/:/g, '').replace(/@\./, ''),
				}),
			});
		},
	}], ev.currentTarget ?? ev.target);
}

function anime() {
	if (document.hidden || !defaultStore.state.animation || buttonEl.value == null) return;

	const rect = buttonEl.value.getBoundingClientRect();
	const x = rect.left + 16;
	const y = rect.top + (buttonEl.value.offsetHeight / 2);
	os.popup(MkReactionEffect, { reaction: props.reaction, x, y }, {}, 'end');
}

watch(() => props.count, (newCount, oldCount) => {
	if (oldCount < newCount) anime();
});

onMounted(() => {
	if (!props.isInitial) anime();
});

if (!mock) {
	useTooltip(buttonEl, async (showing) => {
		const reactions = await misskeyApiGet('notes/reactions', {
			noteId: props.note.id,
			type: props.reaction,
			limit: 10,
			_cacheKey_: props.count,
		});

		const users = reactions.map(x => x.user);

		os.popup(XDetails, {
			showing,
			reaction: props.reaction,
			users,
			count: props.count,
			targetElement: buttonEl.value,
		}, {}, 'closed');
	}, 100);
}
</script>

<style lang="scss" module>
.root {
	display: inline-flex;
	height: 42px;
	margin: 2px;
	padding: 0 6px;
	font-size: 1.5em;
	border-radius: 6px;
	align-items: center;
	justify-content: center;

	&.canToggle {
		background: var(--buttonBg);

		&:hover {
			background: rgba(0, 0, 0, 0.1);
		}
	}

	&:not(.canToggle) {
		cursor: default;
	}

	&.small {
		height: 32px;
		font-size: 1em;
		border-radius: 4px;

		> .count {
			font-size: 0.9em;
			line-height: 32px;
		}
	}

	&.large {
		height: 52px;
		font-size: 2em;
		border-radius: 8px;

		> .count {
			font-size: 0.6em;
			line-height: 52px;
		}
	}

	&.reacted, &.reacted:hover {
		background: var(--accentedBg);
		color: var(--accent);
		box-shadow: 0 0 0 1px var(--accent) inset;

    &.gamingDark{
      color: black;
      background: linear-gradient(270deg, #e7a2a2, #e3cfa2, #ebefa1, #b3e7a6, #a6ebe7, #aec5e3, #cabded, #e0b9e3, #f4bddd);      background-size: 1800% 1800%;
      -webkit-animation: AnimationDark var(--gamingspeed) cubic-bezier(0, 0.2, 0.90, 1) infinite;
      -moz-animation: AnimationDark var(--gamingspeed) cubic-bezier(0, 0.2, 0.90, 1) infinite;
      animation: AnimationDark var(--gamingspeed) cubic-bezier(0, 0.2, 0.90, 1) infinite;
      box-shadow: 0 0 0px 1px white inset;
    }

    &.gamingLight{
      background: linear-gradient(270deg, #c06161, #c0a567, #b6ba69, #81bc72, #63c3be, #8bacd6, #9f8bd6, #d18bd6, #d883b4);     background-size: 1800% 1800% !important;
      -webkit-animation: AnimationLight var(--gamingspeed) cubic-bezier(0, 0.2, 0.90, 1) infinite !important;
      -moz-animation: AnimationLight var(--gamingspeed) cubic-bezier(0, 0.2, 0.90, 1) infinite !important;
      animation: AnimationLight var(--gamingspeed) cubic-bezier(0, 0.2, 0.90, 1) infinite !important;
      box-shadow: 0 0 0px 1px white inset;
      color: white !important;
    }

		> .count {
			color: var(--accent);
      &.gamingLight{
        color: white;
      }
      &.gamingDark{
        color: black;
      }
		}

		> .icon {
			filter: drop-shadow(0 0 2px rgba(0, 0, 0, 0.5));
		}
	}
}

.limitWidth {
	max-width: 70px;
	object-fit: contain;
}

.count {
	font-size: 0.7em;
	line-height: 42px;
	margin: 0 0 0 4px;
}
@-webkit-keyframes AnimationLight {
  0% {
    background-position: 0% 50%
  }
  50% {
    background-position: 100% 50%
  }
  100% {
    background-position: 0% 50%
  }
}
@-moz-keyframes AnimationLight {
  0% {
    background-position: 0% 50%
  }
  50% {
    background-position: 100% 50%
  }
  100% {
    background-position: 0% 50%
  }
}  @keyframes AnimationLight {
     0% {
       background-position: 0% 50%
     }
     50% {
       background-position: 100% 50%
     }
     100% {
       background-position: 0% 50%
     }
   }
@-webkit-keyframes AnimationDark {
  0% {
    background-position: 0% 50%
  }
  50% {
    background-position: 100% 50%
  }
  100% {
    background-position: 0% 50%
  }
}
@-moz-keyframes AnimationDark {
  0% {
    background-position: 0% 50%
  }
  50% {
    background-position: 100% 50%
  }
  100% {
    background-position: 0% 50%
  }
}
@keyframes AnimationDark {
  0% {
    background-position: 0% 50%
  }
  50% {
    background-position: 100% 50%
  }
  100% {
    background-position: 0% 50%
  }
}
</style>
