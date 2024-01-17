import {expect, suite, test} from "vitest";
import {Release, ReleaseCategory} from "../src/parser";
import {checkNewRelease, checkNewTopic} from "../src/checker";

suite('checkNewRelease', () => {
	test('headに新しいリリースがある1', () => {
		const base = [new Release('2024.12.0')]
		const head = [new Release('2024.12.1'), new Release('2024.12.0')]

		const result = checkNewRelease(base, head)

		expect(result.success).toBe(true)
	})

	test('headに新しいリリースがある2', () => {
		const base = [new Release('2024.12.0')]
		const head = [new Release('2024.12.2'), new Release('2024.12.1'), new Release('2024.12.0')]

		const result = checkNewRelease(base, head)

		expect(result.success).toBe(true)
	})


	test('リリースの数が同じ', () => {
		const base = [new Release('2024.12.0')]
		const head = [new Release('2024.12.0')]

		const result = checkNewRelease(base, head)

		console.log(result.message)
		expect(result.success).toBe(false)
	})

	test('baseにあるリリースがheadにない', () => {
		const base = [new Release('2024.12.0')]
		const head = [new Release('2024.12.2'), new Release('2024.12.1')]

		const result = checkNewRelease(base, head)

		console.log(result.message)
		expect(result.success).toBe(false)
	})
})

