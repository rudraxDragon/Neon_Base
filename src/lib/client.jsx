import { createClient } from "@neondatabase/neon-js";

const client = createClient({
  auth: { url: import.meta.env.VITE_NEON_AUTH },
  dataApi: { url: import.meta.env.VITE_NEON_DATA_API },
});

export default client;
