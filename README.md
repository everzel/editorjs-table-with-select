# Table tool

The Table Block for the [Editor.js](https://editorjs.io) with the possibility select rows.

## Installation

Get the package

```shell
yarn add https://github.com/everzel/table.git
```

# Select

Click the right mouse button to start the selection.

### Press ``Shift+Delete`` to clear the selected items.

### Press ``Delete`` to delete the selected items (If you didn't select all rows vertical or horizontal they will be clear).

## Usage

Add a new Tool to the `tools` property of the Editor.js initial config.

```javascript
import Table from '@everzel/table/dist/table';

var editor = EditorJS({
  tools: {
    table: Table,
  }
});
```

Or init the Table tool with additional settings

```javascript
var editor = EditorJS({
  tools: {
    table: {
      class: Table,
      inlineToolbar: true,
      config: {
        rows: 2,
        cols: 3,
      },
    },
  },
});
```

## Config Params

| Field              | Type     | Description          |
| ------------------ | -------- | ---------------------------------------- |
| `rows`             | `number` | initial number of rows. `2`  by default |
| `cols`             | `number` | initial number of columns. `2` by default |
| `withHeadings`             | `boolean` | toggle table headings. `false` by default |

## Output data

This Tool returns `data` in the following format

| Field          | Type         | Description           |
| -------------- | ------------ | ----------------------------------------- |
| `withHeadings` | `boolean`    | Uses the first line as headings |
| `content`      | `string[][]` | two-dimensional array with table contents |

```json
{
  "type" : "table",
  "data" : {
    "withHeadings": true,
    "content" : [ [ "Kine", "Pigs", "Chicken" ], [ "1 pcs", "3 pcs", "12 pcs" ], [ "100$", "200$", "150$" ] ]
  }
}
```