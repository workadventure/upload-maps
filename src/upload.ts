#!/usr/bin/env node

import * as fs from "fs";
import archiver from "archiver";
import * as dotenv from "dotenv";
import promptSync from "prompt-sync";
import axios, { isAxiosError } from "axios";
import { Command, type OptionValues } from "commander";

const program = new Command();

const prompt = promptSync();
dotenv.config();

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
        archive.finalize().catch((e) => console.error(e));
    });
}

// Function to check the URL of the map storage
async function checkMapStorageUrl(mapStorageUrl: string): Promise<boolean> {
    if (
        mapStorageUrl !== "/upload" &&
        mapStorageUrl !== undefined &&
        mapStorageUrl !== " /upload" &&
        mapStorageUrl !== null
    ) {
        try {
            const testUrl = `${mapStorageUrl.replace("/upload", "/ping")}`;
            const response = await axios.get(`${testUrl}`);
            console.log("Your map storage URL is:", mapStorageUrl);
            return response.status === 200;
        } catch (err) {
            console.log(err);
            if (isAxiosError(err)) {
                const status = err.response?.status;
                if (status === 401) {
                    console.log("Invalid URL. Please provide a valid URL.");
                } else if (status === 403) {
                    console.log("Forbidden access. Please provide a valid API Key.");
                } else if (status === 404) {
                    console.log("Invalid URL. Please provide a valid URL.");
                } else {
                    console.log("An error occurred while checking the URL. Please provide a valid URL.");
                }
            }
            return false;
        }
    } else {
        console.log("Please provide a valid URL.");
        return false;
    }
}

// Ask input for users
async function askQuestions(options: OptionValues) {
    const linkForMapStorageDocumentation =
        "https://github.com/workadventure/workadventure/blob/develop/map-storage/README.md";
    const linkForMapStorageInfo = "https://docs.workadventu.re/map-building/tiled-editor/";

    let mapStorageApiKey = (options.apiKey as string) || process.env.API_KEY || "";
    let uploadMode = (options.uploadMode as string) || process.env.UPLOAD_MODE || "MAP_STORAGE";
    let mapStorageUrl = (options.mapStorageUrl as string) || process.env.MAP_STORAGE_URL || "";
    let directory = (options.directory as string) || process.env.DIRECTORY || "";

    if (!mapStorageUrl) {
        console.log(
            `Now let's set up your map storage URL. If you don't know, you can see more details here: ${linkForMapStorageDocumentation}\nand here: ${linkForMapStorageInfo}!`,
        );
        console.log("------------------------------------");
        while (!mapStorageUrl) {
            mapStorageUrl = prompt(`Please enter your URL: `);
            if (mapStorageUrl) {
                mapStorageUrl = mapStorageUrl.concat("/upload");
                if (await checkMapStorageUrl(mapStorageUrl)) {
                    console.log("Map storage URL is valid.");
                } else {
                    console.log("Invalid URL. Please try again.");
                    mapStorageUrl = "";
                }
            } else {
                console.log("A URL is required to upload your map.");
            }
        }
    } else {
        mapStorageUrl = mapStorageUrl.concat("/upload");
        console.log("URL Map Storage found, you're good to go!");
        variableEnv = true;
    }
    console.log("------------------------------------");

    dotenv.config({ path: ".env.secret" });
    if (!mapStorageApiKey) {
        while (!mapStorageApiKey) {
            mapStorageApiKey = prompt("Please enter your API Key: ");
            if (mapStorageApiKey) {
                console.log("Your API Key is:", mapStorageApiKey);
                console.log("------------------------------------");
            }
        }
    } else {
        variableEnv = true;
        console.log("API Key found, you're good to go!");
    }

    if (!directory) {
        console.log("------------------------------------");
        directory = prompt("Name of directory? (optional): ");
        if (directory) {
            variableEnv = true;
            console.log("Your map will be in the directory:", directory);
            console.log("------------------------------------");
        } else {
            console.log("NO DIRECTORY");
            directory = "";
        }
    } else {
        console.log("Directory found in .env file, you're good to go!");
        console.log("------------------------------------");
    }

    if (!uploadMode) {
        variableEnv = true;
        uploadMode = "MAP_STORAGE";
        console.log("Default upload mode is:", uploadMode);
        console.log("------------------------------------");
    } else {
        variableEnv = true;
        console.log("Your upload mode is:", uploadMode);
        console.log("------------------------------------");
    }

    return { mapStorageApiKey, directory, mapStorageUrl, uploadMode };
}

// Upload function with axios
async function uploadMap(mapStorageApiKey: string, mapStorageUrl: string, directory: string, uploadMode: string) {
    console.log(mapStorageUrl);
    console.log("Uploading...");
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

    console.log("Upload done successfully");

    if (!fs.existsSync(".env")) {
        console.log("Creating .env file...");
        createEnvsFiles(mapStorageApiKey, mapStorageUrl, directory, uploadMode);
    }

    if (variableEnv) {
        createEnvsFiles(mapStorageApiKey, mapStorageUrl, directory, uploadMode);
    }
}

// Function to create the .env files
function createEnvsFiles(mapStorageApiKey: string, mapStorageUrl: string, directory: string, uploadMode: string) {
    if (!fs.existsSync(".env") || fs.readFileSync(".env").length === 0 || variableEnv) {
        fs.writeFileSync(
            ".env",
            `LOG_LEVEL=1\nTILESET_OPTIMIZATION=false\nTILESET_OPTIMIZATION_QUALITY_MIN=0.9\nTILESET_OPTIMIZATION_QUALITY_MAX=1.0\nMAP_STORAGE_URL=${mapStorageUrl}\nDIRECTORY=${directory}\nUPLOAD_MODE=${uploadMode}`,
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

// Main function
async function main() {
    program
        .option("-k, --apiKey <apiKey>", "API Key for the script")
        .option("-d, --directory <directory>", "Directory for the script")
        .option("-u, --uploadMode <uploadMode>", "Upload mode for the script")
        .option("-m, --mapStorageUrl <mapStorageUrl>", "Map Storage URL for the script")
        .parse(process.argv);

    const options = program.opts();

    // Create zip file
    const sourceDirectory = "dist";
    const finalDirectory = "dist.zip";
    await createZipDirectory(sourceDirectory, finalDirectory);
    console.log("Directory has been zipped");
    console.log("------------------------------------");

    // Ask user input
    const { mapStorageApiKey, directory, mapStorageUrl, uploadMode } = await askQuestions(options);

    // Send upload
    if (mapStorageApiKey && mapStorageUrl && uploadMode) {
        await uploadMap(mapStorageApiKey, mapStorageUrl, directory ?? "", uploadMode);
    }
}

main().catch((err) => console.error(err));
