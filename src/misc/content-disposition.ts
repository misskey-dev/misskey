const cd = require('content-disposition');

export function contentDisposition(type: 'inline' | 'attachment', filename: string): string {
	const fallback = filename.replace(/[^\w.-]/g, '_');
	return cd(filename, { type, fallback });
}
