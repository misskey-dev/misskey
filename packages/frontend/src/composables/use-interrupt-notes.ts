/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { shallowRef, triggerRef } from 'vue';
import type { DeepReadonly } from 'vue';
import type * as Misskey from 'misskey-js';
import { getPluginHandlers } from '@/plugin';
import { deepClone } from '@/utility/clone';

type NoteInObject<K extends string> = ('' extends K ? Misskey.entities.Note : { [P in K]?: Misskey.entities.Note }) & { readonly id: string };

function tryGetNote<K extends string, T extends NoteInObject<K>>(obj: T, key: K): Misskey.entities.Note | undefined {
	if (typeof obj === 'object') {
		if (key === '') return obj as Misskey.entities.Note;
		if (key in obj) {
			return (obj as never)[key] as Misskey.entities.Note;
		}
	}
	return undefined;
}

function setNote<K extends string, T extends NoteInObject<K>>(obj: T, key: K, note: Misskey.entities.Note): T {
	if (key === '') {
		return note as unknown as T;
	}
	return { ...obj, [key]: note } as T;
}

type InterruptNotes<T> = {
	(notes: readonly DeepReadonly<T>[]): T[];
};

const processingSymbol = Symbol('processing');

// 配列を渡すと note_view_interruptor したあとの配列を返す関数を取得する
// key は要素の中にある note のキーを指定する。'' を指定すると TElement が Note であるとしめす
export function useInterruptNotes<TElement extends NoteInObject<K>, K extends string>(key: K): InterruptNotes<TElement> {
	// proceedElements に interrupter 処理中の要素を保持することで毎回最初から処理し直すのを防ぐ
	// null は interrupter によって削除された要素を表す。processingSymbol は処理中の要素を表す。
	// この Record のキーは TElement の id。
	const proceedElements = shallowRef(new Map<DeepReadonly<TElement>, null | TElement | typeof processingSymbol>());

	const processNoteAsync = async (element: DeepReadonly<TElement>): Promise<TElement | null> => {
		const noteViewInterruptors = getPluginHandlers('note_view_interruptor');

		let result: TElement | null = deepClone(element as TElement);
		let resultNote: Misskey.entities.Note | null | undefined = tryGetNote(result, key);
		if (resultNote != null) {
			for (const interruptor of noteViewInterruptors) {
				try {
					resultNote = await interruptor.handler(resultNote!) as Misskey.entities.Note | null;
				} catch (err) {
					console.error(err);
				}
			}
			if (resultNote === null) {
				// note is removed
				result = null;
			} else {
				result = setNote(result, key, resultNote);
			}
		}
		return result;
	};

	return (elements) => {
		// proceedElements には elements の中にある要素のみを保持する
		for (const original of proceedElements.value.keys()) {
			if (!elements.some(n => n === original)) {
				proceedElements.value.delete(original);
			}
		}

		const result: TElement[] = [];

		for (const element of elements) {
			if (!proceedElements.value.has(element)) {
				proceedElements.value.set(element, processingSymbol);
				triggerRef(proceedElements);
				processNoteAsync(element).then(proceed => {
					proceedElements.value.set(element, proceed);
					triggerRef(proceedElements);
				});
			}
			const proceedElement = proceedElements.value.get(element);
			if (proceedElement !== processingSymbol && proceedElement != null) {
				result.push(proceedElement);
			}
		}

		return result;
	};
}
