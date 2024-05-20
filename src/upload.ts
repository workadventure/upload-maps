#!/usr/bin/env node

import * as fs from 'fs';
import archiver = require('archiver');
import * as dotenv from 'dotenv';
import promptSync = require('prompt-sync');
import axios, {isAxiosError} from 'axios';

const prompt = promptSync();
dotenv.config();

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
async function checkMapStorageUrl(mapStorageUrl: string): Promise<boolean> {
    if (mapStorageUrl !== '/upload' && mapStorageUrl !== undefined && mapStorageUrl !== ' /upload' && mapStorageUrl !== null) {
        try {
            let testUrl = `${mapStorageUrl.replace('/upload', '/ping')}`;
            const response = await axios.get(`${testUrl}`);
            console.log('Your map storage URL is :', mapStorageUrl);
            return response.status === 200;
        } catch (err) {
            console.log(err)
            if (isAxiosError(err) && err.response?.status === 401) {
                console.log('Invalid URL. Please provide a valid URL.');
            } else if (isAxiosError(err) && err.response?.status === 403) {
                console.log('Forbidden access. Please provide a valid API Key.');
            } else if (isAxiosError(err) && err.response?.status === 404) {
                console.log('Invalid URL. Please provide a valid URL.');
            } else {
                console.log("An error occurred while checking the URL. Please provide a valid URL.");
            }
            return false;
        }
    } else {
        console.log('Please provide a valid URL.');
        return false;
    }
}

// Test pour demander des questions plus facilement
async function askQuestions() {
    let linkForMapStorageDocumentation = 'https://github.com/workadventure/workadventure/blob/develop/map-storage/README.md';
    let linkForMapStorageInfo = 'https://docs.workadventu.re/map-building/tiled-editor/';

    let apiKey : string = "";
    let uploadMode;
    let mapStorageUrl;
    let directory;

    if (process.env.MAP_STORAGE_URL) {
        mapStorageUrl = process.env.MAP_STORAGE_URL;
        console.log("URL Map Storage found, you're good to go !");
    } else {
        console.log(`Now let's set up your map storage URL. If you don't know you can see more details to find it here : ${linkForMapStorageDocumentation}\nand here ${linkForMapStorageInfo} !`);
        console.log("------------------------------------");
        while (!mapStorageUrl || mapStorageUrl === undefined || mapStorageUrl === '' || mapStorageUrl === ' ') {
            mapStorageUrl = prompt(`Please enter your URL : `);
            mapStorageUrl = mapStorageUrl.concat("/upload");
            console.log('A URL is required to upload your map');
            console.log('-------------------------------------');
            if (mapStorageUrl && mapStorageUrl !== ' ' && mapStorageUrl !== undefined) {;
                if (await checkMapStorageUrl(mapStorageUrl)) {
                    console.log('Map storage URL is valid.');
                } else {
                    console.log("------------------------------------");
                    mapStorageUrl = '';
                }
            }
        }
    }
    console.log("------------------------------------");


    const secretEnvPath = '.env.secret';
    if (fs.existsSync(secretEnvPath)) {
        console.log("Secret env found !")
        if (fs.readFileSync(secretEnvPath).includes('API_KEY')) {
            console.log("Secret env found and not empty!")
            const secretEnvContent = fs.readFileSync(secretEnvPath, 'utf8');
            const apiKeyMatch = secretEnvContent.match(/API_KEY=(.+)/);
            if (apiKeyMatch && apiKeyMatch[1]) {
                apiKey = apiKeyMatch[1];
                console.log("API Key found, you're good to go !");
            }
        } else {
            console.log("Secret env found but empty!")
            while (apiKey === '' || !apiKey || apiKey === undefined || apiKey === ' ') {
                apiKey = prompt('Please enter your API Key ?');
                if (apiKey) {
                    console.log('Your API Key is :', apiKey);
                    console.log("------------------------------------");
                }

            }
        }
    } else {
        console.log("Secret env not found !")
        while (apiKey === '' || !apiKey || apiKey === undefined || apiKey === ' ') {
            apiKey = prompt('Please enter your API Key ?');
            if (apiKey) {
                console.log('Your API Key is :', apiKey);
            }
        }
    }


    if (process.env.DIRECTORY) {
        directory = process.env.DIRECTORY
        console.log("Directory found in .env file, you're good to go !");
        console.log("------------------------------------");
    } else {
        // if (!directory || directory === undefined) {
        console.log("------------------------------------");
        directory = prompt('Name of directory ? (optional)');
        if (directory) {
            console.log('Your map will be in the directory :', directory);
            console.log("------------------------------------");
        } else {
            console.log("NO DIRECTORY")
            directory = undefined;
        }
    }

    if (process.env.UPLOAD_MODE) {
        uploadMode = process.env.UPLOAD_MODE;
        console.log("Your upload mode is : ", uploadMode);
    } else {
        uploadMode = 'MAP_STORAGE'
    }

    return { apiKey, directory, mapStorageUrl, uploadMode };
}


