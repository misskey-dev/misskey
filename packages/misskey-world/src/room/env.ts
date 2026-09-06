/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export type JapaneseEnvOptions = {
	window: 'none' | 'kosidakamado' | 'demado' | 'hakidasimado';
};

export type SimpleEnvOptions = {
	dimension: [number, number];
	window: 'none' | 'kosidakamado' | 'demado' | 'hakidasimado';
	walls: Record<'zPositive' | 'zNegative' | 'xPositive' | 'xNegative', {
		material: null | 'wood' | 'concrete';
		color: [number, number, number];
		withBeam: boolean;
		beamMaterial: null | 'wood' | 'concrete';
		beamColor: [number, number, number];
		withBaseboard: boolean;
	}>;
	pillars: Record<'zp_xp' | 'zp_xn' | 'zn_xp' | 'zn_xn', {
		material: null | 'wood' | 'concrete';
		color: [number, number, number];
		show: boolean;
	}>;
	flooring: {
		material: null | 'wood' | 'concrete';
		color: [number, number, number];
	};
	ceiling: {
		material: null | 'wood' | 'concrete';
		color: [number, number, number];
	};
};

export type MuseumEnvOptions = any;

export type CustomMadoriEnvWall = {
	type?: null | 'window';
	material?: string;
	withBeam?: boolean;
	beamMaterial?: string;
	withBaseboard?: boolean;
};

export type CustomMadoriEnvOptions = {
	dimension: [number, number];
	wallMaterials: {
		id: string;
		texture: null | 'wood' | 'concrete';
		color: [number, number, number];
	}[];
	flooringMaterials: {
		id: string;
		texture: null | 'wood' | 'concrete';
		color: [number, number, number];
	}[];
	ceilingMaterials: {
		id: string;
		texture: null | 'wood' | 'concrete';
		color: [number, number, number];
	}[];
	units: ({
		type: 'floor';
		walls?: Record<'zPositive' | 'zNegative' | 'xPositive' | 'xNegative', CustomMadoriEnvWall | undefined>;
		pillars?: Record<'zp_xp' | 'zp_xn' | 'zn_xp' | 'zn_xn', {
			material?: string;
			show?: boolean;
		}>;
		flooring?: {
			material?: string;
		};
		ceiling?: {
			material?: string;
		};
	} | null)[];
};

export function getDefaultSimpleEnvOptions(): SimpleEnvOptions {
	return {
		dimension: [300, 300],
		window: 'demado',
		walls: {
			zPositive: {
				material: null,
				color: [0.9, 0.9, 0.9],
				withBeam: false,
				beamMaterial: null,
				beamColor: [0.8, 0.8, 0.8],
				withBaseboard: true,
			},
			zNegative: {
				material: null,
				color: [0.9, 0.9, 0.9],
				withBeam: false,
				beamMaterial: null,
				beamColor: [0.8, 0.8, 0.8],
				withBaseboard: true,
			},
			xPositive: {
				material: null,
				color: [0.9, 0.9, 0.9],
				withBeam: false,
				beamMaterial: null,
				beamColor: [0.8, 0.8, 0.8],
				withBaseboard: true,
			},
			xNegative: {
				material: null,
				color: [0.9, 0.9, 0.9],
				withBeam: false,
				beamMaterial: null,
				beamColor: [0.8, 0.8, 0.8],
				withBaseboard: true,
			},
		},
		pillars: {
			zp_xp: {
				material: null,
				color: [0.9, 0.9, 0.9],
				show: false,
			},
			zp_xn: {
				material: null,
				color: [0.9, 0.9, 0.9],
				show: false,
			},
			zn_xp: {
				material: null,
				color: [0.9, 0.9, 0.9],
				show: false,
			},
			zn_xn: {
				material: null,
				color: [0.9, 0.9, 0.9],
				show: false,
			},
		},
		flooring: {
			material: 'wood',
			color: [0.9, 0.9, 0.9],
		},
		ceiling: {
			material: null,
			color: [0.9, 0.9, 0.9],
		},
	};
}

export function getDefaultJapaneseEnvOptions(): JapaneseEnvOptions {
	return {
		window: 'hakidasimado',
	};
}

export function getDefaultMuseumEnvOptions(): MuseumEnvOptions {
	return {};
}

export function getDefaultCustomMadoriEnvOptions(): CustomMadoriEnvOptions {
	const units = Array.from({ length: 15 * 15 }, () => ({
		type: 'floor',
		walls: {
			zPositive: {
				material: '0',
			},
			zNegative: {
				material: '0',
			},
			xPositive: {
				material: '0',
			},
			xNegative: {
				material: '0',
			},
		},
		flooring: {
			material: '0',
		},
		ceiling: {
			material: '0',
		},
	}));

	return {
		dimension: [15, 15],
		wallMaterials: [{
			id: '0',
			texture: null,
			color: [0.8, 0.8, 0.8],
		}],
		flooringMaterials: [{
			id: '0',
			texture: 'wood',
			color: [0.8, 0.8, 0.8],
		}],
		ceilingMaterials: [{
			id: '0',
			texture: null,
			color: [0.8, 0.8, 0.8],
		}],
		units: units,
	};
}
