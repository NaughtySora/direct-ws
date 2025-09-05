export default {
  port: parseInt(process.env.HTTP_PORT as string, 10),
  debug: process.env.HTTP_DEBUG === 'true',
};
