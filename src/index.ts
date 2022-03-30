import express from "express";
import http from "http";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import useAuth from "@opendocs-editor/authlib";
import { InsertOneResult, MongoClient } from "mongodb";
import { Nodehun } from "nodehun";
import fs from "fs";
import path from "path";
import SegfaultHandler from "segfault-handler";
import * as uuid from "uuid";
import fileUpload from "express-fileupload";
import {
    authorizePromise,
    getCredentials,
    getNewToken,
    OAuth2Credentials,
    setCode,
} from "./google";
import { google } from "googleapis";
import jwt from "jsonwebtoken";
import axios from "axios";

SegfaultHandler.registerHandler("crash.log");

const lang = "en";
const affix = fs.readFileSync(
    path.join(__dirname, `../dictionaries/${lang}/index.aff`)
);
const dict = fs.readFileSync(
    path.join(__dirname, `../dictionaries/${lang}/index.dic`)
);
const nodehun = new Nodehun(affix, dict);

export interface UserObject {
    name?: string;
    username?: string;
    email?: string;
    pwhash?: string;
    pwsalt?: string;
}

const app = express();
const port = process.env.PORT || 4502;

const servlet = http.createServer(app);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(fileUpload({}));

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "../views"));

const dbclient = new MongoClient(
    `mongodb://${process.env.MONGODB_HOST || "localhost"}:${
        process.env.MONGODB_PORT || 27017
    }/opendocs_api_testing`
);

