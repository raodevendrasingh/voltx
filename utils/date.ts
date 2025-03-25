const padZero = (num: number): string => num.toString().padStart(2, "0");

const getDateComponents = (date: Date) => {
	return {
		hours: padZero(date.getHours()),
		minutes: padZero(date.getMinutes()),
		seconds: padZero(date.getSeconds()),
		day: padZero(date.getDate()),
		month: {
			short: date.toLocaleString("en-US", { month: "short" }),
			num: padZero(date.getMonth() + 1),
		},
		year: {
			full: date.getFullYear().toString(),
			short: date.getFullYear().toString().slice(-2),
		},
	};
};

export const formatDate = (date: Date): string => {
	const d = getDateComponents(date);
	return `${d.hours}:${d.minutes} ${d.day}-${d.month.short}-${d.year.short}`;
};

export const formatFileDate = (date: Date): string => {
	const d = getDateComponents(date);
	return `${d.month.num}${d.day}${d.year.full}_${d.hours}${d.minutes}${d.seconds}`;
};
