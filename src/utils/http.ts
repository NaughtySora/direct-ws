export const parseToken = (headers: any) => {
  const auth = headers.authorization;
  if (!auth.startsWith("Bearer")) return;
  return auth.split(" ")[1];
};
