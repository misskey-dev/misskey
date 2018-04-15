Traduction de Misskey - Version Française
============

Comment ajouter une nouvelle langue ?
----------------------
Veuillez copier un fichier de langue dans /locales puis renommez-le du nom de la langue que vous voulez ajouter et modifier.  

Si vous trouvez un segment non-traduit sur Misskey :
-------------------------------

1. Veuillez chercher des parties non-traduites dans le code source de Misskey.
	- Par exemple, supposons que vous trouviez un segment non-traduit dans : `src/client/app/mobile/views/pages/home.vue`.

2. Remplacez la portion non-traduite par une chaîne de caractères de type `%i18n:@hoge%`.
	- En fait, `hoge` doit être un mot approprié à la situation et facile à comprendre en français.
	- Par exemple, si le segment non-traduit est「タイムライン」on peut écrire : `%i18n:@timeline%`.

3. Ouvrez chaque fichier linguistique dans /locales, vérifiez si le <strong>nom du fichier (chemin)</strong> trouvé dans l'étape 1 existe, sinon créez-le.
	- Ne mettez pas le début du chemin `src/client/app/` dans les fichiers /locales. 
	- Par exemple, dans ce cas de figure, nous voulons modifier le segment non-traduit de : `src/client/app/mobile/views/pages/home.vue`donc il faut juste écrire : `mobile/views/pages/home.vue` dans les fichiers linguistiques. 

4. Ajoutez la propriété du texte traduit grâce à la clef `hoge`, en-dessous du chemin correspondant à votre modification que vous avez trouvé ou créé dans l'étape 2. À côté, veuillez indiquer entre "guillemets" la valeur de votre traduction.
	- Par exemple, dans ce cas de figure, nous ajoutons la propriété et la traduction `timeline: "Timeline"` à `locales/fr.yml`, mais aussi la propriété et la version originale `timeline: "タイムライン"` à `locales/ja.yml`.

5. Vous avez réussi à traduire une portion de misskey ！

Pour plus de détails, veuillez vous référer à ce  [commit](https://github.com/syuilo/misskey/commit/10f6d5980fa7692ccb45fbc5f843458b69b7607c).
