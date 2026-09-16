/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { saveSharedFiles } from '@@/js/shared-files.js';

export async function respondToShare(request: Request): Promise<Response> {
	const responseUrl = new URL(request.url);
	const origin = request.headers.get('Origin');
	// Missing/opaque origins are not proof of a native share; storage remains bounded.
	if (origin && origin !== 'null' && origin !== responseUrl.origin) return new Response('Forbidden', { status: 403 });
	responseUrl.pathname = '/share';
	const formData = await request.formData();
	const entries = formData.getAll('files');
	const files = entries.every(file => file instanceof Blob)
		? entries.filter(file => !(file instanceof File && file.name === '' && file.size === 0))
		: [];

	// Text-only shares need no persistent record, regardless of their origin.
	const shareId = files.length > 0 ? await saveSharedFiles(files) : null;
	formData.delete('files');
	formData.delete('shareId');
	responseUrl.searchParams.delete('shareId');
	for (const [key, value] of formData.entries()) {
		responseUrl.searchParams.set(key, value.toString());
	}
	if (shareId) responseUrl.searchParams.set('shareId', shareId);

	return Response.redirect(responseUrl, 303);
}
