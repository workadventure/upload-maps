# Map Upload Package for WorkAdventure

This package is designed to help you upload maps done using Tiled to the map storage of WorkAdventure.

## Installation

To install this package, use the following command:

> npm install @workadventure/upload-maps

## Usage

UPLOAD YOUR MAPS ON MAP-STORAGE

This document will guide you through the process of uploading your own map on the map storage. You can also read the [documentation of WorkAdventure](https://docs.workadventu.re/).

To use this package, import it into your project and run the command in your terminal:

> node_modules/.bin/upload-wa-map

It will ask you some questions:

1. The URL of your map storage:
   For SaaS, you can find it on [the admin](https://admin.workadventu.re).
   On the left panel you can go to Developers tab -> API keys / Zapier.
   There you can find "Map-storage API endpoint".
2. Your API Key:
   For SaaS, you can find it on [the admin](https://admin.workadventu.re).
   On the left panel you can go to Developers tab -> API keys / Zapier.
   There you can create a new token.
3. Upload directoy:
   You can add a directory name.
   If you have github and you forked the repository, by default the name of the diretory will be your github name and your github repository name.
   You can also choose a custom name if you want to.
   If you don't have github, just put the name when the script will ask you. By default it will be 'maps'.
   It will be the folder where all your uploaded files will be stored in.

You can also use it with flags to upload your map but keep in mind that the secret variables will not be saved in .env and .env.secret files. This are the differents flags:

    -u for the URL of the Map storage
    -k for the API KEY
    -d for the Upload directory

Here is how you can use flags:

> npm run upload -- -u your-map-storage-url -k your-api-key  -d your-directory

After answering these questions, the script will start to upload your maps. You need to see something like this at the end: `Upload done successfully!`.

## How it works

When you run the `npm run upload` command, the following things happen:

1. First, your map files are "built". During the build phase:
  1.1. The tilesets of your map are optimized and chunked. Any tile that is not used is removed. This is done to reduce the total size of the map and results in faster loading time.
  1.2. The scripts of your map are compiled and bundled. This happens if you developed some specific features on your map using the Scripting API. The compilation phase translates files from Typescript to Javascript. The bundling phase takes all the Javascript files and merges them into a single file.
  1.3. The result of the build is written in the dist directory.
  1.4. The content of the public directory is copied to the dist directory.
2. Then, a ZIP file of the dist directory is created and sent to the WorkAdventure "map-storage" server. This server is in charge of hosting the map files. When it receives the ZIP file, it unzips it and stores the files in the directory you configured as 'Upload directory'. For each `.tmj` file the server finds, it will check if there exists a matching `.wam` file. If not, it will create one. WAM files are used to store any part of the map edited by the Map editor of WorkAdventure (like the list of objects or areas, the microphone settings, etc.)

WARNING:

If you're uploading on WorkAdventure server, it only stores the "build" you send to it. It does not store the original files you used to create the map. If you want to update your map, you need to update the original files on your computer and run the `npm run upload` command again. So do not think you can get back the original files from the WorkAdventure server. It is your responsibility to store the original map files in a safe place in case you want to modify those (like Github).

If you have any questions or need further assistance, don't hesitate to ask either by email or Discord!
