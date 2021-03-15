# Pages

## Variables
Vous pouvez créer des pages dynamiques en utilisant des variables.Vous pouvez incorporer la valeur d'une variable en insérant le <b>{ variablename }</b> dans votre texte.Par exemple, si la valeur de la variable "thing" dans le texte <b>Hello { thing } world!</b> est <b>ai</b>, votre trexte devient alors : <b>Hello ai world!</b>.

Les variables sont prises en compte dans l'ordre chronologique, de haut en bas. Il n'est donc pas possible d'appeler une variable située plus bas dans le code. Par exemple, si vous définissez, dans l'ordre, 3 variables telles que <b>A, B, C</b>, vous pourrez appeler en <b>C</b> aussi bien <b>A</b> que <b>B</b> ; par contre, vous ne pourrez appeler en <b>A</b> ni <b>B</b> ni <b>C</b>.

Pour recevoir une entrée utilisateur, ajoutez un bloc "Entrée" sur la page et définissez le nom des variables que vous souhaitez stocker dans le champ "Nom de la variable" (les variables seront créées automatiquement).Vous pourrez alors exécuter les actions en fonction de l'entrée utilisateur de ces variables.

Appeler des fonctions vous permet de définir des valeurs que vous pourrez réutiliser. Pour créer des fonctions, il faut d'abord définir une variable du type "fonction".Ensuite, vous pouvez configurer des arguments dont la valeur sera utilisable comme une variable à l'intérieur de la fonction. Par ailleurs, il existe ce que l'on appelle des "fonctions d'ordre supérieur" dont les arguments sont aussi des fonctions. En plus de paramétrer des fonctions à l'avance, vous avez également la possibilité de définir des fonctions à l'improviste directement dans les arguments de ces "fonctions d'ordre supérieur".
