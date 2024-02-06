import * as Misskey from 'misskey-js';

export function checkReactionPermissions(me: Misskey.entities.MeDetailed, note: Misskey.entities.Note, emoji: Misskey.entities.EmojiSimple): boolean {
	const roleIdsThatCanBeUsedThisEmojiAsReaction = emoji.roleIdsThatCanBeUsedThisEmojiAsReaction ?? [];
	const roleIdsThatCanNotBeUsedThisEmojiAsReaction = emoji.roleIdsThatCanNotBeUsedThisEmojiAsReaction ?? [];

	return !(emoji.localOnly && note.user.host !== me.host)
		&& !(emoji.isSensitive && (note.reactionAcceptance === 'nonSensitiveOnly' || note.reactionAcceptance === 'nonSensitiveOnlyForLocalLikeOnlyForRemote'))
		&& (roleIdsThatCanBeUsedThisEmojiAsReaction.length === 0 || me.roles.some(role => roleIdsThatCanBeUsedThisEmojiAsReaction.includes(role.id)))
		&& (roleIdsThatCanNotBeUsedThisEmojiAsReaction.length === 0 || !me.roles.some(role => roleIdsThatCanNotBeUsedThisEmojiAsReaction.includes(role.id)));
}
