#!/usr/bin/env node

import * as fs from 'fs';
import archiver = require('archiver');
import * as dotenv from 'dotenv';
import promptSync = require('prompt-sync');
import axios from 'axios';

const prompt = promptSync();
dotenv.config();


// http://map-storage.workadventure.localhost/upload

// Fonction pour créer le dossier zip
async function createZipDirectory(sourceDir: string, outPath: fs.PathLike) {
    const archive = archiver('zip', { zlib: { level: 9 } });
    const stream = fs.createWriteStream(outPath);

    return new Promise<void>((resolve, reject) => {
        archive
            .directory(sourceDir, false)
            .on('error', err => reject(err))
            .pipe(stream);

        stream.on('close', () => resolve());
        archive.finalize();
    });
}

// Fonction pour vérifier l'URL du map storage
async function checkMapStorageUrl(urlMapStorage: string): Promise<boolean> {
    try {
        let testUrl = `${urlMapStorage.replace('/upload', '/ping')}`;
        const response = await axios.get(`${testUrl}`);
        console.log('Your map storage URL is :', urlMapStorage);
        return response.status === 200;
    } catch (err) {
        console.log(err)
        if (err.response && err.response.status === 401) {
            console.log('Invalid URL. Please provide a valid URL.');
        } else if (err.response && err.response.status === 403) {
            console.log('Forbidden access. Please provide a valid API Key.');
        } else if (err.response && err.response.status === 404) {
            console.log('Invalid URL. Please provide a valid URL.');
        } else {
            console.log("An error occurred while checking the URL. Please provide a valid URL.");
        }
        return false;
    }
}

// Test pour demander des questions plus facilement
async function askQuestions() {
    let linkForMapStorageDocumentation = 'https://github.com/workadventure/workadventure/blob/develop/map-storage/README.md';
    let linkForMapStorageInfo = 'https://docs.workadventu.re/map-building/tiled-editor/';

    let apiKey;
    let urlMapStorage;
    let directory;


    if (process.env.URL_MAP_STORAGE) {
        urlMapStorage = process.env.URL_MAP_STORAGE;
        console.log("URL Map Storage found in .env file, you're good to go !");
    } else {
        console.log(`Now let's set up your map storage URL. If you don't know you can see more details to find it here : ${linkForMapStorageDocumentation}\nand here ${linkForMapStorageInfo} !`);
        console.log("------------------------------------");
        while (!urlMapStorage || urlMapStorage === undefined || urlMapStorage === '' || urlMapStorage === ' ') {
            urlMapStorage = prompt(`Please enter your URL : `);
            console.log('A URL is required to upload your map');
            console.log('-------------------------------------');
            if (urlMapStorage && urlMapStorage !== ' ' && urlMapStorage !== undefined) {;
                if (await checkMapStorageUrl(urlMapStorage)) {
                    console.log('Map storage URL is valid.');
                } else {
                    console.log("------------------------------------");
                    urlMapStorage = ''; // Clearing the invalid URL
                }
            }
        }
    }
    console.log("------------------------------------");


    const secretEnvPath = '.env.secret';
    if (fs.existsSync(secretEnvPath)) {
        console.log("SECRET ENV FILE FOUND!")
        if (fs.readFileSync(secretEnvPath).includes('API_KEY')) {
            console.log("SECRET ENV FILE FOUND AND NOT EMPTY!")
            const secretEnvContent = fs.readFileSync(secretEnvPath, 'utf8');
            const apiKeyMatch = secretEnvContent.match(/API_KEY=(.+)/);
            if (apiKeyMatch && apiKeyMatch[1]) {
                apiKey = apiKeyMatch[1];
                console.log("API Key found in .env.secret file, you're good to go !");
            }
        } else {
            console.log("SECRET ENV FILE FOUND BUT EMPTY!")
            while (apiKey === '' || !apiKey || apiKey === undefined || apiKey === ' ') {
                apiKey = prompt('Please enter your API Key ?');
                if (apiKey)
                    console.log('Your API Key is :', apiKey);
                    console.log("------------------------------------");

            }
        }
    } else {
        console.log("SECRET ENV FILE NOT FOUND!")
        while (apiKey === '' || !apiKey || apiKey === undefined || apiKey === ' ') {
            apiKey = prompt('Please enter your API Key ?');
            if (apiKey)
                console.log('Your API Key is :', apiKey);
        }
    }


    if (process.env.DIRECTORY) {
        directory = process.env.DIRECTORY
        console.log("Directory found in .env file, you're good to go !");
        console.log("------------------------------------");
    } else {
        if (!directory || directory === undefined) {
            console.log("------------------------------------");
            directory = prompt('Name of directory ? If null it will be call by default map-user :');
            if (directory) {
                console.log('Your map will be in the directory :', directory);
                console.log("------------------------------------");
            } else {
                directory = 'map-user';
                console.log('Your map will be in the directory :', directory);
                console.log("------------------------------------");
            }
        }
    }
    return { apiKey, directory, urlMapStorage };
}

// Fonction pour effectuer l'upload avec axios
async function uploadMap(apiKey: string, urlMapStorage: string, directory: string,) {

    console.log("Uploading ...");
    await axios.post(urlMapStorage, {
        apiKey: apiKey,
        file: fs.createReadStream('dist.zip'),
        directory: directory
    }, {
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'multipart/form-data'
        }
    });

    setTimeout(() => {
        console.log('Upload done successfully');
    }, 2000);

    if (!fs.existsSync('.env')) {
        console.log("Creating .env file...");
    }
    createEnvsFiles(apiKey, urlMapStorage, directory);
}

// Fonction pour créer le fichier .env
function createEnvsFiles(apiKey: string, urlMapStorage: string, directory: string) {
    if (!fs.existsSync('.env') || fs.readFileSync('.env').length === 0){
        fs.writeFileSync('.env', `LOG_LEVEL=1\nTILESET_OPTIMIZATION=false\nTILESET_OPTIMIZATION_QUALITY_MIN=0.9\nTILESET_OPTIMIZATION_QUALITY_MAX=1.0\nURL_MAP_STORAGE=${urlMapStorage}\nDIRECTORY=${directory}`);
        console.log('Env file created successfully');
    }
    if (!fs.existsSync('.env.secret') || !fs.readFileSync('.env.secret').includes(apiKey)) {
            fs.writeFileSync('.env.secret', `API_KEY=${apiKey}`);
            console.log('API Key added to the .env file');
        }
    }


// Fonction principale
async function main() {
    try {
        // Créer le dossier zip
        const sourceDirectory = 'dist';
        const finalDirectory = 'dist.zip';
        await createZipDirectory(sourceDirectory, finalDirectory);
        console.log('Directory has been zipped');
        console.log("------------------------------------");

        // Demander des informations à l'utilisateur
        const { apiKey, directory, urlMapStorage } = await askQuestions();

        // Envoyer l'upload
        if (apiKey && urlMapStorage && (directory ?? '') || process.env.URL_MAPSTORAGE && process.env.API_KEY && process.env.DIRECTORY) {
            await uploadMap(apiKey, urlMapStorage, directory ?? '');
        }

    } catch (err) {
        console.error('ERROR DE OUF :', err);
    }
}

// Exécuter la fonction principale
main();
