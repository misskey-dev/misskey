/**
 * Render OrderedCollectionPage
 * @param id URL of self
 * @param totalItems Number of total items
 * @param orderedItems Items
 * @param partOf URL of base
 * @param prev URL of prev page (optional)
 * @param next URL of next page (optional)
 */
export default function(id: string, totalItems: any, orderedItems: any, partOf: string, prev?: string, next?: string) {
	const page = {
		id,
		partOf,
		type: 'OrderedCollectionPage',
		totalItems,
		orderedItems
	} as any;

	if (prev) page.prev = prev;
	if (next) page.next = next;

	return page;
}
