# Map Upload Package for WorkAdventure

This package is designed to help you upload maps from Tiled to the map storage of WorkAdventure.

## Installation

To install this package, use the following command:

> npm install @workadventure/upload-maps

## Usage

To use this package, import it into your project and run the command in your terminal:

> node_modules/.bin/upload-wa-map

It will ask you some questions:

1. Your API Key.

2. The URL of your map storage. If you're self-hosted, it will be: http://map-storage.workadventure.localhost/upload or you can have more information on these following links:
   https://github.com/workadventure/workadventure/blob/develop/map-storage/README.md
   https://docs.workadventu.re/map-building/tiled-editor/

3. You can also add a directory name if you want. If you leave this blank, the default name will be map-user.

> > After the upload succeeds, your folder will be placed inside the map-storage folder in public (map-storage/public).

If you have any questions or need further assistance, don't hesitate to ask ! (a.artus@workadventu.re)
