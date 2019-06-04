import define from '../../define';
import { getThemes } from '../../../../pluginThemes';

export const meta = {
	desc: {
		'ja-JP': 'プラグインによって登録されたテーマを取得します。'
	},

	tags: ['themes']
};

export default define(meta, async (ps, me) => {
	return getThemes();
});
