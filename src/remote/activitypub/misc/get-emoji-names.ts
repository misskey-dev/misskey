import parse from '../../../mfm/parse';

export default function(text: string) {
	if (!text) return [];
	return parse(text).filter(t => t.type === 'emoji').map(t => (t as any).emoji);
}
