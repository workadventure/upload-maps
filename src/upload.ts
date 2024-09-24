#!/usr/bin/env node

import * as fs from "fs";
import archiver from "archiver";
import * as dotenv from "dotenv";
import promptSync from "prompt-sync";
import axios, { isAxiosError } from "axios";
import { Command } from "commander";
import chalk from "chalk";
import { execSync } from "child_process";

const program = new Command();

const prompt = promptSync();

const linkForMapStorageInfo = "https://admin.workadventu.re";

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
                    console.log(chalk.red(`Error: ${err.message}\n`));
                }
            }
            return false;
        }
    } else {
        console.log("Please provide a valid URL.");
        return false;
    }
}

function getGitRepoName() {
    try {
        const gitUrl = execSync("git config --get remote.origin.url").toString().trim();
        if (gitUrl !== "" && gitUrl !== undefined) {
            const repoPath = gitUrl.split(":")[1];
            if (repoPath) {
                const repoName = repoPath.replace(".git", "").replace("/", "-");
                if (repoName) {
                    return repoName;
                } else {
                    console.log(chalk.red("Error finding the repository name."));
                }
            } else {
                console.log(chalk.red("Error finding the repository name."));
            }
        } else {
            console.log(chalk.red("Error finding the repository name."));
        }
    } catch (error) {
        console.log(chalk.red("Error finding the repository name."));
    }
}

// Ask input for users
async function askQuestions(): Promise<Config> {
    console.log("------------------------------------");
    console.log(chalk.green("\nLooks like this is your first time uploading a map! Let's configure the Map upload.\n"));
    console.log(
        chalk.bold(
            "Running this command will ask you different parameters, the URL where you're going to upload your map, the API key and a directory to upload files.",
            "If you don't fill-in a directory, the default will be your Github pseudo and your Github repository name). If you really want to put your files at the root of the project you can just enter '/'.",
        ),
    );
    console.log(
        chalk.yellow("Be careful though, if you upload with '/' directory, it will delete all the other WAM files.\n"),
    );
    console.log(chalk.bold("How it works ?\n"));
    console.log(" 1. First your map files are going to be built\n");
    console.log(" 2. The scripts of your map are compiled and bundled\n");
    console.log(" 3. The result of the build is written in the dist directory\n");
    console.log(" 4. The content of the public directory is copied to the dist directory\n");
    console.log(
        " 5. A ZIP file of the dist directory is created and sent to the WorkAdventure 'map-storage' server.\n",
    );
    console.log(
        chalk.yellow(
            " !!! Caution, the WorkAdventure server only stores the built files (from the \"dist\" directory). You cannot get back your original files from the WorkAdventure server, so make sure to keep those in a safe place. If you want to modify the map just modify the source files and run the command 'npm run upload' again.\n",
        ),
    );
    console.log("------------------------------------");

    console.log(chalk.blue(`\nNow let's set up the configuration.\n`));
    console.log(
        chalk.blue(
            `If you don't know how to find your map storage URL, you can find it in your admin account: ${linkForMapStorageInfo} !\n`,
        ),
    );
    console.log("-\n");
    let mapStorageUrl = "";
    while (!mapStorageUrl) {
        mapStorageUrl = prompt(chalk.bold(`Please enter your Map storage URL: `));
        if (mapStorageUrl) {
            if (await checkMapStorageUrl(mapStorageUrl)) {
                console.log("You entered: " + chalk.green("'" + mapStorageUrl + "'"));
            } else {
                mapStorageUrl = "";
            }
        } else {
            console.log(chalk.red("A URL is required to upload your map."));
        }
    }
    console.log("\n-\n");

    let mapStorageApiKey = "";
    while (!mapStorageApiKey) {
        mapStorageApiKey = prompt(chalk.bold("Please enter your API Key: "));
        if (mapStorageApiKey) {
            console.log("You entered: " + chalk.green("'" + mapStorageApiKey + "'"));
            console.log("\n-\n");
        }
    }

    let directory = "";
    const defaultDirectory = getGitRepoName();

    if (defaultDirectory === undefined || defaultDirectory === "") {
        directory = prompt(
            chalk.bold(
                `Upload directory: You don't have a Github repository so choose a directory name (Default is 'maps'):`,
            ),
        );
        if (directory.trim() === "" || directory === undefined) {
            directory = "maps";
        } else if (directory === "/") {
            console.log(chalk.yellow("Your map files will be stored in the root directory."));
        }
    } else {
        console.log(
            chalk.green("By default it will be your Github pseudo and your Github repository name:", defaultDirectory),
        ),
            (directory = prompt(chalk.bold(`Upload directory (Press enter to get the default directory): `)));
        if (directory.trim() === "" || directory === undefined) {
            directory = defaultDirectory;
        } else if (directory === "/") {
            console.log(chalk.yellow("Your map files will be stored in the root directory."));
        }
    }
    console.log("You entered: " + chalk.green("'" + directory + "'"));
    console.log("\n------------------------------------");
    return { mapStorageApiKey, directory, mapStorageUrl, uploadMode: "MAP_STORAGE" };
}

