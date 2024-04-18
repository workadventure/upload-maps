# Map Upload Package for WorkAdventure

This package is designed to help you upload maps from Tiled to the map storage of WorkAdventure.

## Installation

To install this package, use the following command:

> npm install @workadventure/upload-maps

## Usage

UPLOAD YOUR MAPS ON MAP-STORAGE

This document will guide you through the process of uploading your own map on the map storage.

To use this package, import it into your project and run the command in your terminal:

> node_modules/.bin/upload-wa-map

!! Before you run the script you need to install the dependencies (....) !!

It will ask you some questions:

1. Your API Key. You can find it on https://admin.staging.workadventu.re
   On the left panel you can go to Developers tab --> API keys / Zapier.
   There you can create a new token. (Don't forget to save it !)

2. The URL of your map storage. If you're self-hosted, it will be in the admin on : https://admin.staging.workadventu.re
   On the left panel you can go to Developers tab --> API keys / Zapier.
   There you can fine "Map-storage API endpoint" it is the url for uploading map storage

3. You can also add a directory name if you want. If you leave this blank, the default name will be map-user.
   It will be the folder where all your uploaded files will be stored in.

After answering these question, the script will start to upload your file. You need to see something like this : Upload done successfully

To complete the upload, you need to set your secrets variables in your github repository. You need to set the URL of your map storage and your API Key.

https://scribehow.com/shared/Upload_Map__Set_up_secrets_for_in_your_repository__FKsqAsrVQ_SzDavSudb19Q

> When your done you can just commit and push your changes and it's done !

If you have any questions or need further assistance, don't hesitate to ask ! (a.artus@workadventu.re)
