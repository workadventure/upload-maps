# 🚀 Map Upload package for WorkAdventure

<a href="https://discord.gg/G6Xh9ZM9aR" target="blank"><img src="https://img.shields.io/discord/821338762134290432.svg?style=flat&label=Join%20Community&color=7289DA" alt="Join Community Badge"/></a>
<a href="https://x.com/workadventure_" target="blank"><img src="https://img.shields.io/twitter/follow/workadventure_.svg?style=social" /></a>
![visitors](https://vbr.nathanchung.dev/badge?page_id=workadventure.upload-maps&color=00cf00)

This package is designed to help you upload maps to the map storage of [WorkAdventure](https://workadventu.re/).

## 🔧 Installation

To install this package, use the following command:

```bash
npm install @workadventure/upload-maps
```

## 📄 Usage

This guide will walk you through the process of uploading your custom map to the map storage. You can also refer to the [WorkAdventure documentation](https://docs.workadventu.re/map-building/tiled-editor/publish/wa-hosted/) for more details.

To use this package, import it into your project and run the command in your terminal:

```bash
npm run upload
```

It will ask you a few questions:

1. **Map Storage URL** (stored in `MAP_STORAGE_URL` in the *.env* file)

   > *For SaaS users, you can find it in the [admin panel](https://admin.workadventu.re) under Developers -> API keys / Zapier.*

2. **API Key** (stored in `MAP_STORAGE_API_KEY` in the *.env.secret* file)

   > *For SaaS users, you can generate this in the admin panel, under Developers -> API keys / Zapier.*

3. **Upload Directory** (stored in `UPLOAD_DIRECTORY` in the *.env* file)

   > *If you have GitHub and forked the repository, the directory will default to your GitHub username and repository name. Otherwise, specify a custom name.*

Alternatively, you can use flags to upload your map, though the secret variables won't be saved in the `.env` or `.env.secret` files. Available flags include:

- `-u`: Map storage URL
- `-k`: API Key
- `-d`: Upload directory

Example:

```bash
npm run upload -- -u your-map-storage-url -k your-api-key -d your-directory
```

After answering these questions, the script will start to upload your maps. You need to see something like this at the end: `Upload done successfully!`.

## 🛠️ How it works

When you run `npm run upload`, the following steps are executed:

1. **Build Phase**:
   - Tilesets are optimized and chunked, removing any unused tiles.
   - Scripts in the map are compiled (from TypeScript to JavaScript) and bundled into a single file.
   - The result is written in the `dist` directory.
   - The `public` directory content is copied to the `dist` directory.

2. **Upload Phase**:
   - A ZIP file of the `dist` directory is created and sent to the **WorkAdventure** map-storage server.
   - The server unzips and stores the files in your configured directory, creating `.wam` files for each `.tmj` file if needed.
  
> [!TIP]
> You can skip the build phase and only upload the current state of your project with the command: `npm run upload-only`

> [!WARNING]
> The **WorkAdventure** server only stores the *built* map you upload. It does not store your original files. To update your map, make sure to keep the original files locally. If you need to make changes, update your files and run the upload command again.

## ❓ Need Help

If you have any questions or need further assistance, don't hesitate to ask either by [email](mailto:hello@workadventu.re) or [Discord](https://discord.gg/G6Xh9ZM9aR)!
