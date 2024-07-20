import assert from "node:assert"
import { calcWaitPatterns } from "../src/common.fu"
import { analyzeFourMentsuOneJyantou } from "../src/common"

describe('Fu', () => {
	describe('Wait patterns', () => {
		it('Ryanmen', () => {
			assert.deepStrictEqual(calcWaitPatterns(analyzeFourMentsuOneJyantou(
				['m2', 'm3', 'm4', 'p6', 'p7', 'p8', 'p5', 'p6', 'p7', 's1', 's1', 's7', 's8', 's9']
			)[0], 's9'), [{
				completes: 'mentsu',
				agariTile: 's9',
				taatsu: ['s7', 's8'],
			}]);
		});

		it('Kanchan', () => {
			assert.deepStrictEqual(calcWaitPatterns(analyzeFourMentsuOneJyantou(
				['m2', 'm3', 'm4', 'p6', 'p7', 'p8', 'p5', 'p6', 'p7', 's1', 's1', 's7', 's8', 's9']
			)[0], 's8'), [{
				completes: 'mentsu',
				agariTile: 's8',
				taatsu: ['s7', 's9'],
			}]);
		})

		it('Penchan', () => {
			assert.deepStrictEqual(calcWaitPatterns(analyzeFourMentsuOneJyantou(
				['m2', 'm3', 'm4', 'p6', 'p7', 'p8', 'p5', 'p6', 'p7', 's1', 's1', 's7', 's8', 's9']
			)[0], 's7'), [{
				completes: 'mentsu',
				agariTile: 's7',
				taatsu: ['s8', 's9'],
			}]);
		})

		it('Tanki', () => {
			assert.deepStrictEqual(calcWaitPatterns(analyzeFourMentsuOneJyantou(
				['m1', 'm1', 'm1', 'm2', 'm2', 'm2', 'm3', 'm3', 'm3', 'haku', 'haku', 'haku', 'e', 'e']
			)[0], 'e'), [{
				completes: 'head',
				agariTile: 'e',
			}]);
		});

		it('Nobetan', () => {
			assert.deepStrictEqual(calcWaitPatterns(analyzeFourMentsuOneJyantou(
				['m1', 'm2', 'm3', 'm5', 'm6', 'm7', 'p2', 'p3', 'p4', 's3', 's4', 's5', 's6', 's6']
			)[0], 's6'), [{
				completes: 'head',
				agariTile: 's6',
			}]);
		});
	});
});
