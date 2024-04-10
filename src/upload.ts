exports.printMsg = function() {
    console.log("This is a message from the demo package");
}

import fs from 'fs';
import archiver from 'archiver';
import dotenv from 'dotenv';
import axios from 'axios';
import promptSync from 'prompt-sync';

const prompt = promptSync();
dotenv.config();

let urlMapStoragedefault = 'http://map-storage.workadventure.localhost/upload';

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

// Test pour demander des questions plus facilement
async function askQuestions() {
    let linkForMapStorageDocumentation = 'https://github.com/workadventure/workadventure/blob/develop/map-storage/README.md';
    let linkForMapStorageInfo = 'https://docs.workadventu.re/map-building/tiled-editor/';

    let apiKey;
    if (process.env.API_KEY) {
        console.log("API Key found in .env file, you're good to go !");
        apiKey = process.env.API_KEY;
    } else {
        while (apiKey === '' || !apiKey || apiKey === undefined) {
            apiKey = prompt('Please enter your API Key ?');
            if (apiKey)
                console.log('Your API Key is :', apiKey);
        }
    }

    console.log("------------------------------------");

    let urlMapStorage;
    console.log(`Now let's set up your map storage URL. If you don't know you can see more details to find it here : ${linkForMapStorageDocumentation}\nand here ${linkForMapStorageInfo} ! \nIf you don't put anything it will be by default http://map-storage.workadventure.localhost/upload`);
    console.log("------------------------------------");
    urlMapStorage = prompt(`Please enter your URL : `)
    if (urlMapStorage && urlMapStorage !== ' ' && urlMapStorage !== undefined) {;
        console.log('Your map storage URL is :', urlMapStorage);
    } else {
        urlMapStorage = urlMapStoragedefault;
        console.log('Your map storage URL is :', urlMapStoragedefault);
    }

    console.log("------------------------------------");

    let directory;
    while (!directory || directory === undefined) {
        directory = prompt('Name of directory ? If null it will be call by default map-user :');
        if(directory) {
            console.log('Your map will be in the directory :', directory);
        } else {
            directory = 'map-user';
            console.log('Your map will be in the directory :', directory);
        }
    }
    return { apiKey, directory, urlMapStorage };
}


// Fonction pour effectuer l'upload avec axios
async function uploadMap(apiKey: string, urlMapStorage: string, directory: string,) {

    await axios.post(urlMapStorage,{
        apiKey: apiKey,
        file: fs.createReadStream('dist.zip'),
        directory: directory
    }, {
        headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'multipart/form-data'
        }
    })
    console.log('Upload done successfully');

    if (!fs.existsSync('.env')) {
        console.log("Creating .env file...")
    }
    createEnvFile(apiKey);

}


function createEnvFile(apiKey: string) {
    if (!fs.existsSync('.env')) {
        fs.writeFileSync('.env', `LOG_LEVEL=1\nTILESET_OPTIMIZATION=false\nTILESET_OPTIMIZATION_QUALITY_MIN=0.9\nTILESET_OPTIMIZATION_QUALITY_MAX=1.0\nAPI_KEY=${apiKey}`);
        console.log('Env file created successfully');
    }
    else {
        if (!fs.readFileSync('.env').includes(apiKey)) {
            fs.appendFileSync('.env', `API_KEY=${apiKey}`);
            console.log('API Key added to the .env file');
        }
    }
}

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
        console.log(`Your API Key is: ${apiKey}`);
        console.log(`Your map will be inside the directory : ${directory}`);
        console.log(`You're url of map storage is : ${urlMapStorage}`);


        // Envoyer l'upload
        if (apiKey && urlMapStorage && directory) {
            await uploadMap(apiKey, urlMapStorage, directory);
        } else {
            console.log("You need to provide an API Key and you're on the default URL : http://map-storage.workadventure.localhost/upload");
        }


    } catch (err) {
        console.error('ERROR DE OUF :', err);
    }
}

main();
