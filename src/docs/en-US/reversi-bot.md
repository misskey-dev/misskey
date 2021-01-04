# Development of Misskey Reversi Bots
This page will explain how to develop a bot for Misskey's Reversi function.

1. Connect to the `games/reversi` stream with the following parameters:
    * `i`: API key of the bot account

2. When an invitation to a game arrives, an `invited` event is emitted from the stream.
    * Information about the user who sent the invitation is included in the event as `parent`.

3. Send a request to `games/reversi/match` including the `id` of the `parent` as `user_id`

4. If the request suceeds, information about the game will be returned. Then, send a request to the `games/reversi-game` stream with the following parameters:
    * `i`: API key of the bot account
    * `game`: The `id` of the `game`

5. In the meanwhile, the opponent can modify the game's settings. Each time this happens, a `update-settings` event is emitted, so implementing logic to handle these events may be necessary.

6. Once satisfied with the settings, send a `{ type: 'accept' }` message to the stream.

7. When the game starts, a `started` event is emitted.
    * Information about the game's state is included in this event

8. To place a stone, send `{ type: 'set', pos: <Position> }` to the stream (how to calculate positions will be explained later).

9. When the opponent or you place a stone, the `set` event is emitted.
    * Contains the color of the placed stone as `color`
    * Contains the position the stone was placed at as `pos`

## Calculating positions
In the case of an 8x8 map, the fields of the board are arranged like this (fields are marked with their respective index):
```
+--+--+--+--+--+--+--+--+
| 0| 1| 2| 3| 4| 5| 6| 7|
+--+--+--+--+--+--+--+--+
| 8| 9|10|11|12|13|14|15|
+--+--+--+--+--+--+--+--+
|16|17|18|19|20|21|22|23|
...
```

### Find indices from X, Y coordinates
```
pos = x + (y * mapWidth)
```
`mapWidth` can be acquired from the `map` information as follows:
```
mapWidth = map[0].length
```

### Find X, Y coordinates from indices
```
x = pos % mapWidth
y = Math.floor(pos / mapWidth)
```

## Map information
Map data is included within `map` of the game data. As the data is represented as an array of strings, each character represents a field. Based on this data, you can reconstruct the map state:
* `(Empty)` ... No field
* `-` ... Field
* `b` ... Piece placed first was black
* `w` ... Piece placed first was white

For example, suppose a situation with the following 4*4 board:
```text
+---+---+---+---+
|   |   |   |   |
+---+---+---+---+
|   | ○ | ● |   |
+---+---+---+---+
|   | ● | ○ |   |
+---+---+---+---+
|   |   |   |   |
+---+---+---+---+
```

In this case, the map data look like this:
```javascript
['----', '-wb-', '-bw-', '----']
```

## Creating a bot that can interact with the user through forms
To communicate with the user, you can show them a form in the settings screen. For example, to let the user select the strength of the Bot.

To display a form, send the following message to the `reversi-game` stream:
```javascript
{
  type: 'init-form',
  body: [Array of form control fields]
}
```

From here on, the structure of form control elements will be explained. Form controls are objects arranged as follows:
```javascript
{
  id: 'switch1',
  type: 'switch',
  label: 'Enable hoge',
  value: false
}
```
`id` ... The ID of the control element. `type` ... The type of the control element.Explained later. `label` ... Text displayed alongside the control element. `value` ... Default value of the control element.

### Handling form interactions
When the user interacts with the form, an `update-form` event is emitted. Included in this event is the control element's ID as well as the value of the setting the user changed. For example, if the user flipped the switch from above to on, the following event would be emitted:
```javascript
{
  id: 'switch1',
  value: true
}
```

### Types of form control elements
#### Switch
type: `switch` Shows a slider.These can be helpful for functions that can be turned either on or off.

##### Properties
`label` ... The text written on the switch.

#### Radio button
type: `radio` Shows a radio button.These can be useful for choices.For example to choose the strength of the Bot.

##### Properties
`items` ... The options of the radio button.E.g.:
```javascript
items: [{
  label: 'Weak',
  value: 1
}, {
  label: 'Moderate',
  value: 2
}, {
  label: 'Strong',
  value: 3
}]
```

#### Slider
type: `slider` Shows a slider.

##### Properties
`min` ... The minimum value of the slider. `max` ... The maximum value of the slider. `step` ... The step between each value on the slider.

#### Textbox
type: `textbox` Shows a textbox.These can be used for all general purposes which require user input.

## Showing a message to a user
This is another way to interact with the user from the settings screen, separate from showing them a form.It's possible to display a message to the user. For example, when the user selects a map that the bot does not support, a warning can be displayed. To display a message, send the following message to the stream:
```javascript
{
  type: 'message',
  body: {
    text: 'Message contents',
    type: 'Message type'
  }
}
```
Message types: `success`, `info`, `warning`, `error`。

## Give up
To give up, send a request to <a href="./api/endpoints/games/reversi/games/surrender">this endpoint</a>.
