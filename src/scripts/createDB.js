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
        ClientConnectPassword TEXT NOT NULL,
        Readable BOOLEAN NOT NULL,
        Writable BOOLEAN NOT NULL
    )`);
}).then(() => {
    console.log("create providers success");
    return pool.query(`CREATE TABLE ClientAccessRules (
        ProviderId INTEGER NOT NULL REFERENCES Providers ON DELETE CASCADE,
        ClientId INTEGER NOT NULL REFERENCES Clients ON DELETE CASCADE,
        Readable BOOLEAN NOT NULL,
        Writable BOOLEAN NOT NULL,
        PRIMARY KEY(ProviderId, ClientId)
    )`);
}).then(() => {
    console.log("create client access rules success");
    return pool.query(`CREATE OR REPLACE FUNCTION get_access_rules(provider_username varchar,
        client_username varchar, client_connect_password varchar)
        RETURNS RECORD AS $$
        DECLARE
            default_rules RECORD;
            client_rules RECORD;
        BEGIN
            SELECT INTO default_rules Username, Readable, Writable
            FROM Providers WHERE Username = provider_username AND
            ClientConnectPassword = crypt(client_connect_password, ClientConnectPassword);
            IF FOUND THEN
                SELECT INTO client_rules Providers.Username, ClientAccessRules.Readable, ClientAccessRules.Writable
                FROM ClientAccessRules INNER JOIN Providers
                ON ClientAccessRules.ProviderId = Providers.Id
                INNER JOIN Clients ON ClientAccessRules.ClientId = Clients.Id
                WHERE Providers.Username = provider_username AND Clients.Username = client_username;
                IF FOUND THEN
                    RETURN client_rules;
                ELSE
                    RETURN default_rules;
                END IF;
            ELSE
                RETURN NULL;
            END IF;
        END;$$ LANGUAGE plpgsql;`);
}).then(() => {
    console.log("create function get_access_rules success");
    return pool.query(`CREATE OR REPLACE FUNCTION create_provider(provider_username varchar,
        provider_password varchar, client_connect_password varchar)
        RETURNS RECORD AS $$
        DECLARE
            provider RECORD;
        BEGIN
            SELECT INTO provider * FROM Providers
            WHERE Providers.Username = provider_username;
            IF FOUND THEN
                RETURN NULL;
            ELSE
                INSERT INTO Providers (
                    Username, Password, ClientConnectPassword, Readable, Writable)
                VALUES (
                    provider_username,
                    crypt(provider_password, gen_salt('bf', 8)),
                    crypt(client_connect_password, gen_salt('bf', 8)),
                    FALSE,
                    FALSE
                ) RETURNING Username, Readable, Writable INTO provider;
                RETURN provider;
            END IF;
        END;$$ LANGUAGE plpgsql;`);
}).then(() => {
    console.log("create function create_provider success");
    return pool.query(`CREATE OR REPLACE FUNCTION create_client(client_username varchar, client_password varchar)
        RETURNS RECORD AS $$
        DECLARE
            client RECORD;
        BEGIN
            SELECT INTO client * FROM Clients
            WHERE Username = client_username;
            IF FOUND THEN
                RETURN NULL;
            ELSE
                INSERT INTO Clients (Username, Password)
                VALUES (client_username, crypt(client_password, gen_salt('bf', 8)))
                RETURNING Clients.Username INTO client;
                RETURN client;
            END IF;
        END;$$ LANGUAGE plpgsql;`);
}).then(() => {
    console.log("create function create_client success");
    return pool.query(`CREATE OR REPLACE FUNCTION change_client_password(client_username varchar,
        old_password varchar, new_password varchar)
        RETURNS BOOLEAN AS $$
        DECLARE
            client_id INTEGER;
        BEGIN
            SELECT INTO client_id Id FROM Clients
            WHERE Username = client_username
            AND Password = crypt(old_password, Password);
            IF FOUND THEN
                UPDATE Clients
                SET Password = crypt(new_password, gen_salt('bf', 8))
                WHERE Id = client_id;
                RETURN TRUE;
            ELSE
                RETURN FALSE;
            END IF;
        END;$$ LANGUAGE plpgsql;`);
}).then(() => {
    console.log("create function change_client_password success");
    return pool.query(`CREATE OR REPLACE FUNCTION change_provider_password(provider_username varchar,
        old_password varchar, new_password varchar)
        RETURNS BOOLEAN AS $$
        DECLARE
            provider_id INTEGER;
        BEGIN
            SELECT INTO provider_id Id FROM Providers
            WHERE Username = provider_username
            AND Password = crypt(old_password, Password);
            IF FOUND THEN
                UPDATE Providers
                SET Password = crypt(new_password, gen_salt('bf', 8))
                WHERE Id = provider_id;
                RETURN TRUE;
            ELSE
                RETURN FALSE;
            END IF;
        END;$$ LANGUAGE plpgsql;`);
}).then(() => {
    console.log("create function change_provider_password success");
    return pool.query(`CREATE OR REPLACE FUNCTION change_client_connect_password(provider_username varchar,
        provider_password varchar, new_client_connect_password varchar)
        RETURNS BOOLEAN AS $$
        DECLARE
            provider_id INTEGER;
        BEGIN
            SELECT INTO provider_id Id FROM Providers
            WHERE Username = provider_username
            AND Password = crypt(provider_password, Password);
            IF FOUND THEN
                UPDATE Providers
                SET ClientConnectPassword = crypt(new_client_connect_password, gen_salt('bf', 8))
                WHERE Id = provider_id;
                RETURN TRUE;
            ELSE
                RETURN FALSE;
            END IF;
        END;$$ LANGUAGE plpgsql;`);
}).then(() => {
    console.log("create function change_client_connect_password success");
    return pool.query(`CREATE OR REPLACE FUNCTION delete_client(client_username varchar,
        client_password varchar)
        RETURNS BOOLEAN AS $$
        DECLARE
            client_id INTEGER;
        BEGIN
            SELECT INTO client_id Id FROM Clients
            WHERE Username = client_username
            AND Password = crypt(client_password, Password);
            IF FOUND THEN
                DELETE FROM Clients WHERE Id = client_id;
                RETURN TRUE;
            ELSE
                RETURN FALSE;
            END IF;
        END;$$ LANGUAGE plpgsql;`);
}).then(() => {
    console.log("create function delete_client success");
    return pool.query(`CREATE OR REPLACE FUNCTION delete_provider(provider_username varchar,
        provider_password varchar)
        RETURNS BOOLEAN AS $$
        DECLARE
            provider_id INTEGER;
        BEGIN
            SELECT INTO provider_id Id FROM Providers
            WHERE Username = provider_username
            AND Password = crypt(provider_password, Password);
            IF FOUND THEN
                DELETE FROM Providers WHERE Id = provider_id;
                RETURN TRUE;
            ELSE
                RETURN FALSE;
            END IF;
        END;$$ LANGUAGE plpgsql;`);
}).then(() => {
    console.log("create function delete_provider success");
    pool.end();
}).catch(error => {
    console.log(error);
    pool.end();
});