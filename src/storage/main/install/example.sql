BEGIN;
REVOKE ALL ON schema public FROM PUBLIC;

CREATE USER chat with password 'password';
CREATE SCHEMA chat AUTHORIZATION chat;
SET ROLE chat;
SET search_path TO "$user";

CREATE TABLE IF NOT EXISTS messages (
  id bigserial PRIMARY KEY,
  author uuid PRIMARY KEY,
  recipient uuid NOT NULL,
  content text NOT NULL,
  date timestamptz NOT NULL
);

GRANT USAGE ON SCHEMA chat TO chat;
GRANT CONNECT ON DATABASE chat_dev TO chat;

GRANT SELECT(author, recipient, content, date),
UPDATE(content, date),
DELETE, INSERT on messages TO chat;

COMMIT;
