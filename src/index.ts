import express from "express";
import http from "http";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import useAuth from "@opendocs-editor/authlib";
import { MongoClient } from "mongodb";

const version = {
    backend: "0.3.2.0-alpha-2021-12-14",
    frontend: "0.2.1.0-alpha-2021-12-14",
    api: "0.1.0.0-alpha-2021-12-14",
    database: "5.0.5",
    node: "16.13.1",
    npm: "8.1.2",
    yarn: "1.22.17",
    httpd: "apache-2.4.41",
    ts_node: "10.4.0",
    typescript: "4.5.2",
};

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

const dbclient = new MongoClient(
    "mongodb://localhost:27017/opendocs_api_testing"
);

const main = async () => {
    try {
        // Database connection
        await dbclient.connect();
        console.log("Connected to database!");

        // Auth
        useAuth(app, "opendocs_proxy_test", "dcwhepoiajirnd23dalk32jkui902iij");
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
    console.log(`⚡️ [api] App listening on port ${port}.`);
});