// Upload function with axios
async function uploadMap(config: Config) {
    console.log(chalk.bold("\nYour map is uploading..."));
    console.log("\n------------------------------------\n");

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

    console.log(chalk.green.bold("Map files uploaded successfully!"));
    console.log("\n------------------------------------\n");
}

// Function to create the .env files
function createEnvsFiles(config: Config) {
    fs.appendFileSync(".env", `\nMAP_STORAGE_URL=${config.mapStorageUrl}\nUPLOAD_DIRECTORY=${config.directory}\n`);
    fs.writeFileSync(".env.secret", `MAP_STORAGE_API_KEY=${config.mapStorageApiKey}`);
    console.log(chalk.green("Env files created successfully.\n"));
    console.log(
        chalk.green(
            "If you need to manually change the credentials, you can now edit the .env and .env.secret files.\n",
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
        .option("-u, --mapStorageUrl <mapStorageUrl>", "URL for the Map storage")
        .option("-k, --mapStorageApiKey <mapStorageApiKey>", "API Key")
        .option("-d, --directory <directory>", "Directory for the Map storage")
        .parse(process.argv);

    const options = program.opts();

    dotenv.config();
    dotenv.config({ path: ".env.secret" });

    let config: Config = {
        mapStorageApiKey: (options.mapStorageApiKey as string) || process.env.MAP_STORAGE_API_KEY || "",
        uploadMode: (options.uploadMode as string) || process.env.UPLOAD_MODE || "MAP_STORAGE",
        mapStorageUrl: (options.mapStorageUrl as string) || process.env.MAP_STORAGE_URL || "",
        directory: (options.directory as string) || process.env.UPLOAD_DIRECTORY || "",
    };

    let shouldWriteEnvFile = false;
    if (shouldRunInit(config)) {
        if (process.stdout.isTTY) {
            config = await askQuestions();
        }
        shouldWriteEnvFile = true;
    }

    let stopOnError = false;

    if (!config.mapStorageUrl) {
        console.error(
            chalk.red(
                "Could not find the map-storage URL. Please provide it using the --mapStorageUrl option in the command line or configure the MAP_STORAGE_URL environment variable.",
            ),
        );
        stopOnError = true;
    }

    if (!config.mapStorageApiKey) {
        console.error(
            chalk.red(
                "Could not find the map-storage API key. Please provide it using the --apiKey option in the command line or use the MAP_STORAGE_API_KEY environment variable.",
            ),
        );
        stopOnError = true;
    }

    if (!config.directory) {
        console.error(
            chalk.red(
                "Could not find the directory or directory name is null. Please provide it using the --directory option in the command line or use the UPLOAD_DIRECTORY environment variable.",
            ),
        );
        stopOnError = true;
    }

    if (stopOnError) {
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
