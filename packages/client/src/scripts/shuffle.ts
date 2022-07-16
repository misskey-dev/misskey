/**
 * 配列をシャッフル (破壊的)
 */
export function shuffle<T extends any[]>(array: T): T {
	let currentIndex = array.length, randomIndex;

	// While there remain elements to shuffle.
	while (currentIndex !== 0) {
		// Pick a remaining element.
		randomIndex = Math.floor(Math.random() * currentIndex);
		currentIndex--;

		// And swap it with the current element.
		[array[currentIndex], array[randomIndex]] = [
			array[randomIndex], array[currentIndex]];
	}

	return array;
}
