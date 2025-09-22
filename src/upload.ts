#!/usr/bin/env node

import * as fs from "fs";
import archiver from "archiver";
import * as dotenv from "dotenv";
import promptSync from "prompt-sync";
import axios, { isAxiosError } from "axios";
import { Command } from "commander";
import chalk from "chalk";
import { execSync } from "child_process";
import { MapValidationErrors } from "./ValidationError.js";

const program = new Command();

const prompt = promptSync();

const linkForMapStorageInfo = "https://admin.workadventu.re";

function shouldRunInit(config: Config) {
    return !(config.mapStorageApiKey || config.directory || config.mapStorageUrl);
}

// Function to create the zip folder
async function createZipDirectory(sourceDir: string, outPath: string) {
    const archive = archiver("zip", { zlib: { level: 9 } });
    const stream = fs.createWriteStream(outPath);

    return new Promise<void>((resolve, reject) => {
        archive
            .directory(sourceDir, false)
            .on("error", (err) => {
                const errorMessage = err instanceof Error ? err.message : String(err);
                console.error(chalk.red.bold(`Failed to create zip file: ${errorMessage}\n`));
                console.error(chalk.magenta(`Source directory: ${sourceDir}`));
                console.error(chalk.magenta(`Output file: ${outPath}`));

                if (err instanceof Error && err.stack) {
                    console.error(chalk.gray("Stack trace:"));
                    console.error(chalk.gray(err.stack));
                }

                reject(err);
            })
            .pipe(stream);

        stream.on("close", () => resolve());
        stream.on("error", (err) => {
            const errorMessage = err instanceof Error ? err.message : String(err);
            console.error(chalk.red.bold(`Failed to write zip file: ${errorMessage}\n`));
            console.error(chalk.magenta(`Output file: ${outPath}`));
            console.error(chalk.yellow("Check write permissions and disk space"));

            reject(err);
        });

        archive.finalize().catch((e) => {
            const errorMessage = e instanceof Error ? e.message : String(e);
            console.error(chalk.red.bold(`Failed to finalize zip archive: ${errorMessage}\n`));
            console.error(chalk.magenta(`Source directory: ${sourceDir}`));

            reject(e);
        });
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
                } else if (status === 404) {
                    console.log(chalk.red("Server not found: The map storage URL you provided does not exist.\n"));

                    console.log(
                        chalk.italic(
                            `Find your correct server URL in your WorkAdventure admin panel: ${linkForMapStorageInfo}\n`,
                        ),
                    );
                } else if (err.code === "ENOTFOUND" || err.code === "ECONNREFUSED") {
                    console.log(chalk.red("Connection failed: Cannot reach the map storage server.\n"));
                    console.log(chalk.yellow("What you need to do:"));
                    console.log(chalk.yellow("1. Check your internet connection"));
                    console.log(chalk.yellow("2. Verify the server URL is correct and accessible"));
                    console.log(
                        chalk.yellow("3. Make sure the server is not down (try opening the URL in your browser)"),
                    );
                } else {
                    console.log(chalk.red("Invalid URL. Please provide a valid URL.\n"));
                    const errorMessage = err instanceof Error ? err.message : String(err);
                    console.log(chalk.red(`Error: ${errorMessage}\n`));
                    console.log(
                        chalk.italic(
                            `You can find more information on where to find this URL here : ${linkForMapStorageInfo}\n`,
                        ),
                    );
                }
            } else {
                console.log(chalk.red("Network error: Cannot connect to the map storage server.\n"));
                console.log(chalk.yellow("What you need to do:"));
                console.log(chalk.yellow("1. Check your internet connection"));
                console.log(chalk.yellow("2. Verify the server URL format (should start with https:// or http://)"));
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
                console.log(chalk.yellow("Repository path detection: Your Git remote URL format is not recognized."));
                console.log(
                    chalk.yellow(
                        "This won't prevent the upload, you'll just need to choose a directory name manually.",
                    ),
                );
            }
        } else {
            console.log(chalk.red("Error finding the repository name."));
        }
    } catch (error) {
        console.log(chalk.red("Error finding the repository name."));
    }
}

