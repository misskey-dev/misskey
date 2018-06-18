export default (id: string, totalItems: any, orderedItems: any) => ({
	id,
	type: 'OrderedCollection',
	totalItems,
	orderedItems
});
