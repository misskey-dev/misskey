/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { EventEmitter } from 'eventemitter3';
import * as Matter from 'matter-js';
import seedrandom from 'seedrandom';

export type Mono = {
	id: string;
	level: number;
	sizeX: number;
	sizeY: number;
	shape: 'circle' | 'rectangle' | 'custom';
	vertices?: Matter.Vector[][];
	verticesSize?: number;
	score: number;
	dropCandidate: boolean;
};

type Log = {
	frame: number;
	operation: 'drop';
	x: number;
} | {
	frame: number;
	operation: 'hold';
} | {
	frame: number;
	operation: 'surrender';
};

const NORMAL_BASE_SIZE = 32;
const NORAML_MONOS: Mono[] = [{
	id: '9377076d-c980-4d83-bdaf-175bc58275b7',
	level: 10,
	sizeX: NORMAL_BASE_SIZE * 1.25 * 1.25 * 1.25 * 1.25 * 1.25 * 1.25 * 1.25 * 1.25 * 1.25,
	sizeY: NORMAL_BASE_SIZE * 1.25 * 1.25 * 1.25 * 1.25 * 1.25 * 1.25 * 1.25 * 1.25 * 1.25,
	shape: 'circle',
	score: 512,
	dropCandidate: false,
}, {
	id: 'be9f38d2-b267-4b1a-b420-904e22e80568',
	level: 9,
	sizeX: NORMAL_BASE_SIZE * 1.25 * 1.25 * 1.25 * 1.25 * 1.25 * 1.25 * 1.25 * 1.25,
	sizeY: NORMAL_BASE_SIZE * 1.25 * 1.25 * 1.25 * 1.25 * 1.25 * 1.25 * 1.25 * 1.25,
	shape: 'circle',
	score: 256,
	dropCandidate: false,
}, {
	id: 'beb30459-b064-4888-926b-f572e4e72e0c',
	level: 8,
	sizeX: NORMAL_BASE_SIZE * 1.25 * 1.25 * 1.25 * 1.25 * 1.25 * 1.25 * 1.25,
	sizeY: NORMAL_BASE_SIZE * 1.25 * 1.25 * 1.25 * 1.25 * 1.25 * 1.25 * 1.25,
	shape: 'circle',
	score: 128,
	dropCandidate: false,
}, {
	id: 'feab6426-d9d8-49ae-849c-048cdbb6cdf0',
	level: 7,
	sizeX: NORMAL_BASE_SIZE * 1.25 * 1.25 * 1.25 * 1.25 * 1.25 * 1.25,
	sizeY: NORMAL_BASE_SIZE * 1.25 * 1.25 * 1.25 * 1.25 * 1.25 * 1.25,
	shape: 'circle',
	score: 64,
	dropCandidate: false,
}, {
	id: 'd6d8fed6-6d18-4726-81a1-6cf2c974df8a',
	level: 6,
	sizeX: NORMAL_BASE_SIZE * 1.25 * 1.25 * 1.25 * 1.25 * 1.25,
	sizeY: NORMAL_BASE_SIZE * 1.25 * 1.25 * 1.25 * 1.25 * 1.25,
	shape: 'circle',
	score: 32,
	dropCandidate: false,
}, {
	id: '249c728e-230f-4332-bbbf-281c271c75b2',
	level: 5,
	sizeX: NORMAL_BASE_SIZE * 1.25 * 1.25 * 1.25 * 1.25,
	sizeY: NORMAL_BASE_SIZE * 1.25 * 1.25 * 1.25 * 1.25,
	shape: 'circle',
	score: 16,
	dropCandidate: true,
}, {
	id: '23d67613-d484-4a93-b71e-3e81b19d6186',
	level: 4,
	sizeX: NORMAL_BASE_SIZE * 1.25 * 1.25 * 1.25,
	sizeY: NORMAL_BASE_SIZE * 1.25 * 1.25 * 1.25,
	shape: 'circle',
	score: 8,
	dropCandidate: true,
}, {
	id: '3cbd0add-ad7d-4685-bad0-29f6dddc0b99',
	level: 3,
	sizeX: NORMAL_BASE_SIZE * 1.25 * 1.25,
	sizeY: NORMAL_BASE_SIZE * 1.25 * 1.25,
	shape: 'circle',
	score: 4,
	dropCandidate: true,
}, {
	id: '8f86d4f4-ee02-41bf-ad38-1ce0ae457fb5',
	level: 2,
	sizeX: NORMAL_BASE_SIZE * 1.25,
	sizeY: NORMAL_BASE_SIZE * 1.25,
	shape: 'circle',
	score: 2,
	dropCandidate: true,
}, {
	id: '64ec4add-ce39-42b4-96cb-33908f3f118d',
	level: 1,
	sizeX: NORMAL_BASE_SIZE,
	sizeY: NORMAL_BASE_SIZE,
	shape: 'circle',
	score: 1,
	dropCandidate: true,
}];