// Ask input for users
async function askQuestions(config: Config): Promise<Config> {
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
            console.log(
                chalk.yellow("Please enter a valid map storage URL (it should start with https:// or http://)"),
            );
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
        (console.log(
            chalk.green("By default it will be your Github pseudo and your Github repository name:", defaultDirectory),
        ),
            (directory = prompt(chalk.bold(`Upload directory (Press enter to get the default directory): `))));
        if (directory.trim() === "" || directory === undefined) {
            directory = defaultDirectory;
        } else if (directory === "/") {
            console.log(chalk.yellow("Your map files will be stored in the root directory."));
        }
    }
    console.log("You entered: " + chalk.green("'" + directory + "'"));
    console.log("\n------------------------------------");
    return { mapStorageApiKey, directory, mapStorageUrl, uploadMode: "MAP_STORAGE", verbose: config.verbose };
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

    try {
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
    } catch (err) {
        if (isAxiosError(err)) {
            console.error(chalk.red.bold("An error occurred while uploading the map.\n"));
            if (err.response) {
                const status = err.response.status;

                if (status === 400) {
                    const dataParse = MapValidationErrors.safeParse(err.response.data);

                    if (!dataParse.success) {
                        console.error(chalk.yellow("The server rejected the map (Error 400 - Bad Request).\n"));
                        console.error(chalk.yellow("Could not read response details.\n"));
                        if (config.verbose && err.response.data) {
                            dumpResponseData(err.response.data);
                        }
                    } else {
                        const data = dataParse.data;

                        console.error(chalk.yellow("The server rejected the map (Error 400 - Bad Request).\n"));

                        console.error(chalk.yellow("The server reported issues with the following files:\n"));
                        Object.entries(data).forEach(([fileName, errorsByType], index) => {
                            console.error(chalk.red(`${index + 1}. File: ${chalk.bold(fileName)}`));

                            for (const [errorType, errors] of Object.entries(errorsByType)) {
                                console.error(chalk.yellow(` Issues with ${errorType}  (${errors.length}):`));
                                errors.forEach((error, i: number) => {
                                    console.error(chalk.yellow(`     ${i + 1}. ${error.message}`));
                                    if (error.details && error.details.trim() !== "") {
                                        console.error(chalk.yellow(`Details: ${error.details}`));
                                    }
                                    if (error.link) {
                                        console.error(chalk.yellow(`More info: ${error.link}`));
                                    }
                                });
                            }
                        });
                        if (config.verbose && err.response.data) {
                            dumpResponseData(err.response.data);
                        }
                    }
                } else if (status === 401 || status === 403) {
                    console.error(
                        chalk.yellow(
                            "Authentication failed. Please check that your API Key is correct and has not expired.",
                        ),
                    );
                } else if (status === 413) {
                    console.error(chalk.red("File too large: Your map files exceed the server's size limit.\n"));
                    if (config.verbose && err.response.data) {
                        dumpResponseData(err.response.data);
                    }
                } else if (status === 500) {
                    console.error(chalk.red("Server error: The map storage server encountered an internal error.\n"));
                    if (config.verbose && err.response.data) {
                        dumpResponseData(err.response.data);
                        console.error(chalk.red(err.response.data));
                    }
                } else {
                    console.error(chalk.yellow(`The server returned an unexpected error: ${status}`));

                    // Afficher les détails pour tout autre code d'erreur
                    if (err.response.data) {
                        console.error(chalk.yellow("Error details:"));
                        console.error(chalk.red(err.response.data));
                    }
                }
            } else if (err.code === "ECONNREFUSED") {
                console.error(chalk.red("Connection refused: Cannot connect to the map storage server.\n"));
                console.error(chalk.yellow("What you need to do:"));
                console.error(chalk.yellow("1. Check your internet connection"));
                console.error(chalk.yellow("2. Verify the Map Storage URL is correct"));
                console.error(chalk.yellow("3. Try accessing the URL in your web browser to test connectivity"));
            } else if (err.code === "ENOTFOUND") {
                console.error(chalk.red("Server not found: The map storage server address cannot be reached.\n"));
            } else if (err.code === "ETIMEDOUT") {
                console.error(chalk.red("Upload timeout: The server took too long to respond.\n"));
            } else {
                console.error(chalk.yellow("An unknown network error occurred. Please try again."));
                if (err.message) {
                    console.error(chalk.red(`Network error details: ${err.message}`));
                }
            }
        } else {
            console.error(chalk.red.bold("An unexpected error occurred:"));
            if (err instanceof Error) {
                console.error(chalk.yellow(err.message));
                if (err.stack) {
                    console.error(chalk.gray("Stack trace:"));
                    console.error(chalk.gray(err.stack));
                }
            } else {
                console.error(chalk.yellow(String(err)));
            }
        }
        process.exit(1);
    }
    console.log("\n------------------------------------\n");
}

