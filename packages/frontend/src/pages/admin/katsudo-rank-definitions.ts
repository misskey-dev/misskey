export const katsudoRankDefinitions = [
	{
		key: 'beginner',
		name: 'かつ廃見習い',
		minDays: 0,
		minNotes: 0,
	},
	{
		key: 'grade3',
		name: 'かつ廃三級',
		minDays: 3,
		minNotes: 100,
	},
	{
		key: 'grade2',
		name: 'かつ廃二級',
		minDays: 7,
		minNotes: 500,
	},
	{
		key: 'grade1',
		name: 'かつ廃一級',
		minDays: 14,
		minNotes: 1500,
	},
	{
		key: 'dan1',
		name: 'かつ廃一段',
		minDays: 30,
		minNotes: 3000,
	},
] as const;
