Misskey's Translation - English version
============

How to add a new language?
----------------------
Copy a language file to `/locales` and rename it after the language you wish to add.

If you find an untranslated part on Misskey:
-------------------------------

1. Look for untranslated parts in the miskey's source code.
	- For instance, if you find an untranslated part in: `src/client/app/mobile/views/pages/home.vue`.

2. Replace the untranslated portion with a character string of the form `%i18n:@foo%`.
	- In fact, `foo` should be a word that is appropriate for the situation and is easy to understand in English.
	- For example, if the untranslated portion is the following "タイムライン" you must write: `%i18n:@timeline%`.

3. Open each language file in /locales, check whether the <strong>file name (path)</strong> found in step 1 exists, if not, create it.
	- Do not put the beginning of the path `src/client/app/` in the locale file.
	- For example, in this case we want to modify untranslated parts of `src/client/app/mobile/views/pages/home.vue`, so the key is `mobile/views/pages/home.vue`.

4. Add the translated text property using the `foo` keyword below the path that you found or created in step 2. Make sure to type your text in quotation marks. Text should always be inside of quotes.
	-   For example, in this case we add timeline: `timeline: "Timeline"` to `locales/en.yml`, and `timeline: "タイムライン"` to `locales/ja.yml`.

5. And done！

For more details, please refer to this [commit](https://github.com/syuilo/misskey/commit/10f6d5980fa7692ccb45fbc5f843458b69b7607c).
