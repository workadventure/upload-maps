#!/usr/bin/env node

import * as fs from "fs";
import archiver from "archiver";
import * as dotenv from "dotenv";
import promptSync from "prompt-sync";
import axios, { isAxiosError } from "axios";
import { Command } from "commander";
import chalk from "chalk";

const program = new Command();

const prompt = promptSync();

const linkForMapStorageInfo = "https://admin.workadventu.re/login";

function shouldRunInit(config: Config) {
    return !(config.mapStorageApiKey || config.directory || config.mapStorageUrl);
}

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
    if (mapStorageUrl) {
        try {
            let url = mapStorageUrl;
            if (!url.endsWith("/")) {
                url += "/";
            }
            url += "ping";

            const response = await axios.get(url);
            return response.status === 200;
        } catch (err) {
            if (isAxiosError(err)) {
                const status = err.response?.status;
                if (status === 403) {
                    console.log(chalk.red("Forbidden access. Please provide a valid API Key.\n"));
                    console.log(
                        chalk.italic(
                            `You can find more information on where to find this API Key here : ${linkForMapStorageInfo}\n`,
                        ),
                    );
                    console.log("------------------------------------\n");
                } else {
                    console.log(chalk.red("Invalid URL. Please provide a valid URL.\n"));
                    console.log(chalk.red(`Error: ${err.message}\n`));
                    console.log(
                        chalk.italic(
                            `You can find more information on where to find this URL here : ${linkForMapStorageInfo}\n`,
                        ),
                    );
                }
            } else {
                console.log(chalk.red("Invalid URL. Please provide a valid URL.\n"));
                if (err instanceof Error) {
                    console.log(chalk.red(`Error: ${err.message}\n !`));
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
async function askQuestions(): Promise<Config> {
    console.log("------------------------------------");
    console.log(chalk.green("\nLooks like this is your first time uploading a map! Let's configure the map upload.\n"));
    console.log(
        chalk.bold(
            "Running this command will ask you different parameters, the URL where you're going to upload your map, the directory (optional) of your map and the API key.\n",
        ),
    );
    console.log(chalk.bold("How does it work ?\n"));
    console.log(" 1. First your map files are going to be build\n");
    console.log(" 2. The scripts of your map are compiled and bundled\n");
    console.log(" 3. The result of the built is written in the dist directory\n");
    console.log(" 4. The content of the public directory is copied to the dist directory.\n");
    console.log(
        " 5. Then, a ZIP file of the dist directory is created and sent to the WorkAdventure 'map-storage' server.\n",
    );
    console.log(
        chalk.yellow(
            " !!! Caution, the WorkAdventure server only stores the built files (from the \"dist\" directory). You cannot get back your original source files from the WorkAdventure server, so make sure to keep these original files in a safe place. If you want to modify the map just modify the source files and run the command 'npm run upload' again.\n",
        ),
    );
    console.log("------------------------------------");

    console.log(chalk.blue(`\nNow let's set up the configuration.\n`));
    console.log(
        chalk.blue(
            `If you don't know how to find your map storage URL, you can see more details in your admin account: ${linkForMapStorageInfo} !\n`,
        ),
    );
    console.log("------------------------------------\n");
    let mapStorageUrl = "";
    while (!mapStorageUrl) {
        mapStorageUrl = prompt(chalk.bold(`Please enter your map storage URL: `));
        if (mapStorageUrl) {
            if (await checkMapStorageUrl(mapStorageUrl)) {
                console.log(chalk.green("Map storage URL is valid."));
            } else {
                mapStorageUrl = "";
            }
        } else {
            console.log(chalk.red("A URL is required to upload your map."));
        }
    }
    console.log("\n------------------------------------\n");

    let mapStorageApiKey = "";
    while (!mapStorageApiKey) {
        mapStorageApiKey = prompt(chalk.bold("Please enter your API Key: "));
        if (mapStorageApiKey) {
            console.log(chalk.green("Your API Key is:", mapStorageApiKey));
            console.log("\n------------------------------------\n");
        }
    }

    const directory = prompt(chalk.bold("Name of directory? (optional): "));
    if (directory) {
        console.log(chalk.green("Your map will be in the directory:", directory));
        console.log("\n------------------------------------");
    } else {
        console.log(chalk.bold("NO DIRECTORY"));
        console.log("\n------------------------------------");
    }

    return { mapStorageApiKey, directory, mapStorageUrl, uploadMode: "MAP_STORAGE" };
}

// Upload function with axios
async function uploadMap(config: Config) {
    console.log("\nYour map is uploading ...");

    let url = config.mapStorageUrl;
    if (!url.endsWith("/")) {
        url += "/";
    }
    url += "upload";

    await axios.post(
        url,
        {
            apiKey: config.mapStorageApiKey,
            file: fs.createReadStream("dist.zip"),
            directory: config.directory,
        },
        {
            headers: {
                Authorization: `Bearer ${config.mapStorageApiKey}`,
                "Content-Type": "multipart/form-data",
            },
        },
    );

    console.log(chalk.green("Upload done successfully !"));
    console.log("\n------------------------------------\n");
}

// Function to create the .env files
function createEnvsFiles(config: Config) {
    fs.appendFileSync(
        ".env",
        `\nMAP_STORAGE_URL=${config.mapStorageUrl}\nDIRECTORY=${config.directory}\nUPLOAD_MODE=${config.uploadMode}`,
    );
    fs.writeFileSync(".env.secret", `MAP_STORAGE_API_KEY=${config.mapStorageApiKey}`);
    console.log(chalk.green("Env files created successfully\n"));
    console.log(
        chalk.green(
            "In the future, if you need to change the URL or the API Key, you can now directly edit the .env and .env.secret files.\n",
        ),
    );
}

interface Config {
    mapStorageUrl: string;
    mapStorageApiKey: string;
    directory: string;
    uploadMode: string;
}

// Main function
async function main() {
    program
        .option("-k, --mapStorageApiKey <mapStorageApiKey>", "API Key for the map storage")
        .option("-u, --mapStorageUrl <mapStorageUrl>", "URL for the map storage")
        .option("-d, --directory <directory>", "Directory for the map storage")
        .option("-m, --uploadMode <uploadMode>", "Upload mode for the map storage")
        .parse(process.argv);

    const options = program.opts();

    dotenv.config();
    dotenv.config({ path: ".env.secret" });

    let config: Config = {
        mapStorageApiKey: (options.mapStorageApiKey as string) || process.env.MAP_STORAGE_API_KEY || "",
        uploadMode: (options.uploadMode as string) || process.env.UPLOAD_MODE || "MAP_STORAGE",
        mapStorageUrl: (options.mapStorageUrl as string) || process.env.MAP_STORAGE_URL || "",
        directory: (options.directory as string) || process.env.DIRECTORY || "",
    };

    let shouldWriteEnvFile = false;
    if (shouldRunInit(config)) {
        config = await askQuestions();
        shouldWriteEnvFile = true;
    }

    if (!config.mapStorageUrl) {
        console.error(
            chalk.red(
                "Could not find the map-storage URL. Please provide it using the --mapStorageUrl option in the command line or configure the MAP_STORAGE_URL environment variable.",
            ),
        );
        process.exit(1);
    }
    if (!config.mapStorageApiKey) {
        console.error(
            chalk.red(
                "Could not find the map-storage API key. Please provide it using the --apiKey option in the command line or use the MAP_STORAGE_API_KEY environment variable.",
            ),
        );
        process.exit(1);
    }

    // Create zip file
    const sourceDirectory = "dist";
    const finalDirectory = "dist.zip";
    await createZipDirectory(sourceDirectory, finalDirectory);

    await uploadMap(config);

    if (shouldWriteEnvFile) {
        createEnvsFiles(config);
    }
}

main().catch((err) => console.error(err));
