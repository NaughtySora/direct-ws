export default {
  host:  process.env.DOCKER ? process.env.REDIS_HOST : process.env.LOCALHOST,
  port: parseInt(process.env.REDIS_PORT as string, 10)
}
