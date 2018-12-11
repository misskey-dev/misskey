import { switchMap } from "../prelude/functional-syntax";

export default function(reaction: string): string {
	return switchMap(reaction, '',
		['like', '👍'],
		['love', '❤️'],
		['laugh', '😆'],
		['hmm', '🤔'],
		['surprise', '😮'],
		['congrats', '🎉'],
		['angry', '💢'],
		['confused', '😥'],
		['rip', '😇'],
		['pudding', '🍮']);
}
