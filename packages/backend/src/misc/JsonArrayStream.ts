import { TransformStream } from 'node:stream/web';

/**
 * ストリームに流れてきた各データについて`JSON.stringify()`した上で、それらを一つの配列にまとめる
 */
export class JsonArrayStream extends TransformStream<unknown, string> {
	constructor() {
		/** 最初の要素かどうかを変数に記録 */
		let isFirst = true;

		super({
			start(controller) {
				controller.enqueue('[');
			},
			flush(controller) {
				controller.enqueue(']');
			},
			transform(chunk, controller) {
				if (isFirst) {
					isFirst = false;
				} else {
					// 妥当なJSON配列にするためには最初以外の要素の前に`,`を挿入しなければならない
					controller.enqueue(',\n');
				}

				controller.enqueue(JSON.stringify(chunk));
			},
		});
	}
}