const YEN_BASE_SIZE = 32;
const YEN_SATSU_BASE_SIZE = 70;
const YEN_MONOS: Mono[] = [{
	id: '880f9bd9-802f-4135-a7e1-fd0e0331f726',
	level: 10,
	sizeX: (YEN_SATSU_BASE_SIZE * 2) * 1.25 * 1.25 * 1.25,
	sizeY: YEN_SATSU_BASE_SIZE * 1.25 * 1.25 * 1.25,
	shape: 'rectangle',
	score: 10000,
	dropCandidate: false,
}, {
	id: 'e807beb6-374a-4314-9cc2-aa5f17d96b6b',
	level: 9,
	sizeX: (YEN_SATSU_BASE_SIZE * 2) * 1.25 * 1.25,
	sizeY: YEN_SATSU_BASE_SIZE * 1.25 * 1.25,
	shape: 'rectangle',
	score: 5000,
	dropCandidate: false,
}, {
	id: '033445b7-8f90-4fc9-beca-71a9e87cb530',
	level: 8,
	sizeX: (YEN_SATSU_BASE_SIZE * 2) * 1.25,
	sizeY: YEN_SATSU_BASE_SIZE * 1.25,
	shape: 'rectangle',
	score: 2000,
	dropCandidate: false,
}, {
	id: '410a09ec-5f7f-46f6-b26f-cbca4ccbd091',
	level: 7,
	sizeX: YEN_SATSU_BASE_SIZE * 2,
	sizeY: YEN_SATSU_BASE_SIZE,
	shape: 'rectangle',
	score: 1000,
	dropCandidate: false,
}, {
	id: '2aae82bc-3fa4-49ad-a6b5-94d888e809f5',
	level: 6,
	sizeX: YEN_BASE_SIZE * 1.25 * 1.25 * 1.25 * 1.25 * 1.25,
	sizeY: YEN_BASE_SIZE * 1.25 * 1.25 * 1.25 * 1.25 * 1.25,
	shape: 'circle',
	score: 500,
	dropCandidate: false,
}, {
	id: 'a619bd67-d08f-4cc0-8c7e-c8072a4950cd',
	level: 5,
	sizeX: YEN_BASE_SIZE * 1.25 * 1.25 * 1.25 * 1.25,
	sizeY: YEN_BASE_SIZE * 1.25 * 1.25 * 1.25 * 1.25,
	shape: 'circle',
	score: 100,
	dropCandidate: true,
}, {
	id: 'c1c5d8e4-17d6-4455-befd-12154d731faa',
	level: 4,
	sizeX: YEN_BASE_SIZE * 1.25 * 1.25 * 1.25,
	sizeY: YEN_BASE_SIZE * 1.25 * 1.25 * 1.25,
	shape: 'circle',
	score: 50,
	dropCandidate: true,
}, {
	id: '7082648c-e428-44c4-887a-25c07a8ebdd5',
	level: 3,
	sizeX: YEN_BASE_SIZE * 1.25 * 1.25,
	sizeY: YEN_BASE_SIZE * 1.25 * 1.25,
	shape: 'circle',
	score: 10,
	dropCandidate: true,
}, {
	id: '0d8d40d5-e6e0-4d26-8a95-b8d842363379',
	level: 2,
	sizeX: YEN_BASE_SIZE * 1.25,
	sizeY: YEN_BASE_SIZE * 1.25,
	shape: 'circle',
	score: 5,
	dropCandidate: true,
}, {
	id: '9dec1b38-d99d-40de-8288-37367b983d0d',
	level: 1,
	sizeX: YEN_BASE_SIZE,
	sizeY: YEN_BASE_SIZE,
	shape: 'circle',
	score: 1,
	dropCandidate: true,
}];

