/**
 * Render OrderedCollection
 * @param id URL of self
 * @param totalItems Total number of items
 * @param first URL of first page (optional)
 * @param last URL of last page (optional)
 * @param orderedItems attached objects (optional)
 */
export default function(id: string, totalItems: any, first?: string, last?: string, orderedItems?: object) {
	const page: any = {
		id,
		type: 'OrderedCollection',
		totalItems,
	};

	if (first) page.first = first;
	if (last) page.last = last;
	if (orderedItems) page.orderedItems = orderedItems;

	return page;
}
