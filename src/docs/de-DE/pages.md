# Seiten

## Variablen
Durch die Verwendung von Variablen ist es möglich, dynamische Seiten zu erstellen.Wird in einem Text <b>{ Variablenname }</b> beinhaltet, wird dies mit dem Wert dieser Variable eingesetzt.Ist Beispielsweise der Wert der Variable thing in diesem Fall <b>ai</b>, dann wird der Text <b>Hallo { thing } Welt!</b> zu <b>Hallo ai Welt!</b> ausgewertet.

Variablen werden von oben nach unten ausgewertet, d.h. Referenzen zu Variablen, die noch nicht definiert sind, sind nicht möglich.Werden Beispielsweise die Variablen <b>A, B, C</b> in der gegebenen Reihenfolge definiert, so kann sich innerhalb von <b>C</b> auf <b>A</b> oder <b>B</b> bezogen werden, aber innerhalb von <b>A</b> nicht auf <b>B</b> oder <b>C</b>.

ユーザーからの入力を受け取るには、ページに「ユーザー入力」ブロックを設置し、「変数名」に入力を格納したい変数名を設定します(変数は自動で作成されます)。その変数を使ってユーザー入力に応じた動作を行えます。

関数を使うと、値の算出処理を再利用可能な形にまとめることができます。関数を作るには、「関数」タイプの変数を作成します。関数にはスロット(引数)を設定することができ、スロットの値は関数内で変数として利用可能です。また、関数を引数に取る関数(高階関数と呼ばれます)も存在します。関数は予め定義しておくほかに、このような高階関数のスロットに即席でセットすることもできます。
