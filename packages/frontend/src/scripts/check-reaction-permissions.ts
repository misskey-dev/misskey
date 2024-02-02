import * as Misskey from 'misskey-js';

export function checkReactionPermissions(me: Misskey.entities.MeDetailed, note: Misskey.entities.Note, emoji: Misskey.entities.EmojiDetailed): {
  accepted: true;
} | {
  accepted: false;
  rejectedReason: 'localOnly' | 'isSensitive' | 'roleIdsThatCanBeUsedThisEmojiAsReaction';
} {
  if (emoji.localOnly && note.user.host !== me.host) {
    return { accepted: false, rejectedReason: 'localOnly' };
  }
  if (emoji.isSensitive && (note.reactionAcceptance === 'nonSensitiveOnly' || note.reactionAcceptance === 'nonSensitiveOnlyForLocalLikeOnlyForRemote')) {
    return { accepted: false, rejectedReason: 'isSensitive' };
  }
  if (!(emoji.roleIdsThatCanBeUsedThisEmojiAsReaction.length === 0 || me.roles.some(role => emoji.roleIdsThatCanBeUsedThisEmojiAsReaction.includes(role.id)))) {
    return { accepted: false, rejectedReason: 'roleIdsThatCanBeUsedThisEmojiAsReaction' };
  }
  return { accepted: true };
}
