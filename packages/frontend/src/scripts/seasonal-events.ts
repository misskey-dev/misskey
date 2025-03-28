enum EventTypes {
	Christmas = 0,
	NewYear = 1,
	ValentinesDay = 2,
	Halloween = 3,
	AprilFoolsDay = 4,
	Unknown = 5
}

export const isEventDay = (): EventTypes => {
	const date = new Date();
	const month = date.getMonth();
	const day = date.getDate();

	// jsで月を0から始まる
	// 例えば4月は月の値が3になる
	if (month === 11 && day === 25) return EventTypes.Christmas;
	if (month === 0 && day === 1) return EventTypes.NewYear;
	if (month === 1 && day === 14) return EventTypes.ValentinesDay;
	if (month === 9 && day === 31) return EventTypes.Halloween;
	if (month === 3 && day === 1) return EventTypes.AprilFoolsDay;
	return EventTypes.Unknown;
};

export const isAprilFoolsDay = (): boolean => {
	return isEventDay() === EventTypes.AprilFoolsDay;
};

export const isChristmas = (): boolean => {
	return isEventDay() === EventTypes.Christmas;
};

export const isNewYear = (): boolean => {
	return isEventDay() === EventTypes.NewYear;
};

export const isValentinesDay = (): boolean => {
	return isEventDay() === EventTypes.ValentinesDay;
};

export const isHalloween = (): boolean => {
	return isEventDay() === EventTypes.Halloween;
};

export const isUnknown = (): boolean => {
	return isEventDay() === EventTypes.Unknown;
};