const main = async () => {
    try {
        // Database connection
        await dbclient.connect();
        console.log("Connected to database!");

        // Auth
        await useAuth(
            app,
            "opendocs_proxy_test",
            {
                host: process.env.MONGODB_HOST || "localhost",
                port: parseInt(process.env.MONGODB_PORT || "27017"),
            },
            {
                jwtSecret:
                    process.env.JWT_SECRET ||
                    "dcwhepoiajirnd23dalk32jkui902iij",
            }
        );

        // Save
        app.post("/api/v1/editor/save", async (req, res) => {
            const content = req.body._3ditor_content;
            const documentId = uuid.v4();
            const col = dbclient
                .db("opendocs_api_testing")
                .collection("documents");
            const r = await col.insertOne({
                documentId: documentId,
                content: content,
            });
            res.send(await col.findOne({ _id: r.insertedId }));
        });

        // Save
        app.post("/api/v1/editor/saveover", async (req, res) => {
            const content = req.body._3ditor_content;
            const documentId = req.body._3ditor_doc_id;
            const col = dbclient
                .db("opendocs_api_testing")
                .collection("documents");
            const r = await col.findOne({ documentId: documentId });
            let r_: InsertOneResult<Document>;
            if (r) {
                await col.deleteOne({ documentId: documentId });
                r_ = await col.insertOne({
                    documentId: documentId,
                    content: content,
                });
            } else {
                r_ = await col.insertOne({
                    documentId: documentId,
                    content: content,
                });
            }
            res.send(await col.findOne({ _id: r_.insertedId }));
        });

        // Get document
        app.get("/api/v1/editor/document/:docid", async (req, res) => {
            const col = dbclient
                .db("opendocs_api_testing")
                .collection("documents");
            const r = await col.findOne({ documentId: req.params.docid });
            if (r) return res.send(r);
            return res.send({});
        });

        // Export to word
        app.get("/api/v1/editor/export/word", async (req, res) => {
            const content = req.query.content?.toString();
            if (!content)
                return res
                    .status(400)
                    .end("Invalid request. Missing parameters: [content]");
            // const doc = await docx.asBlob(atob(decodeURIComponent(content)));
            const doc = "";
            res.type(
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            );
            res.setHeader(
                "Content-disposition",
                "attachment; filename=document.docx"
            );
            res.send(doc);
        });

        // Authorize
        app.post("/api/v1/editor/google/auth", async (req, res) => {
            const credentials: OAuth2Credentials = {
                client_id: req.body.client_id,
                client_secret: req.body.client_secret,
                redirect_uris: [req.body.redirect_uri],
            };
            const d = await authorizePromise(credentials);
            res.send({ url: d });
        });

        // Token
        app.post("/api/v1/editor/google/token", async (req, res) => {
            console.log("Getting token (2)...");
            const t = await getNewToken("tokens.json");
            res.send(t);
        });

        // Authorize
        app.get("/api/v1/editor/googledocs/authorize", async (req, res) => {
            const oauth2Credentials = getCredentials();
            const oauth2Client = new google.auth.OAuth2(
                oauth2Credentials.client_id,
                oauth2Credentials.client_secret,
                oauth2Credentials.redirect_uris[0]
            );
            if (req.query.error) {
                return res
                    .type("text/html")
                    .send("<script>window.close();</script>");
            } else {
                console.log("Setting code...");
                setCode(req.query.code?.toString() || "");
                await axios.get("https://docs.nosadnile.net/complete_auth");
                console.log("Getting token...");
                oauth2Client.getToken(
                    req.query.code?.toString() || "",
                    async function (err, token) {
                        if (err)
                            return res
                                .type("text/html")
                                .send("<script>window.close();</script>");

                        res.cookie(
                            "jwt",
                            jwt.sign(
                                token || {},
                                "jguhfkdgghjhbjgsdgjgjhdghsjaghjdjas" // replace this before going into production
                            )
                        );

                        return res
                            .type("text/html")
                            .send("<script>window.close();</script>");
                    }
                );
            }
        });

        // Spellchecker
        app.post("/api/v1/editor/spellchecker/check", async (req, res) => {
            console.log(
                `\x1b[46m\x1b[30m SPELLCHECK \x1b[0m \x1b[42m\x1b[30m INFO \x1b[0m Recieved spellcheck request!      { Language: ${
                    req.body.lang || "en"
                }, Method: ${req.body.method || "spellcheck"} }`
            );
            if (req.body.method == "addtodictionary") {
                nodehun.add(req.body.text);
                console.log(
                    `\x1b[46m\x1b[30m SPELLCHECK \x1b[0m \x1b[42m\x1b[30m INFO \x1b[0m Responding to spellcheck request! { Added: ${
                        req.body.text || ""
                    } }`
                );
                return res.send({ success: true });
            }
            const words: string[] = req.body.text.split(" ");
            const incorrect: { [key: string]: string[] } = {};
            for (let i = 0; i < words.length; i++) {
                const word = words[i].replace(
                    /(?:\!|\/|\\|\{|\}|\)|\(|\.|\,|\@|\#|\$|\%|\^|\&|\*|\[|\]|\;|\:|\'|\"|\<|\>|\?|\`|\~|\=|\+|\-|\_|\n|\r)/gm,
                    ""
                );
                let suggestions: string[] | null = [];
                try {
                    suggestions = await nodehun.suggest(word);
                } catch (e) {
                    continue;
                }
                if (suggestions) incorrect[word] = suggestions;
            }
            console.log(
                `\x1b[46m\x1b[30m SPELLCHECK \x1b[0m \x1b[42m\x1b[30m INFO \x1b[0m Responding to spellcheck request! { Incorrect: ${
                    Object.keys(incorrect).length || 0
                } }`
            );
            res.send({ words: incorrect });
        });
    } catch (err) {
        console.log(err);
        app.get("/api", (req, res) => {
            res.status(500);
            res.type("text/plain");
            res.send(
                "500 | Could not connect to database. Please try again later."
            );
        });
        app.get("/api/*", (req, res) => {
            res.status(500);
            res.type("text/plain");
            res.send(
                "500 | Could not connect to database. Please try again later."
            );
        });
    }
};

main();

servlet.listen(port, () => {
    console.log(`⚡️ [api] API listening on port ${port}.`);
});
