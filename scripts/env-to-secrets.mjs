import fs from "node:fs";
import path from "node:path";
import dotenv from "dotenv";

const env = dotenv.parse(fs.readFileSync(".env"));
const dir = path.resolve("secrets");
fs.mkdirSync(dir, { recursive: true, mode: 0o700 });

const write = (name, value) => {
  if (value == null || value === "") return;
  fs.writeFileSync(path.join(dir, name), String(value), { mode: 0o600 });
};

write("DATABASE_URL", `postgresql://${env.POSTGRES_USER}:${env.POSTGRES_PASSWORD}@db:5432/${env.POSTGRES_DB}`);
for (const k of ["GATEWAYAPI_API_KEY","REPLY_SENDER", "INTERNAL_API_KEY", "WEBHOOK_SECRET","ADMIN_USERNAME","ADMIN_PASSWORD","ADMIN_SECRET","SMTP_USER","SMTP_PASS","POSTGRES_PASSWORD", "PGADMIN_DEFAULT_PASSWORD"]) {
  write(k, env[k]);
}

console.log("✅ secrets written to ./secrets");
