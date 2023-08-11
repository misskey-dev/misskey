interface StringPageVar {
	name: string,
	type: 'string',
	value: string
}

interface NumberPageVar {
	name: string,
	type: 'number',
	value: number
}

interface BooleanPageVar {
	name: string,
	type: 'boolean',
	value: boolean
}

type PageVar = StringPageVar | NumberPageVar | BooleanPageVar;

export function collectPageVars(content): PageVar[] {
	const pageVars: PageVar[] = [];
	const collect = (xs: any[]): void => {
		for (const x of xs) {
			if (x.type === 'textInput') {
				pageVars.push({
					name: x.name,
					type: 'string',
					value: x.default || '',
				});
			} else if (x.type === 'textareaInput') {
				pageVars.push({
					name: x.name,
					type: 'string',
					value: x.default || '',
				});
			} else if (x.type === 'numberInput') {
				pageVars.push({
					name: x.name,
					type: 'number',
					value: x.default || 0,
				});
			} else if (x.type === 'switch') {
				pageVars.push({
					name: x.name,
					type: 'boolean',
					value: x.default || false,
				});
			} else if (x.type === 'counter') {
				pageVars.push({
					name: x.name,
					type: 'number',
					value: 0,
				});
			} else if (x.type === 'radioButton') {
				pageVars.push({
					name: x.name,
					type: 'string',
					value: x.default || '',
				});
			} else if (x.children) {
				collect(x.children);
			}
		}
	};
	collect(content);
	return pageVars;
}
