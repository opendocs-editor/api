const fs = require("fs");
const path = require("path");

const packageJson_ = fs.readFileSync(
    path.join(__dirname, "../package.json"),
    "utf-8"
);
var packageJson = JSON.parse(packageJson_);

fs.copyFileSync(
    path.join(__dirname, "../package.json"),
    path.join(__dirname, "../package.json.old")
);

var scripts = packageJson.scripts;
const scriptKeys = Object.keys(scripts);

for (var i = 0; i < scriptKeys.length; i++) {
    scripts[scriptKeys[i]] = scripts[scriptKeys[i]].replaceAll(
        "yarn",
        "npm run"
    );
}

packageJson.scripts = scripts;

fs.writeFileSync(
    path.join(__dirname, "../package.json"),
    JSON.stringify(packageJson, null, 4)
);
