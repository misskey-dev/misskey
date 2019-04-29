export function collectPageVars(content) {
	const pageVars = [];
	const collect = (xs: any[]) => {
		for (const x of xs) {
			if (x.type === 'input') {
				pageVars.push({
					name: x.name,
					type: x.inputType,
					value: x.default
				});
			} else if (x.type === 'switch') {
				pageVars.push({
					name: x.name,
					type: 'boolean',
					value: x.default
				});
			} else if (x.children) {
				collect(x.children);
			}
		}
	};
	collect(content);
	return pageVars;
}
