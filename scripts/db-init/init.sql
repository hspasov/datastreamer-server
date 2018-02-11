CREATE USER datastreamer WITH PASSWORD 'datastreamer';
DROP DATABASE IF EXISTS datastreamer;
CREATE DATABASE datastreamer;
\c datastreamer
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE TABLE Clients (
    Id SERIAL PRIMARY KEY NOT NULL,
    Username VARCHAR(60) NOT NULL,
    Password TEXT NOT NULL
);
CREATE TABLE Providers (
    Id SERIAL PRIMARY KEY NOT NULL,
    Username VARCHAR(60) NOT NULL,
    Password TEXT NOT NULL,
    ClientConnectPassword TEXT NOT NULL,
    Readable BOOLEAN NOT NULL,
    Writable BOOLEAN NOT NULL
);
CREATE TABLE ClientAccessRules (
    ProviderId INTEGER NOT NULL REFERENCES Providers ON DELETE CASCADE,
    ClientId INTEGER NOT NULL REFERENCES Clients ON DELETE CASCADE,
    Readable BOOLEAN NOT NULL,
    Writable BOOLEAN NOT NULL,
    PRIMARY KEY(ProviderId, ClientId)
);
GRANT ALL PRIVILEGES ON TABLE Clients TO datastreamer;
GRANT ALL PRIVILEGES ON TABLE Providers TO datastreamer;
GRANT ALL PRIVILEGES ON TABLE ClientAccessRules TO datastreamer;
GRANT USAGE, SELECT ON SEQUENCE clients_id_seq TO datastreamer;
GRANT USAGE, SELECT ON SEQUENCE providers_id_seq TO datastreamer;
CREATE OR REPLACE FUNCTION get_access_rules(provider_username varchar,
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
    END;$$ LANGUAGE plpgsql;
CREATE OR REPLACE FUNCTION create_provider(provider_username varchar,
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
    END;$$ LANGUAGE plpgsql;
CREATE OR REPLACE FUNCTION create_client(client_username varchar, client_password varchar)
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
    END;$$ LANGUAGE plpgsql;
CREATE OR REPLACE FUNCTION change_client_password(client_username varchar,
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
    END;$$ LANGUAGE plpgsql;
CREATE OR REPLACE FUNCTION change_provider_password(provider_username varchar,
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
    END;$$ LANGUAGE plpgsql;
CREATE OR REPLACE FUNCTION change_client_connect_password(provider_username varchar,
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
    END;$$ LANGUAGE plpgsql;
CREATE OR REPLACE FUNCTION delete_client(client_username varchar,
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
    END;$$ LANGUAGE plpgsql;
CREATE OR REPLACE FUNCTION delete_provider(provider_username varchar,
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
    END;$$ LANGUAGE plpgsql;