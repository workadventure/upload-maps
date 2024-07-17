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

const linkForMapStorageInfo = "https://admin.workadventu.re/login";

function shouldRunInit(config: Config) {
    return !(config.mapStorageApiKey || config.uploadDirectory || config.mapStorageUrl);
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
                    throw new Error("Name of the Github Repository not found.");
                }
            } else {
                throw new Error("Invalid Git URL format.");
            }
        } else {
            throw new Error("Git URL is empty or undefined.");
        }
    } catch (error) {
        console.error(chalk.red("Error to find repository name: ", error));
    }
}

// Ask input for users
async function askQuestions(): Promise<Config> {
    console.log("------------------------------------");
    console.log(chalk.green("\nLooks like this is your first time uploading a map! Let's configure the map upload.\n"));
    console.log(
        chalk.bold(
            "Running this command will ask you different parameters, the URL where you're going to upload your map, the upload directory of your map and the API key.",
            "If you don't fill in a dorectory, (by default it will be your github name and your github repository name). If you really want to put your files in at the root of the project you can just enter '/'.",
        ),
    );
    console.log(chalk.yellow("Be careful if you upload with '/' directory, it will delete all the other WAM files.\n"));
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
                console.log(chalk.green("Your map storage URL is valid."));
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

    let uploadDirectory = "";
    const defaultDirectory = getGitRepoName();

    console.log(chalk.green("By default it will be your github name and your github repository name :", defaultDirectory));
    uploadDirectory = prompt(chalk.bold(`Name of directory ? (Press enter to get the default directory) : `));

    if (uploadDirectory === "" || uploadDirectory === undefined) {
        uploadDirectory = defaultDirectory ?? "";
    } else if (uploadDirectory === "/") {
        console.log(chalk.green("Your map will be in the root directory"));
    }

    console.log(chalk.green("Your map will be in the directory:", uploadDirectory));
    console.log("\n------------------------------------");

    return { mapStorageApiKey, uploadDirectory, mapStorageUrl, uploadMode: "MAP_STORAGE" };
}

// Upload function with axios
async function uploadMap(config: Config) {
    console.log("\nYour map is uploading ...");
    console.log("\n------------------------------------\n");
    console.log("CONFIG :", config)

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
            uploadDirectory: config.uploadDirectory,
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
        `\nMAP_STORAGE_URL=${config.mapStorageUrl}\nUPLOAD_DIRECTORY=${config.uploadDirectory}\nUPLOAD_MODE=${config.uploadMode}`,
    );
    fs.writeFileSync(".env.secret", `MAP_STORAGE_API_KEY=${config.mapStorageApiKey}`);
    console.log(chalk.green("Env files created successfully\n"));
    console.log(
        chalk.green(
            "In the future, if you need to change credentials you can now directly edit the .env and .env.secret files.\n",
        ),
    );
}

interface Config {
    mapStorageUrl: string;
    mapStorageApiKey: string;
    uploadDirectory: string;
    uploadMode: string;
}

// Main function
async function main() {
    program
        .option("-k, --mapStorageApiKey <mapStorageApiKey>", "API Key for the map storage")
        .option("-u, --mapStorageUrl <mapStorageUrl>", "URL for the map storage")
        .option("-d, --directory <directory>", "Directory for the map storage")
        .parse(process.argv);

    const options = program.opts();

    dotenv.config();
    dotenv.config({ path: ".env.secret" });

    let config: Config = {
        mapStorageApiKey: (options.mapStorageApiKey as string) || process.env.MAP_STORAGE_API_KEY || "",
        uploadMode: (options.uploadMode as string) || process.env.UPLOAD_MODE || "MAP_STORAGE",
        mapStorageUrl: (options.mapStorageUrl as string) || process.env.MAP_STORAGE_URL || "",
        uploadDirectory: (options.uploadDirectory as string) || process.env.UPLOAD_DIRECTORY || "",
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

    if (!config.uploadDirectory) {
        console.error(
            chalk.red(
                "Could not find the directory or directory name is null. Please provide it using the --directory option in the command line or use the DIRECTORY environment variable.",
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