interface Config {
    mapStorageUrl: string;
    mapStorageApiKey: string;
    directory: string;
    uploadMode: string;
    verbose: boolean;
}

// Function to create the .env files
function createEnvsFiles(config: Config) {
    try {
        try {
            fs.appendFileSync(
                ".env",
                `\nMAP_STORAGE_URL=${config.mapStorageUrl}\nUPLOAD_DIRECTORY=${config.directory}\n`,
            );
        } catch (envError) {
            const errorMessage = envError instanceof Error ? envError.message : String(envError);
            console.error(chalk.red.bold(`Failed to create/update .env file: ${errorMessage}\n`));
            console.error(chalk.magenta(`File: ${process.cwd()}/.env`));
            console.error(chalk.yellow("Check write permissions for the .env file in your project root"));

            if (envError instanceof Error) {
                if (errorMessage.includes("EACCES")) {
                    console.error(chalk.red(`\nSpecific issue: Permission denied for file: ${process.cwd()}/.env`));
                    console.error(
                        chalk.yellow("Try: chmod 644 .env (on Mac/Linux) or check file properties (on Windows)"),
                    );
                } else if (errorMessage.includes("ENOSPC")) {
                    console.error(chalk.red("\nSpecific issue: No space left on device."));
                    console.error(chalk.yellow("Free up disk space in your project directory"));
                } else if (errorMessage.includes("ENOENT")) {
                    console.error(chalk.red(`\nSpecific issue: Cannot access directory: ${process.cwd()}`));
                    console.error(chalk.yellow("Make sure you're in the correct project directory"));
                } else if (errorMessage.includes("EISDIR")) {
                    console.error(chalk.red(`\nSpecific issue: .env exists but is a directory, not a file`));
                    console.error(chalk.yellow("Remove the .env directory and try again"));
                }
            }

            try {
                if (fs.existsSync(".env")) {
                    const stats = fs.statSync(".env");
                    console.error(chalk.cyan(`\nCurrent .env file info:`));
                    console.error(chalk.cyan(`  Size: ${stats.size} bytes`));
                    console.error(chalk.cyan(`  Permissions: ${stats.mode.toString(8)}`));
                    console.error(chalk.cyan(`  Last modified: ${stats.mtime.toString()}`));
                } else {
                    console.error(chalk.cyan(`\nFile status: .env does not exist (will be created)`));
                }
            } catch (statError) {
                console.error(chalk.gray(`Could not get file info:`), statError);
            }

            throw envError;
        }

        try {
            fs.writeFileSync(".env.secret", `MAP_STORAGE_API_KEY=${config.mapStorageApiKey}`);
        } catch (secretError) {
            const errorMessage = secretError instanceof Error ? secretError.message : String(secretError);
            console.error(chalk.red.bold(`Failed to create .env.secret file: ${errorMessage}\n`));
            console.error(chalk.magenta(`File: ${process.cwd()}/.env.secret`));
            console.error(chalk.yellow("Check write permissions for the .env.secret file in your project root"));

            if (secretError instanceof Error) {
                if (errorMessage.includes("EACCES")) {
                    console.error(
                        chalk.red(`\nSpecific issue: Permission denied for file: ${process.cwd()}/.env.secret`),
                    );
                    console.error(
                        chalk.yellow("Try: chmod 644 .env.secret (on Mac/Linux) or check file properties (on Windows)"),
                    );
                } else if (errorMessage.includes("ENOSPC")) {
                    console.error(chalk.red("\nSpecific issue: No space left on device."));
                    console.error(chalk.yellow("Free up disk space in your project directory"));
                } else if (errorMessage.includes("ENOENT")) {
                    console.error(chalk.red(`\nSpecific issue: Cannot access directory: ${process.cwd()}`));
                    console.error(chalk.yellow("Make sure you're in the correct project directory"));
                } else if (errorMessage.includes("EISDIR")) {
                    console.error(chalk.red(`\nSpecific issue: .env.secret exists but is a directory, not a file`));
                    console.error(chalk.yellow("Remove the .env.secret directory and try again"));
                }
            }

            try {
                if (fs.existsSync(".env.secret")) {
                    const stats = fs.statSync(".env.secret");
                    console.error(chalk.cyan(`\nCurrent .env.secret file info:`));
                    console.error(chalk.cyan(`  Size: ${stats.size} bytes`));
                    console.error(chalk.cyan(`  Permissions: ${stats.mode.toString(8)}`));
                    console.error(chalk.cyan(`  Last modified: ${stats.mtime.toString()}`));
                } else {
                    console.error(chalk.cyan(`\nFile status: .env.secret does not exist (will be created)`));
                }
            } catch (statError) {
                console.error(chalk.gray(`Could not get file info: `), statError);
            }

            throw secretError;
        }

        console.log(chalk.green("Environment files created successfully:\n"));
        console.log(chalk.green(`✓ ${process.cwd()}/.env`));
        console.log(chalk.green(`✓ ${process.cwd()}/.env.secret`));
        console.log(
            chalk.green(
                "If you need to manually change the credentials, you can now edit the .env and .env.secret files.\n",
            ),
        );
    } catch (error) {
        // Gestion d'erreur générale
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(chalk.red.bold(`Failed to create environment files: ${errorMessage}\n`));
        console.error(chalk.yellow("Check write permissions in your project directory"));
        throw error;
    }
}

