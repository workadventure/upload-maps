#!/usr/bin/env node

import * as fs from 'fs';
import archiver = require('archiver');
import * as dotenv from 'dotenv';
import promptSync = require('prompt-sync');
import axios, {isAxiosError} from 'axios';

const prompt = promptSync();
dotenv.config();

let apiKeyFilledInUpload = false;
let variableEnv = false;

// Function to create the zip folder
async function createZipDirectory(sourceDir: string, outPath: fs.PathLike) {
    const archive = archiver("zip", { zlib: { level: 9 } });
    const stream = fs.createWriteStream(outPath);

    return new Promise<void>((resolve, reject) => {
        archive
            .directory(sourceDir, false)
            .on("error", (err) => reject(err))
            .pipe(stream);

        stream.on("close", () => resolve());
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
        console.log("Please provide a valid URL.");
        return false;
    }
}

// Ask input for users

async function askQuestions() {
    const linkForMapStorageDocumentation =
        "https://github.com/workadventure/workadventure/blob/develop/map-storage/README.md";
    const linkForMapStorageInfo = "https://docs.workadventu.re/map-building/tiled-editor/";

    let mapStorageApiKey : string = "";
    let uploadMode;
    let mapStorageUrl;
    let directory;

    if (process.env.MAP_STORAGE_URL) {
        mapStorageUrl = process.env.MAP_STORAGE_URL;
        console.log("URL Map Storage found, you're good to go !");
    } else {
        console.log(
            `Now let's set up your map storage URL. If you don't know you can see more details to find it here : ${linkForMapStorageDocumentation}\nand here ${linkForMapStorageInfo} !`,
        );
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

    dotenv.config({ path: ".env.secret" });

    if (process.env.API_KEY) {
        mapStorageApiKey = process.env.API_KEY;
        console.log("Secret env found and not empty!");
    } else {
        console.log("Secret env found but empty!");
        while (
            mapStorageApiKey === "" ||
            !mapStorageApiKey ||
            mapStorageApiKey === undefined ||
            mapStorageApiKey === " "
        ) {
            mapStorageApiKey = prompt("Please enter your API Key ?");
            if (mapStorageApiKey) {
                console.log("Your API Key is :", mapStorageApiKey);
                console.log("------------------------------------");
                apiKeyFilledInUpload = true;
            }
        }
    }

    if (process.env.DIRECTORY) {
        directory = process.env.DIRECTORY;
        console.log("Directory found in .env file, you're good to go !");
        console.log("------------------------------------");
    } else {
        console.log("------------------------------------");
        directory = prompt("Name of directory ? (optional)");
        if (directory) {
            variableEnv = true;
            console.log("Your map will be in the directory :", directory);
            console.log("------------------------------------");
        } else {
            console.log("NO DIRECTORY");
            directory = undefined;
        }
    }

    if (process.env.UPLOAD_MODE) {
        uploadMode = process.env.UPLOAD_MODE;
        console.log("Your upload mode is : ", uploadMode);
        variableEnv = true;
    } else {
        uploadMode = "MAP_STORAGE";
        variableEnv = true;
    }

    return { mapStorageApiKey, directory, mapStorageUrl, uploadMode };
}

// Upload function with axios
async function uploadMap(
    mapStorageApiKey: string,
    mapStorageUrl: string,
    directory: string | null = null,
    uploadMode: string,
) {
    console.log("Uploading ...");
    await axios.post(
        mapStorageUrl,
        {
            apiKey: mapStorageApiKey,
            file: fs.createReadStream("dist.zip"),
            directory: directory,
        },
        {
            headers: {
                Authorization: `Bearer ${mapStorageApiKey}`,
                "Content-Type": "multipart/form-data",
            },
        },
    );

    setTimeout(() => {
        console.log("Upload done successfully");
    }, 2000);

    if (!fs.existsSync(".env")) {
        console.log("Creating .env file...");
        createEnvsFiles(mapStorageApiKey, mapStorageUrl, directory, uploadMode);
    }

    if (apiKeyFilledInUpload || variableEnv) {
        createEnvsFiles(mapStorageApiKey, mapStorageUrl, directory, uploadMode);
    }
}

// Function to create the .env files
function createEnvsFiles(mapStorageApiKey: string, mapStorageUrl: string, directory: string, uploadMode: string) {
    if (!fs.existsSync(".env") || fs.readFileSync(".env").length === 0 || variableEnv) {
        fs.writeFileSync(
            ".env",
            `LOG_LEVEL=1\nTILESET_OPTIMIZATION=false\nTILESET_OPTIMIZATION_QUALITY_MIN=0.9\nTILESET_OPTIMIZATION_QUALITY_MAX=1.0\nURL_MAP_STORAGE=${mapStorageUrl}\nDIRECTORY=${directory}\nUPLOAD_MODE=${uploadMode}`,
        );
        console.log("Env files created successfully");
        if (process.env.API_KEY) {
            delete process.env.API_KEY;
        }
    }

    if (!fs.existsSync(".env.secret") || !fs.readFileSync(".env.secret").includes(mapStorageApiKey)) {
        fs.writeFileSync(".env.secret", `API_KEY=${mapStorageApiKey}`);
        console.log("API Key added to the .env file");
    }
}

// Fonction for upload
async function main() {
    try {
        // Create zip file
        const sourceDirectory = "dist";
        const finalDirectory = "dist.zip";
        await createZipDirectory(sourceDirectory, finalDirectory);
        console.log("Directory has been zipped");
        console.log("------------------------------------");

        // Ask user input
        const { mapStorageApiKey, directory, mapStorageUrl, uploadMode } = await askQuestions();

        // Envoyer l'upload
        if (apiKey && mapStorageUrl && uploadMode || process.env.URL_MAPSTORAGE && process.env.API_KEY && process.env.UPLOAD_MODE) {
            await uploadMap(apiKey, mapStorageUrl, directory ?? "", uploadMode);
        }
    } catch (err) {
        console.error("ERROR :", err);
    }
}

main();
