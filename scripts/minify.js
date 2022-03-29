const fs = require("fs");
const path = require("path");
const minify = require("@node-minify/core");
const gcc = require("@node-minify/google-closure-compiler");
const AdmZip = require("adm-zip");
const tar = require("tar");

const folder = path.join(__dirname, "../dist");
const minFolder = path.join(__dirname, "../min");

if (!fs.existsSync(folder)) {
    console.error("Try running build first!");
    process.exit(0);
}

if (!fs.existsSync(minFolder)) fs.mkdirSync(minFolder);

async function main() {
    console.log("Reading files...");
    const files_ = fs.readdirSync(folder);
    const files = [];
    for (var i = 0; i < files_.length; i++) {
        if (files_[i].endsWith(".js") && !files_[i].includes(".min"))
            files.push(files_[i]);
    }
    for (var i = 0; i < files.length; i++) {
        console.log(
            `[${i + 1}/${files.length}] Minifying ${files[i]} to ${files[i]}...`
        );
        try {
            await minify({
                compressor: gcc,
                input: folder + "/" + files[i],
                output: minFolder + "/" + files[i],
                options: {
                    createSourceMap: true,
                    compilationLevel: "WHITESPACE_ONLY",
                    languageIn: "STABLE",
                    languageOut: "STABLE",
                },
            });
        } catch (e) {
            console.error("An error occured: \n" + e);
            process.exit(1);
        }
        fs.copyFileSync(
            folder + "/" + files[i].replace(".js", ".d.ts"),
            minFolder + "/" + files[i].replace(".js", ".d.ts")
        );
        const mapContent = JSON.parse(
            fs.readFileSync(
                minFolder + "/" + files[i].replace(".js", ".js.map")
            )
        );
        mapContent.file = files[i];
        fs.writeFileSync(
            minFolder + "/" + files[i].replace(".js", ".js.map"),
            JSON.stringify(mapContent)
        );
        console.log(
            `Generated:\n  - min/${files[i]}\n  - min/${files[i].replace(
                ".js",
                ".js.map"
            )}\n  - min/${files[i].replace(".js", ".d.ts")}`
        );
    }
    if (!fs.existsSync(path.join(__dirname, "../out")))
        fs.mkdirSync(path.join(__dirname, "../out"));
    console.log("Creating zip archive...");
    try {
        const zip = AdmZip();
        const out = "out/build.zip";
        await zip.addLocalFolderPromise("./dist", { zipPath: "/dist" });
        await zip.addLocalFolderPromise("./min", { zipPath: "/min" });
        zip.addLocalFile("./package.json");
        await zip.writeZipPromise(out);
    } catch (e) {
        console.log("An error occured: \n" + e);
        process.exit(0);
    }
    console.log("Generated:\n  - build.zip");
    console.log("Creating tar archive...");
    try {
        await tar.c({ gzip: true, file: "out/build.tgz" }, [
            "dist",
            "min",
            "package.json",
        ]);
        await tar.c({ gzip: true, file: "out/build.tar.gz" }, [
            "dist",
            "min",
            "package.json",
        ]);
    } catch (e) {
        console.log("An error occured: \n" + e);
        process.exit(0);
    }
    fs.rmSync(path.join(__dirname, "../dist"), {
        recursive: true,
        force: true,
    });
    fs.rmSync(path.join(__dirname, "../min"), { recursive: true, force: true });
    fs.renameSync(
        path.join(__dirname, "../out"),
        path.join(__dirname, "../dist")
    );
    console.log("Generated:\n  - build.tgz");
    console.log("Completed!");
    process.exit(0);
}

main();
