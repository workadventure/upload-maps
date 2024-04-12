# Map Upload Package for WorkAdventure

This package is designed to help you upload maps from Tild to the map storage of WorkAdventure.

## Installation

To install this package, use the following command:

> npm install @alexarts74/package-upload-wa-map

## Usage

To use this package, import it into your project and run the command in your terminal :

> node node_modules/@alexarts74/package-upload-wa-map/src/upload.js

Ii will ask you some questions :

1. Your API Key.

2. The url of your map storage, if you're self hosted it will be : http://map-storage.workadventure.localhost/upload or you can have more informations on these following links :
   https://github.com/workadventure/workadventure/blob/develop/map-storage/README.md
   https://docs.workadventu.re/map-building/tiled-editor/

3. You can also add a directory name if you want. If you leave this blank, the default name will be map-user.

> > After the upload succeeded, you're folder will be place inside the map-storage folder in public (map-storage/public)

If you have any questions or need further assistance, don't hesitate to ask!
