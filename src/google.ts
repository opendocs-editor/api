import { google } from "googleapis";
import fs from "fs";
import readline from "readline";
import { OAuth2Client } from "google-auth-library";

export const SCOPES = ["https://www.googleapis.com/auth/documents"];

export interface OAuth2Credentials {
    client_secret: string;
    client_id: string;
    redirect_uris: string[];
}

let credentials_: OAuth2Credentials = {
    client_secret: "",
    client_id: "",
    redirect_uris: [],
};

let oa2cc: OAuth2Client;

let code = "";

export function getCode() {
    return code;
}

export function setCode(newCode: string) {
    code = newCode;
}

export function getCredentials() {
    return credentials_;
}

export function authorizePromise(
    credentials: OAuth2Credentials,
    TOKEN_PATH: fs.PathLike
): Promise<string> {
    return new Promise((resolve) => {
        const { client_secret, client_id, redirect_uris } = credentials;
        const oAuth2Client = new google.auth.OAuth2(
            client_id,
            client_secret,
            redirect_uris[0]
        );

        oa2cc = oAuth2Client;

        const authUrl = oAuth2Client.generateAuthUrl({
            access_type: "offline",
            scope: SCOPES,
        });

        resolve(authUrl);
    });
}

export function getNewToken(TOKEN_PATH: fs.PathLike) {
    return new Promise((r) => {
        oa2cc.getToken(code, (err, token) => {
            if (err) return console.error("Error retrieving access token", err);
            if (!token) return console.error("No token found.");
            oa2cc.setCredentials(token);
            fs.writeFile(TOKEN_PATH, JSON.stringify(token), (error) => {
                if (error) return console.error(error);
                console.log("Token stored to", TOKEN_PATH);
            });
            r(oa2cc);
        });
    });
}
