import parse from '../../../mfm/parse';

export default function(text: string) {
	if (!text) return [];
	return parse(text).filter(t => t.type === 'emoji' && t.name).map(t => (t as any).name);
}
