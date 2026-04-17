import app from "./app.js";
import { connectDb } from "./config/db.js";
import { env } from "./config/env.js";

async function bootstrap() {
  try {
    await connectDb();
    app.listen(env.port, () => {
      console.log(`Server running on port ${env.port}`);
    });
  } catch (error) {
    console.error("Failed to start server", error);
    process.exit(1);
  }
}

bootstrap();
