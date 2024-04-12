"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.printMsg = function () {
    console.log("This is a message from the demo package");
};
var fs = require("fs");
var archiver = require("archiver");
var dotenv = require("dotenv");
var axios_1 = require("axios");
var promptSync = require("prompt-sync");
var prompt = promptSync();
dotenv.config();
var urlMapStoragedefault = 'http://map-storage.workadventure.localhost/upload';
// Fonction pour créer le dossier zip
function createZipDirectory(sourceDir, outPath) {
    return __awaiter(this, void 0, void 0, function () {
        var archive, stream;
        return __generator(this, function (_a) {
            archive = archiver('zip', { zlib: { level: 9 } });
            stream = fs.createWriteStream(outPath);
            return [2 /*return*/, new Promise(function (resolve, reject) {
                    archive
                        .directory(sourceDir, false)
                        .on('error', function (err) { return reject(err); })
                        .pipe(stream);
                    stream.on('close', function () { return resolve(); });
                    archive.finalize();
                })];
        });
    });
}
// Test pour demander des questions plus facilement
function askQuestions() {
    return __awaiter(this, void 0, void 0, function () {
        var linkForMapStorageDocumentation, linkForMapStorageInfo, apiKey, urlMapStorage, directory;
        return __generator(this, function (_a) {
            linkForMapStorageDocumentation = 'https://github.com/workadventure/workadventure/blob/develop/map-storage/README.md';
            linkForMapStorageInfo = 'https://docs.workadventu.re/map-building/tiled-editor/';
            if (process.env.API_KEY) {
                console.log("API Key found in .env file, you're good to go !");
                apiKey = process.env.API_KEY;
            }
            else {
                while (apiKey === '' || !apiKey || apiKey === undefined) {
                    apiKey = prompt('Please enter your API Key ?');
                    if (apiKey)
                        console.log('Your API Key is :', apiKey);
                }
            }
            console.log("------------------------------------");
            console.log("Now let's set up your map storage URL. If you don't know you can see more details to find it here : ".concat(linkForMapStorageDocumentation, "\nand here ").concat(linkForMapStorageInfo, " ! \nIf you don't put anything it will be by default http://map-storage.workadventure.localhost/upload"));
            console.log("------------------------------------");
            urlMapStorage = prompt("Please enter your URL : ");
            if (urlMapStorage && urlMapStorage !== ' ' && urlMapStorage !== undefined) {
                ;
                console.log('Your map storage URL is :', urlMapStorage);
            }
            else {
                urlMapStorage = urlMapStoragedefault;
                console.log('Your map storage URL is :', urlMapStoragedefault);
            }
            console.log("------------------------------------");
            while (!directory || directory === undefined) {
                directory = prompt('Name of directory ? If null it will be call by default map-user :');
                if (directory) {
                    console.log('Your map will be in the directory :', directory);
                }
                else {
                    directory = 'map-user';
                    console.log('Your map will be in the directory :', directory);
                }
            }
            return [2 /*return*/, { apiKey: apiKey, directory: directory, urlMapStorage: urlMapStorage }];
        });
    });
}
// Fonction pour effectuer l'upload avec axios
function uploadMap(apiKey, urlMapStorage, directory) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, axios_1.default.post(urlMapStorage, {
                        apiKey: apiKey,
                        file: fs.createReadStream('dist.zip'),
                        directory: directory
                    }, {
                        headers: {
                            'Authorization': "Bearer ".concat(apiKey),
                            'Content-Type': 'multipart/form-data'
                        }
                    })];
                case 1:
                    _a.sent();
                    console.log('Upload done successfully');
                    if (!fs.existsSync('.env')) {
                        console.log("Creating .env file...");
                    }
                    createEnvFile(apiKey);
                    return [2 /*return*/];
            }
        });
    });
}
function createEnvFile(apiKey) {
    if (!fs.existsSync('.env')) {
        fs.writeFileSync('.env', "LOG_LEVEL=1\nTILESET_OPTIMIZATION=false\nTILESET_OPTIMIZATION_QUALITY_MIN=0.9\nTILESET_OPTIMIZATION_QUALITY_MAX=1.0\nAPI_KEY=".concat(apiKey));
        console.log('Env file created successfully');
    }
    else {
        if (!fs.readFileSync('.env').includes(apiKey)) {
            fs.appendFileSync('.env', "API_KEY=".concat(apiKey));
            console.log('API Key added to the .env file');
        }
    }
}
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var sourceDirectory, finalDirectory, _a, apiKey, directory, urlMapStorage, err_1;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 6, , 7]);
                    sourceDirectory = 'dist';
                    finalDirectory = 'dist.zip';
                    return [4 /*yield*/, createZipDirectory(sourceDirectory, finalDirectory)];
                case 1:
                    _b.sent();
                    console.log('Directory has been zipped');
                    console.log("------------------------------------");
                    return [4 /*yield*/, askQuestions()];
                case 2:
                    _a = _b.sent(), apiKey = _a.apiKey, directory = _a.directory, urlMapStorage = _a.urlMapStorage;
                    console.log("Your API Key is: ".concat(apiKey));
                    console.log("Your map will be inside the directory : ".concat(directory));
                    console.log("You're url of map storage is : ".concat(urlMapStorage));
                    if (!(apiKey && urlMapStorage && directory)) return [3 /*break*/, 4];
                    return [4 /*yield*/, uploadMap(apiKey, urlMapStorage, directory)];
                case 3:
                    _b.sent();
                    return [3 /*break*/, 5];
                case 4:
                    console.log("You need to provide an API Key and you're on the default URL : http://map-storage.workadventure.localhost/upload");
                    _b.label = 5;
                case 5: return [3 /*break*/, 7];
                case 6:
                    err_1 = _b.sent();
                    console.error('ERROR DE OUF :', err_1);
                    return [3 /*break*/, 7];
                case 7: return [2 /*return*/];
            }
        });
    });
}
main();
