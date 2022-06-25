import { Feed } from 'feed';
import { In, IsNull } from 'typeorm';
import config from '@/config/index.js';
import { User } from '@/models/entities/user.js';
import { Notes, DriveFiles, UserProfiles, Users } from '@/models/index.js';

export default async function(user: User, threadDepth = 5, history = 20, noteintitle = false, renotes = true, replies = true) {
	const author = {
		link: `${config.url}/@${user.username}`,
		email: `${user.username}@${config.host}`,
		name: user.name || user.username
	};

	const profile = await UserProfiles.findOneByOrFail({ userId: user.id });

	let searchCriteria = {
		userId: user.id,
		visibility: In(['public', 'home']),
	};

	if (!renotes) {
		searchCriteria.renoteId = IsNull();
	}

	if (!replies) {
		searchCriteria.replyId = IsNull();
	}

	const notes = await Notes.find({
		where: searchCriteria,
		order: { createdAt: -1 },
		take: history,
	});

	const feed = new Feed({
		id: author.link,
		title: `${author.name} (@${user.username}@${config.host})`,
		updated: notes[0].createdAt,
		generator: 'Misskey',
		description: `${user.notesCount} Notes, ${profile.ffVisibility === 'public' ? user.followingCount : '?'} Following, ${profile.ffVisibility === 'public' ? user.followersCount : '?'} Followers${profile.description ? ` · ${profile.description}` : ''}`,
		link: author.link,
		image: await Users.getAvatarUrl(user),
		feedLinks: {
			json: `${author.link}.json`,
			atom: `${author.link}.atom`,
		},
		author,
		copyright: user.name || user.username,
	});

	for (const note of notes) {
		let contentStr = await noteToString(note, true);
		let next = note.renoteId ? note.renoteId : note.replyId;
		let depth = threadDepth;
		while (depth > 0 && next) {
			const finding = await findById(next);
			contentStr += finding.text;
			next = finding.next;
			depth -= 1;
		}

		let title = `${author.name} `;
		if (note.renoteId) {
			title += 'renotes';
		} else if (note.replyId) {
			title += 'replies';
		} else {
			title += 'says';
		}
		if (noteintitle) {
			const content = note.cw ?? note.text;
			if (content) {
				title += `: ${content}`;
			} else {
				title += 'something';
			}
		}

		feed.addItem({
			title: title.replace(/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/g, '').substring(0,100),
			link: `${config.url}/notes/${note.id}`,
			date: note.createdAt,
			description: note.cw ? note.cw.replace(/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/g, '') : undefined,
			content: contentStr.replace(/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/g, '')
		});
	}

	async function noteToString(note, isTheNote = false) {
		const author = isTheNote ? null : await Users.findOneBy({ id: note.userId });
		let outstr = author ? `${author.name}(@${author.username}@${author.host ? author.host : config.host}) ${(note.renoteId ? 'renotes' : (note.replyId ? 'replies' : 'says'))}: <br>` : '';
		const files = note.fileIds.length > 0 ? await DriveFiles.findBy({
			id: In(note.fileIds),
		}) : [];
		let fileEle = '';
		for (const file of files) {
			if (file.type.startsWith('image/')) {
				fileEle += ` <br><img src="${DriveFiles.getPublicUrl(file)}">`;
			} else if (file.type.startsWith('audio/')) {
				fileEle += ` <br><audio controls src="${DriveFiles.getPublicUrl(file)}" type="${file.type}">`;
			} else if (file.type.startsWith('video/')) {
				fileEle += ` <br><video controls src="${DriveFiles.getPublicUrl(file)}" type="${file.type}">`;
			} else {
				fileEle += ` <br><a href="${DriveFiles.getPublicUrl(file)}" download="${file.name}">${file.name}</a>`;
			}
		}
		outstr += `${note.cw ? note.cw + '<br>' : ''}${note.text || ''}${fileEle}`;
		if (isTheNote) {
			outstr += ` <span class="${(note.renoteId ? 'renote_note' : (note.replyId ? 'reply_note' : 'new_note'))} ${(fileEle.indexOf('img src') !== -1 ? 'with_img' : 'without_img')}"></span>`;
		}
		return outstr;
	}

	async function findById(id) {
		let text = '';
		let next = null;
		const findings = await Notes.findOneBy({ id: id, visibility: In(['public', 'home']) });
		if (findings) {
			text += `<hr>`;
			text += await noteToString(findings);
			next = findings.renoteId ? findings.renoteId : findings.replyId;
		}
		return { text, next };
	}

	return feed;
}
