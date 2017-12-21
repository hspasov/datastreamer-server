const { Pool } = require("pg");

let pool = new Pool({
    user: "postgres",
    database: "postgres",
    port: "5432"
});

pool.query("DROP DATABASE IF EXISTS datastreamer;").then(() => {
    console.log("drop database success");
    return pool.query("CREATE DATABASE datastreamer;");
}).then(() => {
    console.log("create database success");
    return pool.end();
}).then(() => {
    pool = new Pool({
        user: "postgres",
        database: "datastreamer",
        port: "5432"
    });
    return;
}).then(() => {
    console.log("superuser using datastreamer");
    return pool.query("CREATE EXTENSION IF NOT EXISTS pgcrypto;");
}).then(() => {
    console.log("added crypto extention");
    return pool.end();
}).then(() => {
    pool = new Pool({
        user: "datastreamer",
        database: "datastreamer",
        port: "5432"
    });
    return;
}).then(() => {
    console.log("using datastreamer");
    return pool.query(`CREATE TABLE Clients (
        Id SERIAL PRIMARY KEY NOT NULL,
        Username VARCHAR(60) NOT NULL,
        Password TEXT NOT NULL
    )`);
}).then(() => {
    console.log("create clients success");
    return pool.query(`CREATE TABLE Providers (
        Id SERIAL PRIMARY KEY NOT NULL,
        Username VARCHAR(60) NOT NULL,
        Password TEXT NOT NULL,
        Readable BOOLEAN NOT NULL,
        Writable BOOLEAN NOT NULL
    )`);
}).then(() => {
    console.log("create providers success");
    return pool.query(`CREATE TABLE ClientAccessRules (
        Id SERIAL PRIMARY KEY NOT NULL,
        ProviderId INTEGER NOT NULL REFERENCES Providers,
        ClientId INTEGER NOT NULL REFERENCES Clients,
        Readable BOOLEAN NOT NULL,
        Writable BOOLEAN NOT NULL
    )`);
}).then(() => {
    console.log("create client access rules success");
    pool.end();
}).catch(error => {
    console.log(error);
    pool.end();
});