const SQUARE_BASE_SIZE = 28;
const SQUARE_MONOS: Mono[] = [{
	id: 'f75fd0ba-d3d4-40a4-9712-b470e45b0525',
	level: 10,
	sizeX: SQUARE_BASE_SIZE * 1.25 * 1.25 * 1.25 * 1.25 * 1.25 * 1.25 * 1.25 * 1.25 * 1.25,
	sizeY: SQUARE_BASE_SIZE * 1.25 * 1.25 * 1.25 * 1.25 * 1.25 * 1.25 * 1.25 * 1.25 * 1.25,
	shape: 'rectangle',
	score: 512,
	dropCandidate: false,
}, {
	id: '7b70f4af-1c01-45fd-af72-61b1f01e03d1',
	level: 9,
	sizeX: SQUARE_BASE_SIZE * 1.25 * 1.25 * 1.25 * 1.25 * 1.25 * 1.25 * 1.25 * 1.25,
	sizeY: SQUARE_BASE_SIZE * 1.25 * 1.25 * 1.25 * 1.25 * 1.25 * 1.25 * 1.25 * 1.25,
	shape: 'rectangle',
	score: 256,
	dropCandidate: false,
}, {
	id: '41607ef3-b6d6-4829-95b6-3737bf8bb956',
	level: 8,
	sizeX: SQUARE_BASE_SIZE * 1.25 * 1.25 * 1.25 * 1.25 * 1.25 * 1.25 * 1.25,
	sizeY: SQUARE_BASE_SIZE * 1.25 * 1.25 * 1.25 * 1.25 * 1.25 * 1.25 * 1.25,
	shape: 'rectangle',
	score: 128,
	dropCandidate: false,
}, {
	id: '8a8310d2-0374-460f-bb50-ca9cd3ee3416',
	level: 7,
	sizeX: SQUARE_BASE_SIZE * 1.25 * 1.25 * 1.25 * 1.25 * 1.25 * 1.25,
	sizeY: SQUARE_BASE_SIZE * 1.25 * 1.25 * 1.25 * 1.25 * 1.25 * 1.25,
	shape: 'rectangle',
	score: 64,
	dropCandidate: false,
}, {
	id: '1092e069-fe1a-450b-be97-b5d477ec398c',
	level: 6,
	sizeX: SQUARE_BASE_SIZE * 1.25 * 1.25 * 1.25 * 1.25 * 1.25,
	sizeY: SQUARE_BASE_SIZE * 1.25 * 1.25 * 1.25 * 1.25 * 1.25,
	shape: 'rectangle',
	score: 32,
	dropCandidate: false,
}, {
	id: '2294734d-7bb8-4781-bb7b-ef3820abf3d0',
	level: 5,
	sizeX: SQUARE_BASE_SIZE * 1.25 * 1.25 * 1.25 * 1.25,
	sizeY: SQUARE_BASE_SIZE * 1.25 * 1.25 * 1.25 * 1.25,
	shape: 'rectangle',
	score: 16,
	dropCandidate: true,
}, {
	id: 'ea8a61af-e350-45f7-ba6a-366fcd65692a',
	level: 4,
	sizeX: SQUARE_BASE_SIZE * 1.25 * 1.25 * 1.25,
	sizeY: SQUARE_BASE_SIZE * 1.25 * 1.25 * 1.25,
	shape: 'rectangle',
	score: 8,
	dropCandidate: true,
}, {
	id: 'd0c74815-fc1c-4fbe-9953-c92e4b20f919',
	level: 3,
	sizeX: SQUARE_BASE_SIZE * 1.25 * 1.25,
	sizeY: SQUARE_BASE_SIZE * 1.25 * 1.25,
	shape: 'rectangle',
	score: 4,
	dropCandidate: true,
}, {
	id: 'd8fbd70e-611d-402d-87da-1a7fd8cd2c8d',
	level: 2,
	sizeX: SQUARE_BASE_SIZE * 1.25,
	sizeY: SQUARE_BASE_SIZE * 1.25,
	shape: 'rectangle',
	score: 2,
	dropCandidate: true,
}, {
	id: '35e476ee-44bd-4711-ad42-87be245d3efd',
	level: 1,
	sizeX: SQUARE_BASE_SIZE,
	sizeY: SQUARE_BASE_SIZE,
	shape: 'rectangle',
	score: 1,
	dropCandidate: true,
}];

