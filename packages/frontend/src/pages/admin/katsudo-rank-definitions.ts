const katsudoRankTable = [
        ['かつ廃見習い', 0, 0],
        ['かつ廃三級', 3, 100],
        ['かつ廃二級', 7, 500],
        ['かつ廃一級', 14, 1500],
        ['かつ廃一段', 30, 3000],
] as const;

export const katsudoRankDefinitions = katsudoRankTable.map((
        [name, minDays, minNotes],
        index,
) => ({
        key: `rank-${index}`,

        name,

        minDays,

        minNotes,
}));
