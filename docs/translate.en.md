Misskey's Translation
=====================

If you find an untranslated part on Misskey:
--------------------------------------------

1. Look for untranslated parts in the misskey's source code.
	- For instance, if you find an untranslated part in: `src/client/app/mobile/views/pages/home.vue`.

2. Replace the untranslated portion with a character string of the form `%i18n:@foo%`.
	- In fact, `foo` should be a word that is appropriate for the situation and is easy to understand in English.
	- For example, if the untranslated portion is the following "タイムライン" you must write: `%i18n:@timeline%`.

3. Open the `locales/ja-JP.yml`, check whether the <strong>file name (path)</strong> found in step 1 exists, if not, create it.
	- Do not put the beginning of the path `src/client/app/` in the locale file.
	- For example, in this case we want to modify untranslated parts of `src/client/app/mobile/views/pages/home.vue`, so the key is `mobile/views/pages/home.vue`.

4. Add the text property using the `foo` keyword below the path that you found or created in step 2. Make sure to type your text in quotation marks. Text should always be inside of quotes.
	-   For example, in this case we add timeline: `timeline: "タイムライン"` to `locales/ja-JP.yml`.

5. When you add text to the ja-JP file (of syuilo/misskey), it will automatically be applied to all other local language files within 24-48 hours. Translations added in ja-JP file should contain the original Japanese strings (example see step 4). 

6. The new strings will automatically appear in the localized language files in the original Japanese text. After that, please go to [CrowdIn](https://crowdin.com/project/misskey) to do the localized translations in your language.

7. And done！

For more details, please refer to this [commit](https://github.com/syuilo/misskey/commit/10f6d5980fa7692ccb45fbc5f843458b69b7607c).
