# Map Upload Package for WorkAdventure

This package is designed to help you upload maps from Tiled to the map storage of WorkAdventure.

## Installation

To install this package, use the following command:

> npm install @workadventure/upload-maps

## Usage

UPLOAD YOUR MAPS ON MAP-STORAGE

This document will guide you through the process of uploading your own map on the map storage. You can also go to the documentation of WorkAdventure just by clicking here : https://docs.workadventu.re/

To use this package, import it into your project and run the command in your terminal:

> node_modules/.bin/upload-wa-map

It will ask you some questions:

1. Your API Key.
   You can find it on https://admin.workadventu.re
   On the left panel you can go to Developers tab --> API keys / Zapier.
   There you can create a new token. (Don't forget to save it !)

2. The URL of your map storage.
   If you're self-hosted, it will be in the admin on : https://admin.workadventu.re
   On the left panel you can go to Developers tab --> API keys / Zapier.
   There you can fine "Map-storage API endpoint" it is the url for uploading map storage

3. Directoy
   You can also add a directory name if you want. If you leave this blank, the default name will be map-user.
   It will be the folder where all your uploaded files will be stored in.

You can also use it with flags to upload your map but keep in mind that the secret variables will not be saved in .env and .env.secret files. This are the differents flags :

    -k for the map storage API KEY
    -u for the map storage URL
    -d for the directory

Here is how you can use flags :

> npm run upload -- -k your-api-key -u your-mapstorage-url -d your-directory

After answering these question, the script will start to upload your file. You need to see something like this : Upload done successfully !

When you run the npm run upload command, the following things happen:

1. First, your map files are "built". During the build phase:
2. The tilesets of your map are optimized. Any tile that is not used is removed. This is done to reduce the total size of the map and results in faster loading times.
3. The scripts of your map are compiled and bundled. This happens if you developed some specific features on your map using the Scripting API. The compilation phase translates files from Typescript to Javascript. The bundling phase takes all the Javascript files and merges them into a single file.
4. The result of the built is written in the dist directory.
5. The content of the public directory is copied to the dist directory.
6. Then, a ZIP file of the dist directory is created and sent to the WorkAdventure "map-storage" server. This server is in charge of hosting the map files. When it receives the ZIP file, it unzips it and stores the files in the directory you configured when you first ran the npm run upload command. For each tmj file the server finds, it will check if there exists a matching wam file. If not, it will create one. wam files are used to store any part of the map edited in the inline map editor of WorkAdventure (like the list of objects or areas, the microphone settings, etc...)

If you have any questions or need further assistance, don't hesitate to ask ! (hello@workadventu.re) or you can check the documentation of WorkAdventure just here : https://docs.workadventu.re/
