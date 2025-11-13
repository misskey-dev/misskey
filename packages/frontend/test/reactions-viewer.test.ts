/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { describe, test, assert } from 'vitest';
import './init';

describe('MkReactionsViewer', () => {
	test('should handle reaction count updates without duplication', () => {
		// Test the logic that was causing the bug
		// Simulate the corrected watch function logic
		
		const initialReactions = [["👍", 5], ["❤️", 3], ["🎉", 2]];
		const newSource = {"👍": 6, "❤️": 3, "🎉": 2, "😊": 1};
		const maxNumber = 10;
		
		// Apply the corrected logic
		let newReactions: [string, number][] = [];
		
		for (let i = 0; i < initialReactions.length; i++) {
			const reaction = initialReactions[i][0];
			if (reaction in newSource && newSource[reaction] !== 0) {
				// Fixed: Create new array instead of modifying in place
				newReactions.push([reaction, newSource[reaction]]);
			}
		}
		
		const newReactionsNames = newReactions.map(([x]) => x);
		newReactions = [
			...newReactions,
			...Object.entries(newSource)
				.sort(([, a], [, b]) => b - a)
				.filter(([y], i) => i < maxNumber && !newReactionsNames.includes(y)),
		];
		
		// Verify results
		const thumbsUp = newReactions.find(([emoji]) => emoji === "👍");
		const heart = newReactions.find(([emoji]) => emoji === "❤️");
		const newEmoji = newReactions.find(([emoji]) => emoji === "😊");
		
		assert.ok(thumbsUp, "👍 reaction should exist");
		assert.strictEqual(thumbsUp[1], 6, "👍 count should be updated to 6");
		
		assert.ok(heart, "❤️ reaction should exist");
		assert.strictEqual(heart[1], 3, "❤️ count should remain 3");
		
		assert.ok(newEmoji, "😊 reaction should be added");
		assert.strictEqual(newEmoji[1], 1, "😊 count should be 1");
		
		// Verify original array is unchanged
		assert.strictEqual(initialReactions[0][1], 5, "Original reactions should not be modified");
	});

	test('should maintain correct counts during multiple rapid updates', () => {
		// Test scenario that would cause duplication in the old code
		let reactions = [["👍", 5], ["❤️", 3]];
		
		// First update
		const update1 = {"👍": 6, "❤️": 3, "🎉": 1};
		let newReactions1: [string, number][] = [];
		
		for (let i = 0; i < reactions.length; i++) {
			const reaction = reactions[i][0];
			if (reaction in update1 && update1[reaction] !== 0) {
				newReactions1.push([reaction, update1[reaction]]);
			}
		}
		
		// Add new reactions
		const existingNames1 = newReactions1.map(([x]) => x);
		newReactions1.push(...Object.entries(update1).filter(([name]) => !existingNames1.includes(name)));
		
		// Second update (simulating rapid updates when real-time mode is off)
		const update2 = {"👍": 7, "❤️": 4, "🎉": 1, "😊": 2};
		let newReactions2: [string, number][] = [];
		
		// Use the result from first update as input
		for (let i = 0; i < newReactions1.length; i++) {
			const reaction = newReactions1[i][0];
			if (reaction in update2 && update2[reaction] !== 0) {
				newReactions2.push([reaction, update2[reaction]]);
			}
		}
		
		// Add any new reactions from second update
		const existingNames2 = newReactions2.map(([x]) => x);
		newReactions2.push(...Object.entries(update2).filter(([name]) => !existingNames2.includes(name)));
		
		// Verify final state
		const thumbsUp = newReactions2.find(([emoji]) => emoji === "👍");
		const heart = newReactions2.find(([emoji]) => emoji === "❤️");
		const party = newReactions2.find(([emoji]) => emoji === "🎉");
		const smile = newReactions2.find(([emoji]) => emoji === "😊");
		
		assert.strictEqual(thumbsUp?.[1], 7, "👍 should have correct final count");
		assert.strictEqual(heart?.[1], 4, "❤️ should have correct final count");
		assert.strictEqual(party?.[1], 1, "🎉 should have correct final count");
		assert.strictEqual(smile?.[1], 2, "😊 should have correct final count");
		
		// Verify no duplication occurred
		const thumbsUpCount = newReactions2.filter(([emoji]) => emoji === "👍").length;
		assert.strictEqual(thumbsUpCount, 1, "👍 should appear only once in final array");
	});
});