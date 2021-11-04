# La paĝo nur por skribi novan noton
`/share`を開くと、共有用の投稿フォームを開くことができます。 ここではシェアページで利用できるクエリ文字列の一覧を示します。

## La listo de la tekstoj por informpeti
### Teksto

<dl>
<dt>title</dt>
<dd>Tio estas titolo.本文の先頭に[ … ]と挿入されます。</dd>
<dt>text</dt>
<dd>Tio estas teksto</dd>
<dt>url</dt>
<dd>Tio estas URL.末尾に挿入されます。</dd>
</dl>

### La  informo por respondi
以下のいずれか

<dl>
<dt>replyId</dt>
<dd>リプライ先のノートid</dd>
<dt>replyUri</dt>
<dd>リプライ先のUrl（リモートのノートオブジェクトを指定）</dd>
</dl>

### La informo por plusendi noton
以下のいずれか

<dl>
<dt>renoteId</dt>
<dd>la ID de la noto plusendota</dd>
<dt>renoteUri</dt>
<dd>la URL de la noto plusendota el fora nodo</dd>
</dl>

### Videbleco
※specifiedに相当する値はvisibility=specifiedとvisibleAccts/visibleUserIdsで指定する

<dl>
<dt>visibility</dt>
<dd>公開範囲 ['public' | 'home' | 'followers' | 'specified']</dd>
<dt>localOnly</dt>
<dd>0(false) or 1(true)</dd>
<dt>visibleUserIds</dt>
<dd>specified時のダイレクト先のユーザーid カンマ区切りで</dd>
<dt>visibleAccts</dt>
<dd>specified時のダイレクト先のacct（＠?username[＠host]） カンマ区切りで</dd>
</dl>

### Dosieroj
<dl>
<dt>fileIds</dt>
<dd>La ID-oj de viaj aldonotaj dosieroj (devas esti apartigita de komoj)</dd>
</dl>
