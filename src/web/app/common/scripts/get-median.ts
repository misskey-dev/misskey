/**
 * 中央値を求めます
 * @param samples サンプル
 */
export default function(samples) {
	if (!samples.length) return 0;
	const numbers = samples.slice(0).sort((a, b) => a - b);
	const middle = Math.floor(numbers.length / 2);
	const isEven = numbers.length % 2 === 0;
	return isEven ? (numbers[middle] + numbers[middle - 1]) / 2 : numbers[middle];
}
