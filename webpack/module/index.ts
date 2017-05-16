import rules from './rules';

export default (lang, locale) => ({
	rules: rules(lang, locale)
});
