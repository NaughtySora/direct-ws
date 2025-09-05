# Websocket direct chat (Service)

- Last (n) messsages are stored in redis
- When messagesa are exceeded limit it stores them in Postgres
- When user connects to the chat, last (n) messages polling from the redis
- Chat service can validate real user by jwt token using asymetric verify method with public key supposedly taken from the "Auth service"
