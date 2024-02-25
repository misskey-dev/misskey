import crypto from "node:crypto";

/**
 * AIで生成した無作為なファーストネーム
 */
export const firstNameDict = [
	'Ethan', 'Olivia', 'Jackson', 'Emma', 'Liam', 'Ava', 'Aiden', 'Sophia', 'Mason', 'Isabella',
	'Noah', 'Mia', 'Lucas', 'Harper', 'Caleb', 'Abigail', 'Samuel', 'Emily', 'Logan',
	'Madison', 'Benjamin', 'Chloe', 'Elijah', 'Grace', 'Alexander', 'Scarlett', 'William', 'Zoey', 'James', 'Lily',
]

/**
 * AIで生成した無作為なラストネーム
 */
export const lastNameDict = [
	'Anderson', 'Johnson', 'Thompson', 'Davis', 'Rodriguez', 'Smith', 'Patel', 'Williams', 'Lee', 'Brown',
	'Garcia', 'Jackson', 'Martinez', 'Taylor', 'Harris', 'Nguyen', 'Miller', 'Jones', 'Wilson',
	'White', 'Thomas', 'Garcia', 'Martinez', 'Robinson', 'Turner', 'Lewis', 'Hall', 'King', 'Baker', 'Cooper',
]

/**
 * AIで生成した無作為な国名
 */
export const countryDict = [
	'Japan', 'Canada', 'Brazil', 'Australia', 'Italy', 'SouthAfrica', 'Mexico', 'Sweden', 'Russia', 'India',
	'Germany', 'Argentina', 'South Korea', 'France', 'Nigeria', 'Turkey', 'Spain', 'Egypt', 'Thailand',
	'Vietnam', 'Kenya', 'Saudi Arabia', 'Netherlands', 'Colombia', 'Poland', 'Chile', 'Malaysia', 'Ukraine', 'New Zealand', 'Peru',
]

export function text(length: number = 10): string {
	let result = "";

	while (result.length < length) {
		result += Math.random().toString(36).substring(2);
	}

	return result.substring(0, length);
}

export function integer(min: number = 0, max: number = 9999): number {
	return Math.floor(Math.random() * (max - min)) + min;
}

export function date(params?: {
	yearMin?: number,
	yearMax?: number,
	monthMin?: number,
	monthMax?: number,
	dayMin?: number,
	dayMax?: number,
	hourMin?: number,
	hourMax?: number,
	minuteMin?: number,
	minuteMax?: number,
	secondMin?: number,
	secondMax?: number,
	millisecondMin?: number,
	millisecondMax?: number,
}) {
	const year = integer(params?.yearMin ?? 1970, params?.yearMax ?? (new Date()).getFullYear());
	const month = integer(params?.monthMin ?? 1, params?.monthMax ?? 12);
	let day = integer(params?.dayMin ?? 1, params?.dayMax ?? 31);
	if (month === 2) {
		day = Math.min(day, 28);
	} else if ([4, 6, 9, 11].includes(month)) {
		day = Math.min(day, 30);
	} else {
		day = Math.min(day, 31);
	}

	const hour = integer(params?.hourMin ?? 0, params?.hourMax ?? 23);
	const minute = integer(params?.minuteMin ?? 0, params?.minuteMax ?? 59);
	const second = integer(params?.secondMin ?? 0, params?.secondMax ?? 59);
	const millisecond = integer(params?.millisecondMin ?? 0, params?.millisecondMax ?? 999);

	return new Date(year, month - 1, day, hour, minute, second, millisecond);
}

export function boolean(): boolean {
	return Math.random() < 0.5;
}

export function choose<T>(array: T[]): T {
	return array[Math.floor(Math.random() * array.length)];
}

export function firstName(): string {
	return choose(firstNameDict);
}

export function lastName(): string {
	return choose(lastNameDict);
}

export function country(): string {
	return choose(countryDict);
}

const TIME2000 = 946684800000;
export function fakeId(): string {
	let time = new Date().getTime();

	time = time - TIME2000;
	if (time < 0) time = 0;

	const timeStr = time.toString(36).padStart(8, '0');
	const noiseStr = text(2);

	return timeStr + noiseStr;
}

export function imageDataUrl(options?: {
	size?: {
		width?: number,
		height?: number,
	},
	color?: {
		red?: number,
		green?: number,
		blue?: number,
		alpha?: number,
	}
}): string {
	const canvas = document.createElement('canvas');
	canvas.width = options?.size?.width ?? 100;
	canvas.height = options?.size?.height ?? 100;

	const ctx = canvas.getContext('2d');
	if (!ctx) {
		throw new Error('Failed to get 2d context');
	}

	ctx.beginPath()

	const red = options?.color?.red ?? integer(0, 255);
	const green = options?.color?.green ?? integer(0, 255);
	const blue = options?.color?.blue ?? integer(0, 255);
	const alpha = options?.color?.alpha ?? 1;
	ctx.arc(canvas.width / 2, canvas.height / 2, canvas.width / 2, 0, Math.PI * 2, true);
	ctx.fillStyle = `rgba(${red}, ${green}, ${blue}, ${alpha})`;
	ctx.fill();

	return canvas.toDataURL('image/png', 1.0);
}
