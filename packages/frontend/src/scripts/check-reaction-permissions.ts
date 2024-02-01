import * as Misskey from 'misskey-js';

export function checkReactionPermissions(me: Misskey.entities.MeDetailed, note: Misskey.entities.Note, emoji: Misskey.entities.EmojiDetailed): {
  allowed: true;
} | {
  allowed: false;
  deniedReason: 'localOnly' | 'isSensitive' | 'roleIdsThatCanBeUsedThisEmojiAsReaction';
} {
  if (emoji.localOnly && note.user.host !== me.host) {
    return { allowed: false, deniedReason: 'localOnly' };
  }
  if (emoji.isSensitive && (note.reactionAcceptance === 'nonSensitiveOnly' || note.reactionAcceptance === 'nonSensitiveOnlyForLocalLikeOnlyForRemote')) {
    return { allowed: false, deniedReason: 'isSensitive' };
  }
  if (!(emoji.roleIdsThatCanBeUsedThisEmojiAsReaction.length === 0 || me.roles.some(role => emoji.roleIdsThatCanBeUsedThisEmojiAsReaction.includes(role.id)))) {
    return { allowed: false, deniedReason: 'roleIdsThatCanBeUsedThisEmojiAsReaction' };
  }
  return { allowed: true };
}
