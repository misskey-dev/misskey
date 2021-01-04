# Seiten

## Variablen
Durch die Verwendung von Variablen ist es möglich, dynamische Seiten zu erstellen.Wird in einem Text <b>{ Variablenname }</b> beinhaltet, wird dies mit dem Wert dieser Variable eingesetzt.Ist Beispielsweise der Wert der Variable thing in diesem Fall <b>ai</b>, dann wird der Text <b>Hallo { thing } Welt!</b> zu <b>Hallo ai Welt!</b> ausgewertet.

Variablen werden von oben nach unten ausgewertet, d.h. Referenzen zu Variablen, die noch nicht definiert sind, sind nicht möglich.Werden Beispielsweise die Variablen <b>A, B, C</b> in der gegebenen Reihenfolge definiert, so kann sich innerhalb von <b>C</b> auf <b>A</b> oder <b>B</b> bezogen werden, aber innerhalb von <b>A</b> nicht auf <b>B</b> oder <b>C</b>.

Um (Text-)Eingabe durch Benutzer empfangen zu können, kann der Seite ein "Benutzereingabe"-Feld hinzugefügt werden, welches dann den Wert, den der Benutzer eingibt, in einer Variable mit gewünschtem Namen speichert.Durch die Verwendung dieser Benutzereingabe können dann die weiteren Aktionen der Seite gesteuert werden.

Die Verwendung von Funktionen erlaubt die Definition von wiederverwendbaren Werteberechnungen.Um eine Funktion zu erstellen, wähle "Funktion" als Variablentyp.Funktionen können ebenso Slots (Parameter) verwenden, auf dessen Werte dann innerhalb der Funktion zugegriffen werden kann.Zudem ist es möglich, eine Funktion zu erstellen, dessen Parameter eine weitere Funktion ist ("Funktion höherer Ordnung").Neben der vorherigen Definition von Funktionen können in Funktionen höherer Ordnung Funktionen ebenso direkt in der Parametereingabe definiert werden.
