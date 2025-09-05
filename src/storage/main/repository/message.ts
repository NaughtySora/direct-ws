import { api } from "..";

export default {
  async save(message: any) {
    const values = JSON.parse(`[${message}]`);
    let counter = 1;
    const placeholders =
      values.map(() => `($${counter++},$${counter++},$${counter++},$${counter++})`)
        .join(",");
    const payload = values.map((item: any) => [
      item.from,
      item.to, item.message.message,
      item.message.time
    ]).flat();
    await api.query(
      `INSERT INTO messages(author, recipient, content, date)
      VALUES${placeholders}`,
      payload
    );
  },
};
