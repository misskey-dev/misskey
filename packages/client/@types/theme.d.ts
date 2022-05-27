import { Theme } from '../src/scripts/theme';

declare module '@/themes/*.json5' {
	export = Theme;
}
