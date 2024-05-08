/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Mono } from './game.js';

const NORMAL_BASE_SIZE = 32;
export const NORAML_MONOS: Mono[] = [{
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
export const YEN_MONOS: Mono[] = [{
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
export const SQUARE_MONOS: Mono[] = [{
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
export const SWEETS_MONOS: Mono[] = [{
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