function dumpResponseData(data: unknown) {
    console.error(chalk.yellow("Error returned:"));
    if (typeof data === "string") {
        console.error(chalk.red(data));
    } else {
        console.error(chalk.red(JSON.stringify(data, null, 2)));
    }
}

function isValidUrl(url: string): boolean {
    try {
        new URL(url);
        return true;
    } catch {
        return false;
    }
}

// Main function
async function main() {
    program
        .option("-u, --mapStorageUrl <mapStorageUrl>", "URL for the Map storage")
        .option("-k, --mapStorageApiKey <mapStorageApiKey>", "API Key")
        .option("-d, --directory <directory>", "Directory for the Map storage")
        .option("-v, --verbose", "Verbose output")
        .parse(process.argv);

    const options = program.opts();

    dotenv.config();
    dotenv.config({ path: ".env.secret" });

    let config: Config = {
        mapStorageApiKey: (options.mapStorageApiKey as string) || process.env.MAP_STORAGE_API_KEY || "",
        uploadMode: (options.uploadMode as string) || process.env.UPLOAD_MODE || "MAP_STORAGE",
        mapStorageUrl: (options.mapStorageUrl as string) || process.env.MAP_STORAGE_URL || "",
        directory: (options.directory as string) || process.env.UPLOAD_DIRECTORY || "",
        verbose: !!options.verbose || false,
    };

    let shouldWriteEnvFile = false;
    if (shouldRunInit(config)) {
        if (process.stdout.isTTY) {
            config = await askQuestions(config);
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
    } else if (!isValidUrl(config.mapStorageUrl)) {
        console.error(
            chalk.red(
                `The map-storage URL "${config.mapStorageUrl}" is not a valid URL. Please check your .env file or the --mapStorageUrl argument.`,
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
        console.error(chalk.yellow("What you need to do:"));
        console.error(chalk.yellow("1. Use the --mapStorageApiKey option when running this command"));
        console.error(chalk.yellow("2. Or add MAP_STORAGE_API_KEY to your .env.secret file"));
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

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
