/**
 * Render OrderedCollection
 * @param id URL of self
 * @param totalItems Total number of items
 * @param first URL of first page (optional)
 * @param last URL of last page (optional)
 */
export default function(id: string, totalItems: any, first: string, last: string) {
	const page: any = {
		id,
		type: 'OrderedCollection',
		totalItems,
	};

	if (first) page.first = first;
	if (last) page.last = last;

	return page;
}