// Fonction pour effectuer l'upload avec axios
async function uploadMap(apiKey: string, mapStorageUrl: string, directory: string, uploadMode: string) {
    if(uploadMode !== 'CUSTOM') {
        console.log("Uploading ...");
        await axios.post(mapStorageUrl, {
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
        createEnvsFiles(apiKey, mapStorageUrl, directory, uploadMode);
    }
    else {
        createEnvsFiles(apiKey, mapStorageUrl, directory, uploadMode);
    }
}

// Fonction pour créer le fichier .env
function createEnvsFiles(apiKey: string, mapStorageUrl: string, directory: string, uploadMode: string) {
    if (!fs.existsSync('.env') || fs.readFileSync('.env').length === 0){
        fs.writeFileSync('.env', `LOG_LEVEL=1\nTILESET_OPTIMIZATION=false\nTILESET_OPTIMIZATION_QUALITY_MIN=0.9\nTILESET_OPTIMIZATION_QUALITY_MAX=1.0\nMAP_STORAGE_URL=${mapStorageUrl}\nDIRECTORY=${directory}\nUPLOAD_MODE=${uploadMode}`);
        console.log('Env files created successfully');
        if (process.env.API_KEY) {
            fs.writeFileSync('.env', `LOG_LEVEL=1\nTILESET_OPTIMIZATION=false\n{TILESET_OPTIMIZATION_QUALITY_MIN=0.9\nTILESET_OPTIMIZATION_QUALITY_MAX=1.0\nMAP_STORAGE_URL=${mapStorageUrl}\nDIRECTORY=${directory}\nUPLOAD_MODE=${uploadMode}`);
            delete process.env.API_KEY;
        }
    }
    if (!fs.existsSync('.env.secret') || !fs.readFileSync('.env.secret').includes(apiKey)) {
            fs.writeFileSync('.env.secret', `API_KEY=${apiKey}`);
            console.log('API Key added to the .env file');
        }
        if (process.env.API_KEY) {
            delete process.env.API_KEY;
            fs.writeFileSync('.env', `LOG_LEVEL=1\nTILESET_OPTIMIZATION=false\nTILESET_OPTIMIZATION_QUALITY_MIN=0.9\nTILESET_OPTIMIZATION_QUALITY_MAX=1.0\nMAP_STORAGE_URL=${mapStorageUrl}\nDIRECTORY=${directory}\nUPLOAD_MODE=${uploadMode}`);
        }
    if (fs.existsSync('.env')) {
        fs.writeFileSync('.env', `LOG_LEVEL=1\nTILESET_OPTIMIZATION=false\nTILESET_OPTIMIZATION_QUALITY_MIN=0.9\nTILESET_OPTIMIZATION_QUALITY_MAX=1.0\nMAP_STORAGE_URL=${mapStorageUrl}\nDIRECTORY=${directory}\nUPLOAD_MODE=${uploadMode}`);
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
        const { apiKey, directory, mapStorageUrl, uploadMode } = await askQuestions();

        // Envoyer l'upload
        if (apiKey && mapStorageUrl && uploadMode || process.env.URL_MAPSTORAGE && process.env.API_KEY && process.env.UPLOAD_MODE) {
            await uploadMap(apiKey, mapStorageUrl, directory ?? "", uploadMode);
        }


    } catch (err) {
        console.error('ERROR :', err);
    }
}

main();