const SWEETS_BASE_SIZE = 40;
const SWEETS_MONOS: Mono[] = [{
	id: '77f724c0-88be-4aeb-8e1a-a00ed18e3844',
	level: 10,
	sizeX: SWEETS_BASE_SIZE * 1.25 * 1.25 * 1.25 * 1.25 * 1.25 * 1.25 * 1.25 * 1.25 * 1.25,
	sizeY: SWEETS_BASE_SIZE * 1.25 * 1.25 * 1.25 * 1.25 * 1.25 * 1.25 * 1.25 * 1.25 * 1.25,
	shape: 'custom',
	vertices: [
		[
			{
				'x': 14,
				'y': 2,
			},
			{
				'x': 2,
				'y': 13,
			},
			{
				'x': 2,
				'y': 31,
			},
			{
				'x': 30,
				'y': 23,
			},
			{
				'x': 30,
				'y': 7,
			},
			{
				'x': 29,
				'y': 6,
			},
			{
				'x': 20,
				'y': 4,
			},
			{
				'x': 17,
				'y': 3,
			},
			{
				'x': 16,
				'y': 2,
			},
		],
	],
	verticesSize: 32,
	score: 400,
	dropCandidate: false,
}, {
	id: 'f3468ef4-2e1e-4906-8795-f147f39f7e1f',
	level: 9,
	sizeX: SWEETS_BASE_SIZE * 1.25 * 1.25 * 1.25 * 1.25 * 1.25 * 1.25 * 1.25 * 1.25,
	sizeY: SWEETS_BASE_SIZE * 1.25 * 1.25 * 1.25 * 1.25 * 1.25 * 1.25 * 1.25 * 1.25,
	shape: 'custom',
	vertices: [
		[
			{
				'x': 15,
				'y': 2,
			},
			{
				'x': 14,
				'y': 3,
			},
			{
				'x': 8,
				'y': 4,
			},
			{
				'x': 6,
				'y': 5,
			},
			{
				'x': 4,
				'y': 8,
			},
			{
				'x': 4,
				'y': 15,
			},
			{
				'x': 2,
				'y': 19,
			},
			{
				'x': 2,
				'y': 22.36,
			},
			{
				'x': 3,
				'y': 25,
			},
			{
				'x': 5,
				'y': 28,
			},
			{
				'x': 10,
				'y': 30,
			},
			{
				'x': 22,
				'y': 30,
			},
			{
				'x': 27,
				'y': 28,
			},
			{
				'x': 29,
				'y': 25,
			},
			{
				'x': 30,
				'y': 22,
			},
			{
				'x': 30,
				'y': 19,
			},
			{
				'x': 28,
				'y': 15,
			},
			{
				'x': 28,
				'y': 8,
			},
			{
				'x': 26,
				'y': 5,
			},
			{
				'x': 24,
				'y': 4,
			},
			{
				'x': 18,
				'y': 3,
			},
			{
				'x': 17,
				'y': 2,
			},
		],
	],
	verticesSize: 32,
	score: 380,
	dropCandidate: false,
}, {
	id: 'bcb41129-6f2d-44ee-89d3-86eb2df564ba',
	level: 8,
	sizeX: SWEETS_BASE_SIZE * 1.25 * 1.25 * 1.25 * 1.25 * 1.25 * 1.25 * 1.25,
	sizeY: SWEETS_BASE_SIZE * 1.25 * 1.25 * 1.25 * 1.25 * 1.25 * 1.25 * 1.25,
	shape: 'custom',
	vertices: [
		[
			{
				'x': 15,
				'y': 2,
			},
			{
				'x': 11,
				'y': 3,
			},
			{
				'x': 8,
				'y': 6,
			},
			{
				'x': 7,
				'y': 8,
			},
			{
				'x': 6,
				'y': 11,
			},
			{
				'x': 6,
				'y': 13,
			},
			{
				'x': 7,
				'y': 16,
			},
			{
				'x': 8,
				'y': 18,
			},
			{
				'x': 15,
				'y': 30,
			},
			{
				'x': 17,
				'y': 30,
			},
			{
				'x': 24,
				'y': 18,
			},
			{
				'x': 25,
				'y': 16,
			},
			{
				'x': 26,
				'y': 13,
			},
			{
				'x': 26,
				'y': 11,
			},
			{
				'x': 25,
				'y': 8,
			},
			{
				'x': 24,
				'y': 6,
			},
			{
				'x': 21,
				'y': 3,
			},
			{
				'x': 17,
				'y': 2,
			},
		],
	],
	verticesSize: 32,
	score: 300,
	dropCandidate: false,
}, {
	id: 'f058e1ad-1981-409b-b3a7-302de0a43744',
	level: 7,
	sizeX: SWEETS_BASE_SIZE * 1.25 * 1.25 * 1.25 * 1.25 * 1.25 * 1.25,
	sizeY: SWEETS_BASE_SIZE * 1.25 * 1.25 * 1.25 * 1.25 * 1.25 * 1.25,
	shape: 'custom',
	vertices: [
		[
			{
				'x': 17,
				'y': 2.541,
			},
			{
				'x': 14,
				'y': 5.402,
			},
			{
				'x': 10,
				'y': 7,
			},
			{
				'x': 10,
				'y': 10.367,
			},
			{
				'x': 8,
				'y': 11,
			},
			{
				'x': 8,
				'y': 14,
			},
			{
				'x': 5.781,
				'y': 16.265,
			},
			{
				'x': 6.594,
				'y': 19.627,
			},
			{
				'x': 9.414,
				'y': 21,
			},
			{
				'x': 12,
				'y': 29.988,
			},
			{
				'x': 21,
				'y': 29.988,
			},
			{
				'x': 22.016,
				'y': 22.629,
			},
			{
				'x': 23,
				'y': 21.772,
			},
			{
				'x': 23,
				'y': 19.202,
			},
			{
				'x': 25.783,
				'y': 17.473,
			},
			{
				'x': 25.783,
				'y': 14.727,
			},
			{
				'x': 24,
				'y': 13.173,
			},
			{
				'x': 24,
				'y': 10.367,
			},
			{
				'x': 22,
				'y': 9.233,
			},
			{
				'x': 22,
				'y': 6.454,
			},
			{
				'x': 18,
				'y': 5,
			},
		],
	],
	verticesSize: 32,
	score: 300,
	dropCandidate: false,
}, {
	id: 'd22cfe38-5a3b-4b9c-a1a6-907930a3d732',
	level: 6,
	sizeX: SWEETS_BASE_SIZE * 1.25 * 1.25 * 1.25 * 1.25 * 1.25,
	sizeY: SWEETS_BASE_SIZE * 1.25 * 1.25 * 1.25 * 1.25 * 1.25,
	shape: 'custom',
	vertices: [
		[
			{
				'x': 15,
				'y': 2,
			},
			{
				'x': 11,
				'y': 3,
			},
			{
				'x': 8,
				'y': 5,
			},
			{
				'x': 7,
				'y': 6,
			},
			{
				'x': 5,
				'y': 9,
			},
			{
				'x': 4,
				'y': 12,
			},
			{
				'x': 4,
				'y': 20,
			},
			{
				'x': 5,
				'y': 23,
			},
			{
				'x': 7,
				'y': 26,
			},
			{
				'x': 11,
				'y': 29,
			},
			{
				'x': 14,
				'y': 30,
			},
			{
				'x': 18,
				'y': 30,
			},
			{
				'x': 21,
				'y': 29,
			},
			{
				'x': 25,
				'y': 26,
			},
			{
				'x': 27,
				'y': 23,
			},
			{
				'x': 28,
				'y': 20,
			},
			{
				'x': 28,
				'y': 12,
			},
			{
				'x': 27,
				'y': 9,
			},
			{
				'x': 25,
				'y': 6,
			},
			{
				'x': 24,
				'y': 5,
			},
			{
				'x': 21,
				'y': 3,
			},
			{
				'x': 17,
				'y': 2,
			},
		],
	],
	verticesSize: 32,
	score: 250,
	dropCandidate: false,
}, {
	id: '79867083-a073-427e-ae82-07a70d9f3b4f',
	level: 5,
	sizeX: SWEETS_BASE_SIZE * 1.25 * 1.25 * 1.25 * 1.25,
	sizeY: SWEETS_BASE_SIZE * 1.25 * 1.25 * 1.25 * 1.25,
	shape: 'custom',
	vertices: [
		[
			{
				'x': 9,
				'y': 15,
			},
			{
				'x': 23,
				'y': 15,
			},
			{
				'x': 30,
				'y': 27,
			},
			{
				'x': 25.7,
				'y': 30,
			},
			{
				'x': 6.34,
				'y': 30,
			},
			{
				'x': 2,
				'y': 27,
			},
		],
	],
	verticesSize: 32,
	score: 200,
	dropCandidate: true,
}, {
	id: '2e152a12-a567-4100-b4d4-d15d81ba47b1',
	level: 4,
	sizeX: SWEETS_BASE_SIZE * 1.25 * 1.25 * 1.25,
	sizeY: SWEETS_BASE_SIZE * 1.25 * 1.25 * 1.25,
	shape: 'custom',
	vertices: [
		[
			{
				'x': 12,
				'y': 2,
			},
			{
				'x': 2,
				'y': 12,
			},
			{
				'x': 2,
				'y': 14,
			},
			{
				'x': 18,
				'y': 30,
			},
			{
				'x': 20,
				'y': 30,
			},
			{
				'x': 30,
				'y': 20,
			},
			{
				'x': 30,
				'y': 18,
			},
			{
				'x': 14,
				'y': 2,
			},
		],
	],
	verticesSize: 32,
	score: 200,
	dropCandidate: true,
}, {
	id: '12250376-2258-4716-8eec-b3a7239461fc',
	level: 3,
	sizeX: SWEETS_BASE_SIZE * 1.25 * 1.25,
	sizeY: SWEETS_BASE_SIZE * 1.25 * 1.25,
	shape: 'custom',
	vertices: [
		[
			{
				'x': 12,
				'y': 2,
			},
			{
				'x': 7,
				'y': 3,
			},
			{
				'x': 3,
				'y': 7,
			},
			{
				'x': 2,
				'y': 12,
			},
			{
				'x': 3,
				'y': 16,
			},
			{
				'x': 5,
				'y': 19,
			},
			{
				'x': 8,
				'y': 21,
			},
			{
				'x': 12,
				'y': 22,
			},
			{
				'x': 18,
				'y': 21,
			},
			{
				'x': 27,
				'y': 30,
			},
			{
				'x': 30,
				'y': 30,
			},
			{
				'x': 30,
				'y': 27,
			},
			{
				'x': 21,
				'y': 18,
			},
			{
				'x': 22,
				'y': 14.25,
			},
			{
				'x': 22,
				'y': 11,
			},
			{
				'x': 21,
				'y': 8,
			},
			{
				'x': 19,
				'y': 5,
			},
			{
				'x': 16.5,
				'y': 3,
			},
		],
	],
	verticesSize: 32,
	score: 120,
	dropCandidate: true,
}, {
	id: '4d4f2668-4be7-44a3-aa3a-856df6e25aa6',
	level: 2,
	sizeX: SWEETS_BASE_SIZE * 1.25,
	sizeY: SWEETS_BASE_SIZE * 1.25,
	shape: 'custom',
	vertices: [
		[
			{
				'x': 12,
				'y': 1.9,
			},
			{
				'x': 4,
				'y': 4,
			},
			{
				'x': 2,
				'y': 12,
			},
			{
				'x': 6,
				'y': 13.375,
			},
			{
				'x': 6,
				'y': 18,
			},
			{
				'x': 8,
				'y': 22,
			},
			{
				'x': 12,
				'y': 25.372,
			},
			{
				'x': 16,
				'y': 26,
			},
			{
				'x': 19,
				'y': 25.372,
			},
			{
				'x': 20,
				'y': 30,
			},
			{
				'x': 28,
				'y': 27,
			},
			{
				'x': 30,
				'y': 20,
			},
			{
				'x': 25.473,
				'y': 19,
			},
			{
				'x': 26,
				'y': 15,
			},
			{
				'x': 24,
				'y': 10,
			},
			{
				'x': 20,
				'y': 7,
			},
			{
				'x': 16,
				'y': 6,
			},
			{
				'x': 13,
				'y': 6,
			},
		],
	],
	verticesSize: 32,
	score: 20,
	dropCandidate: true,
}, {
	id: 'c9984b40-4045-44c3-b260-d47b7b4625b2',
	level: 1,
	sizeX: SWEETS_BASE_SIZE,
	sizeY: SWEETS_BASE_SIZE,
	shape: 'circle',
	score: 30,
	dropCandidate: true,
}];