suite('checkNewTopic', () => {
	test('追記なし', () => {
		const base = [
			new Release('2024.12.1', [
				new ReleaseCategory('Server', [
					'feat1',
					'feat2',
				]),
				new ReleaseCategory('Client', [
					'feat3',
					'feat4',
				])
			]),
			new Release('2024.12.0', [
				new ReleaseCategory('Server', [
					'feat1',
					'feat2',
				]),
				new ReleaseCategory('Client', [
					'feat3',
					'feat4',
				])
			])
		]

		const head = [
			new Release('2024.12.1', [
				new ReleaseCategory('Server', [
					'feat1',
					'feat2',
				]),
				new ReleaseCategory('Client', [
					'feat3',
					'feat4',
				])
			]),
			new Release('2024.12.0', [
				new ReleaseCategory('Server', [
					'feat1',
					'feat2',
				]),
				new ReleaseCategory('Client', [
					'feat3',
					'feat4',
				])
			])
		]

		const result = checkNewTopic(base, head)

		expect(result.success).toBe(true)
	})

	test('最新バージョンにカテゴリを追加したときはエラーにならない', () => {
		const base = [
			new Release('2024.12.1', [
				new ReleaseCategory('Server', [
					'feat1',
					'feat2',
				]),
			]),
			new Release('2024.12.0', [
				new ReleaseCategory('Server', [
					'feat1',
					'feat2',
				]),
				new ReleaseCategory('Client', [
					'feat3',
					'feat4',
				])
			])
		]

		const head = [
			new Release('2024.12.1', [
				new ReleaseCategory('Server', [
					'feat1',
					'feat2',
				]),
				new ReleaseCategory('Client', [
					'feat3',
					'feat4',
				])
			]),
			new Release('2024.12.0', [
				new ReleaseCategory('Server', [
					'feat1',
					'feat2',
				]),
				new ReleaseCategory('Client', [
					'feat3',
					'feat4',
				])
			])
		]

		const result = checkNewTopic(base, head)

		expect(result.success).toBe(true)
	})

	test('最新バージョンからカテゴリを削除したときはエラーにならない', () => {
		const base = [
			new Release('2024.12.1', [
				new ReleaseCategory('Server', [
					'feat1',
					'feat2',
				]),
				new ReleaseCategory('Client', [
					'feat3',
					'feat4',
				])
			]),
			new Release('2024.12.0', [
				new ReleaseCategory('Server', [
					'feat1',
					'feat2',
				]),
				new ReleaseCategory('Client', [
					'feat3',
					'feat4',
				])
			])
		]

		const head = [
			new Release('2024.12.1', [
				new ReleaseCategory('Server', [
					'feat1',
					'feat2',
				]),
			]),
			new Release('2024.12.0', [
				new ReleaseCategory('Server', [
					'feat1',
					'feat2',
				]),
				new ReleaseCategory('Client', [
					'feat3',
					'feat4',
				])
			])
		]

		const result = checkNewTopic(base, head)

		expect(result.success).toBe(true)
	})

	test('最新バージョンに追記したときはエラーにならない', () => {
		const base = [
			new Release('2024.12.1', [
				new ReleaseCategory('Server', [
					'feat1',
					'feat2',
				]),
			]),
			new Release('2024.12.0', [
				new ReleaseCategory('Server', [
					'feat1',
					'feat2',
				]),
			])
		]

		const head = [
			new Release('2024.12.1', [
				new ReleaseCategory('Server', [
					'feat1',
					'feat2',
					'feat3',
				]),
			]),
			new Release('2024.12.0', [
				new ReleaseCategory('Server', [
					'feat1',
					'feat2',
				]),
			])
		]

		const result = checkNewTopic(base, head)

		expect(result.success).toBe(true)
	})

	test('最新バージョンから削除したときはエラーにならない', () => {
		const base = [
			new Release('2024.12.1', [
				new ReleaseCategory('Server', [
					'feat1',
					'feat2',
				]),
			]),
			new Release('2024.12.0', [
				new ReleaseCategory('Server', [
					'feat1',
					'feat2',
				]),
			])
		]

		const head = [
			new Release('2024.12.1', [
				new ReleaseCategory('Server', [
					'feat1',
				]),
			]),
			new Release('2024.12.0', [
				new ReleaseCategory('Server', [
					'feat1',
					'feat2',
				]),
			])
		]

		const result = checkNewTopic(base, head)

		expect(result.success).toBe(true)
	})

	test('古いバージョンにカテゴリを追加したときはエラーになる', () => {
		const base = [
			new Release('2024.12.1', [
				new ReleaseCategory('Server', [
					'feat1',
					'feat2',
				]),
			]),
			new Release('2024.12.0', [
				new ReleaseCategory('Server', [
					'feat1',
					'feat2',
				]),
			])
		]

		const head = [
			new Release('2024.12.1', [
				new ReleaseCategory('Server', [
					'feat1',
					'feat2',
				]),
			]),
			new Release('2024.12.0', [
				new ReleaseCategory('Server', [
					'feat1',
					'feat2',
				]),
				new ReleaseCategory('Client', [
					'feat1',
					'feat2',
				]),
			])
		]

		const result = checkNewTopic(base, head)

		console.log(result.message)
		expect(result.success).toBe(false)
	})

	test('古いバージョンからカテゴリを削除したときはエラーになる', () => {
		const base = [
			new Release('2024.12.1', [
				new ReleaseCategory('Server', [
					'feat1',
					'feat2',
				]),
			]),
			new Release('2024.12.0', [
				new ReleaseCategory('Server', [
					'feat1',
					'feat2',
				]),
			])
		]

		const head = [
			new Release('2024.12.1', [
				new ReleaseCategory('Server', [
					'feat1',
					'feat2',
				]),
			]),
			new Release('2024.12.0', [
			])
		]

		const result = checkNewTopic(base, head)

		console.log(result.message)
		expect(result.success).toBe(false)
	})

	test('古いバージョンに追記したときはエラーになる', () => {
		const base = [
			new Release('2024.12.1', [
				new ReleaseCategory('Server', [
					'feat1',
					'feat2',
				]),
			]),
			new Release('2024.12.0', [
				new ReleaseCategory('Server', [
					'feat1',
					'feat2',
				]),
			])
		]

		const head = [
			new Release('2024.12.1', [
				new ReleaseCategory('Server', [
					'feat1',
					'feat2',
				]),
			]),
			new Release('2024.12.0', [
				new ReleaseCategory('Server', [
					'feat1',
					'feat2',
					'feat3',
				]),
			])
		]

		const result = checkNewTopic(base, head)

		console.log(result.message)
		expect(result.success).toBe(false)
	})

	test('古いバージョンから削除したときはエラーになる', () => {
		const base = [
			new Release('2024.12.1', [
				new ReleaseCategory('Server', [
					'feat1',
					'feat2',
				]),
			]),
			new Release('2024.12.0', [
				new ReleaseCategory('Server', [
					'feat1',
					'feat2',
				]),
			])
		]

		const head = [
			new Release('2024.12.1', [
				new ReleaseCategory('Server', [
					'feat1',
					'feat2',
				]),
			]),
			new Release('2024.12.0', [
				new ReleaseCategory('Server', [
					'feat1',
				]),
			])
		]

		const result = checkNewTopic(base, head)

		console.log(result.message)
		expect(result.success).toBe(false)
	})
})