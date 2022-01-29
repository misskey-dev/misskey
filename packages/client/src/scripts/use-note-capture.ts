import { onUnmounted, Ref } from 'vue';
import * as misskey from 'misskey-js';
import { stream } from '@/stream';
import { $i } from '@/account';

export function useNoteCapture(props: {
	rootEl: Ref<HTMLElement>;
	appearNote: Ref<misskey.entities.Note>;
}) {
	const appearNote = props.appearNote;
	const connection = $i ? stream : null;

	function onStreamNoteUpdated(data): void {
		const { type, id, body } = data;

		if (id !== appearNote.value.id) return;

		switch (type) {
			case 'reacted': {
				const reaction = body.reaction;

				if (body.emoji) {
					const emojis = appearNote.value.emojis || [];
					if (!emojis.includes(body.emoji)) {
						appearNote.value.emojis = [...emojis, body.emoji];
					}
				}

				// TODO: reactionsプロパティがない場合ってあったっけ？ なければ || {} は消せる
				const currentCount = (appearNote.value.reactions || {})[reaction] || 0;

				appearNote.value.reactions[reaction] = currentCount + 1;

				if ($i && (body.userId === $i.id)) {
					appearNote.value.myReaction = reaction;
				}
				break;
			}

			case 'unreacted': {
				const reaction = body.reaction;

				// TODO: reactionsプロパティがない場合ってあったっけ？ なければ || {} は消せる
				const currentCount = (appearNote.value.reactions || {})[reaction] || 0;

				appearNote.value.reactions[reaction] = Math.max(0, currentCount - 1);

				if ($i && (body.userId === $i.id)) {
					appearNote.value.myReaction = null;
				}
				break;
			}

			case 'pollVoted': {
				const choice = body.choice;

				const choices = [...appearNote.value.poll.choices];
				choices[choice] = {
					...choices[choice],
					votes: choices[choice].votes + 1,
					...($i && (body.userId === $i.id) ? {
						isVoted: true
					} : {})
				};

				appearNote.value.poll.choices = choices;
				break;
			}

			case 'deleted': {
				appearNote.value.deletedAt = new Date();
				break;
			}
		}
	}

	function capture(withHandler = false): void {
		if (connection) {
			// TODO: このノートがストリーミング経由で流れてきた場合のみ sr する
			connection.send(document.body.contains(props.rootEl.value) ? 'sr' : 's', { id: appearNote.value.id });
			if (withHandler) connection.on('noteUpdated', onStreamNoteUpdated);
		}
	}

	function decapture(withHandler = false): void {
		if (connection) {
			connection.send('un', {
				id: appearNote.value.id,
			});
			if (withHandler) connection.off('noteUpdated', onStreamNoteUpdated);
		}
	}

	function onStreamConnected() {
		capture(false);
	}
	
	capture(true);
	if (connection) {
		connection.on('_connected_', onStreamConnected);
	}
	
	onUnmounted(() => {
		decapture(true);
		if (connection) {
			connection.off('_connected_', onStreamConnected);
		}
	});
}