export class DropAndFusionGame extends EventEmitter<{
	changeScore: (newScore: number) => void;
	changeCombo: (newCombo: number) => void;
	changeStock: (newStock: { id: string; mono: Mono }[]) => void;
	changeHolding: (newHolding: { id: string; mono: Mono } | null) => void;
	dropped: (x: number) => void;
	fusioned: (x: number, y: number, nextMono: Mono | null, scoreDelta: number) => void;
	collision: (energy: number, bodyA: Matter.Body, bodyB: Matter.Body) => void;
	monoAdded: (mono: Mono) => void;
	gameOver: () => void;
}> {
	private PHYSICS_QUALITY_FACTOR = 16; // 低いほどパフォーマンスが高いがガタガタして安定しなくなる、逆に高すぎても何故か不安定になる
	private COMBO_INTERVAL = 60; // frame
	public readonly GAME_VERSION = 2;
	public readonly GAME_WIDTH = 450;
	public readonly GAME_HEIGHT = 600;
	public readonly DROP_COOLTIME = 30; // frame
	public readonly PLAYAREA_MARGIN = 25;
	private STOCK_MAX = 4;
	private TICK_DELTA = 1000 / 60; // 60fps

	public frame = 0;
	public engine: Matter.Engine;
	private tickCallbackQueue: { frame: number; callback: () => void; }[] = [];
	private overflowCollider: Matter.Body;
	private isGameOver = false;
	private gameMode: 'normal' | 'yen' | 'square' | 'sweets' | 'space';
	private rng: () => number;
	private logs: Log[] = [];

	/**
	 * フィールドに出ていて、かつ合体の対象となるアイテム
	 */
	private fusionReadyBodyIds: Matter.Body['id'][] = [];

	private gameOverReadyBodyIds: Matter.Body['id'][] = [];

	/**
	 * fusion予約アイテムのペア
	 * TODO: これらのモノは光らせるなどの演出をすると視覚的に楽しそう
	 */
	private fusionReservedPairs: { bodyA: Matter.Body; bodyB: Matter.Body }[] = [];

	private latestDroppedAt = 0; // frame
	private latestFusionedAt = 0; // frame
	private stock: { id: string; mono: Mono }[] = [];
	private holding: { id: string; mono: Mono } | null = null;

	public get monoDefinitions() {
		switch (this.gameMode) {
			case 'normal': return NORAML_MONOS;
			case 'yen': return YEN_MONOS;
			case 'square': return SQUARE_MONOS;
			case 'sweets': return SWEETS_MONOS;
			case 'space': return NORAML_MONOS;
		}
	}

	private _combo = 0;
	private get combo() {
		return this._combo;
	}
	private set combo(value: number) {
		this._combo = value;
		this.emit('changeCombo', value);
	}

	private _score = 0;
	private get score() {
		return this._score;
	}
	private set score(value: number) {
		this._score = value;
		this.emit('changeScore', value);
	}

	private getMonoRenderOptions: null | ((mono: Mono) => Partial<Matter.IBodyRenderOptions>) = null;

	public replayPlaybackRate = 1;

	constructor(env: {
		seed: string;
		gameMode: DropAndFusionGame['gameMode'];
		getMonoRenderOptions?: (mono: Mono) => Partial<Matter.IBodyRenderOptions>;
	}) {
		super();

		//#region BIND
		this.tick = this.tick.bind(this);
		//#endregion

		this.gameMode = env.gameMode;
		this.getMonoRenderOptions = env.getMonoRenderOptions ?? null;
		this.rng = seedrandom(env.seed);

		// sweetsモードは重いため
		const physicsQualityFactor = this.gameMode === 'sweets' ? 4 : this.PHYSICS_QUALITY_FACTOR;
		this.engine = Matter.Engine.create({
			constraintIterations: 2 * physicsQualityFactor,
			positionIterations: 6 * physicsQualityFactor,
			velocityIterations: 4 * physicsQualityFactor,
			gravity: {
				x: 0,
				y: this.gameMode === 'space' ? 0.0125 : 1,
			},
			timing: {
				timeScale: 2,
			},
			enableSleeping: false,
		});

		this.engine.world.bodies = [];

		//#region walls
		const WALL_OPTIONS: Matter.IChamferableBodyDefinition = {
			label: '_wall_',
			isStatic: true,
			friction: 0.7,
			slop: this.gameMode === 'space' ? 0.01 : 0.7,
			render: {
				strokeStyle: 'transparent',
				fillStyle: 'transparent',
			},
		};

		const thickness = 100;
		Matter.Composite.add(this.engine.world, [
			Matter.Bodies.rectangle(this.GAME_WIDTH / 2, this.GAME_HEIGHT + (thickness / 2) - this.PLAYAREA_MARGIN, this.GAME_WIDTH, thickness, WALL_OPTIONS),
			Matter.Bodies.rectangle(this.GAME_WIDTH + (thickness / 2) - this.PLAYAREA_MARGIN, this.GAME_HEIGHT / 2, thickness, this.GAME_HEIGHT, WALL_OPTIONS),
			Matter.Bodies.rectangle(-((thickness / 2) - this.PLAYAREA_MARGIN), this.GAME_HEIGHT / 2, thickness, this.GAME_HEIGHT, WALL_OPTIONS),
		]);
		//#endregion

		this.overflowCollider = Matter.Bodies.rectangle(this.GAME_WIDTH / 2, 0, this.GAME_WIDTH, 200, {
			label: '_overflow_',
			isStatic: true,
			isSensor: true,
			render: {
				strokeStyle: 'transparent',
				fillStyle: 'transparent',
			},
		});
		Matter.Composite.add(this.engine.world, this.overflowCollider);
	}

	public msToFrame(ms: number) {
		return Math.round(ms / this.TICK_DELTA);
	}

	public frameToMs(frame: number) {
		return frame * this.TICK_DELTA;
	}

	private createBody(mono: Mono, x: number, y: number) {
		const options: Matter.IBodyDefinition = {
			label: mono.id,
			density: this.gameMode === 'space' ? 0.01 : ((mono.sizeX * mono.sizeY) / 10000),
			restitution: this.gameMode === 'space' ? 0.5 : 0.2,
			frictionAir: this.gameMode === 'space' ? 0 : 0.01,
			friction: this.gameMode === 'space' ? 0.5 : 0.7,
			frictionStatic: this.gameMode === 'space' ? 0 : 5,
			slop: this.gameMode === 'space' ? 0.01 : 0.7,
			//mass: 0,
			render: this.getMonoRenderOptions ? this.getMonoRenderOptions(mono) : undefined,
		};
		if (mono.shape === 'circle') {
			return Matter.Bodies.circle(x, y, mono.sizeX / 2, options);
		// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
		} else if (mono.shape === 'rectangle') {
			return Matter.Bodies.rectangle(x, y, mono.sizeX, mono.sizeY, options);
		} else if (mono.shape === 'custom') {
			return Matter.Bodies.fromVertices(x, y, mono.vertices!.map(i => i.map(j => ({
				x: (j.x / mono.verticesSize!) * mono.sizeX,
				y: (j.y / mono.verticesSize!) * mono.sizeY,
			}))), options);
		} else {
			throw new Error('unrecognized shape');
		}
	}

	private fusion(bodyA: Matter.Body, bodyB: Matter.Body) {
		if (this.latestFusionedAt > this.frame - this.COMBO_INTERVAL) {
			this.combo++;
		} else {
			this.combo = 1;
		}
		this.latestFusionedAt = this.frame;

		const newX = (bodyA.position.x + bodyB.position.x) / 2;
		const newY = (bodyA.position.y + bodyB.position.y) / 2;

		this.fusionReadyBodyIds = this.fusionReadyBodyIds.filter(x => x !== bodyA.id && x !== bodyB.id);
		this.gameOverReadyBodyIds = this.gameOverReadyBodyIds.filter(x => x !== bodyA.id && x !== bodyB.id);
		Matter.Composite.remove(this.engine.world, [bodyA, bodyB]);

		const currentMono = this.monoDefinitions.find(y => y.id === bodyA.label)!;
		const nextMono = this.monoDefinitions.find(x => x.level === currentMono.level + 1) ?? null;

		if (nextMono) {
			const body = this.createBody(nextMono, newX, newY);
			Matter.Composite.add(this.engine.world, body);

			// 連鎖してfusionした場合の分かりやすさのため少し間を置いてからfusion対象になるようにする
			this.tickCallbackQueue.push({
				frame: this.frame + this.msToFrame(100),
				callback: () => {
					this.fusionReadyBodyIds.push(body.id);
				},
			});

			this.emit('monoAdded', nextMono);
		}

		const hasComboBonus = this.gameMode !== 'yen' && this.gameMode !== 'sweets';
		const comboBonus = hasComboBonus ? 1 + ((this.combo - 1) / 5) : 1;
		const additionalScore = Math.round(currentMono.score * comboBonus);
		this.score += additionalScore;

		this.emit('fusioned', newX, newY, nextMono, additionalScore);
	}

	private onCollision(event: Matter.IEventCollision<Matter.Engine>) {
		for (const pairs of event.pairs) {
			const { bodyA, bodyB } = pairs;

			const shouldFusion = (bodyA.label === bodyB.label) &&
				!this.fusionReservedPairs.some(x =>
					x.bodyA.id === bodyA.id ||
					x.bodyA.id === bodyB.id ||
					x.bodyB.id === bodyA.id ||
					x.bodyB.id === bodyB.id);

			if (shouldFusion) {
				if (this.fusionReadyBodyIds.includes(bodyA.id) && this.fusionReadyBodyIds.includes(bodyB.id)) {
					this.fusion(bodyA, bodyB);
				} else {
					this.fusionReservedPairs.push({ bodyA, bodyB });
					this.tickCallbackQueue.push({
						frame: this.frame + this.msToFrame(100),
						callback: () => {
							this.fusionReservedPairs = this.fusionReservedPairs.filter(x => x.bodyA.id !== bodyA.id && x.bodyB.id !== bodyB.id);
							this.fusion(bodyA, bodyB);
						},
					});
				}
			} else {
				const energy = pairs.collision.depth;

				if (bodyA.label === '_overflow_' || bodyB.label === '_overflow_') continue;

				if (bodyA.label !== '_wall_' && bodyB.label !== '_wall_') {
					if (!this.gameOverReadyBodyIds.includes(bodyA.id)) this.gameOverReadyBodyIds.push(bodyA.id);
					if (!this.gameOverReadyBodyIds.includes(bodyB.id)) this.gameOverReadyBodyIds.push(bodyB.id);
				}

				this.emit('collision', energy, bodyA, bodyB);
			}
		}
	}

	private onCollisionActive(event: Matter.IEventCollision<Matter.Engine>) {
		for (const pairs of event.pairs) {
			const { bodyA, bodyB } = pairs;

			// ハコからあふれたかどうかの判定
			if (bodyA.id === this.overflowCollider.id || bodyB.id === this.overflowCollider.id) {
				if (this.gameOverReadyBodyIds.includes(bodyA.id) || this.gameOverReadyBodyIds.includes(bodyB.id)) {
					this.gameOver();
					break;
				}
				continue;
			}
		}
	}

	public surrender() {
		this.logs.push({
			frame: this.frame,
			operation: 'surrender',
		});

		this.gameOver();
	}

	private gameOver() {
		this.isGameOver = true;
		this.emit('gameOver');
	}

	public start() {
		for (let i = 0; i < this.STOCK_MAX; i++) {
			this.stock.push({
				id: this.rng().toString(),
				mono: this.monoDefinitions.filter(x => x.dropCandidate)[Math.floor(this.rng() * this.monoDefinitions.filter(x => x.dropCandidate).length)],
			});
		}
		this.emit('changeStock', this.stock);

		Matter.Events.on(this.engine, 'collisionStart', this.onCollision.bind(this));
		Matter.Events.on(this.engine, 'collisionActive', this.onCollisionActive.bind(this));
	}

	public getLogs() {
		return this.logs;
	}

	public tick() {
		this.frame++;

		if (this.latestFusionedAt < this.frame - this.COMBO_INTERVAL) {
			this.combo = 0;
		}

		this.tickCallbackQueue = this.tickCallbackQueue.filter(x => {
			if (x.frame === this.frame) {
				x.callback();
				return false;
			} else {
				return true;
			}
		});

		Matter.Engine.update(this.engine, this.TICK_DELTA);

		const hasNextTick = !this.isGameOver;

		return hasNextTick;
	}

	public getActiveMonos() {
		return this.engine.world.bodies.map(x => this.monoDefinitions.find((mono) => mono.id === x.label)!).filter(x => x !== undefined);
	}

	public drop(_x: number) {
		if (this.isGameOver) return;
		if (this.frame - this.latestDroppedAt < this.DROP_COOLTIME) return;

		const head = this.stock.shift()!;
		this.stock.push({
			id: this.rng().toString(),
			mono: this.monoDefinitions.filter(x => x.dropCandidate)[Math.floor(this.rng() * this.monoDefinitions.filter(x => x.dropCandidate).length)],
		});
		this.emit('changeStock', this.stock);

		const inputX = Math.round(_x);
		const x = Math.min(this.GAME_WIDTH - this.PLAYAREA_MARGIN - (head.mono.sizeX / 2), Math.max(this.PLAYAREA_MARGIN + (head.mono.sizeX / 2), inputX));
		const body = this.createBody(head.mono, x, 50 + head.mono.sizeY / 2);
		this.logs.push({
			frame: this.frame,
			operation: 'drop',
			x: inputX,
		});

		// add force
		if (this.gameMode === 'space') {
			Matter.Body.applyForce(body, body.position, {
				x: 0,
				y: (Math.PI * head.mono.sizeX * head.mono.sizeY) / 65536,
			});
		}

		Matter.Composite.add(this.engine.world, body);

		this.fusionReadyBodyIds.push(body.id);
		this.latestDroppedAt = this.frame;

		this.emit('dropped', x);
		this.emit('monoAdded', head.mono);
	}

	public hold() {
		if (this.isGameOver) return;

		this.logs.push({
			frame: this.frame,
			operation: 'hold',
		});

		if (this.holding) {
			const head = this.stock.shift()!;
			this.stock.unshift(this.holding);
			this.holding = head;
			this.emit('changeHolding', this.holding);
			this.emit('changeStock', this.stock);
		} else {
			const head = this.stock.shift()!;
			this.holding = head;
			this.stock.push({
				id: this.rng().toString(),
				mono: this.monoDefinitions.filter(x => x.dropCandidate)[Math.floor(this.rng() * this.monoDefinitions.filter(x => x.dropCandidate).length)],
			});
			this.emit('changeHolding', this.holding);
			this.emit('changeStock', this.stock);
		}
	}

	public static serializeLogs(logs: Log[]) {
		const _logs: number[][] = [];

		for (let i = 0; i < logs.length; i++) {
			const log = logs[i];
			const frameDelta = i === 0 ? log.frame : log.frame - logs[i - 1].frame;

			switch (log.operation) {
				case 'drop':
					_logs.push([frameDelta, 0, log.x]);
					break;
				case 'hold':
					_logs.push([frameDelta, 1]);
					break;
				case 'surrender':
					_logs.push([frameDelta, 2]);
					break;
			}
		}

		return _logs;
	}

	public static deserializeLogs(logs: number[][]) {
		const _logs: Log[] = [];

		let frame = 0;

		for (const log of logs) {
			const frameDelta = log[0];
			frame += frameDelta;

			const operation = log[1];

			switch (operation) {
				case 0:
					_logs.push({
						frame,
						operation: 'drop',
						x: log[2],
					});
					break;
				case 1:
					_logs.push({
						frame,
						operation: 'hold',
					});
					break;
				case 2:
					_logs.push({
						frame,
						operation: 'surrender',
					});
					break;
			}
		}

		return _logs;
	}

	public dispose() {
		Matter.World.clear(this.engine.world, false);
		Matter.Engine.clear(this.engine);
	}
}
