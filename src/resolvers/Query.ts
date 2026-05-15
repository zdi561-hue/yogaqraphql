import { readFileSync } from "fs";
import { GraphQLError } from "graphql";
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const filePath = path.resolve(__dirname, "../../data/address.json");

export const Query = {
  address: (_: any, { username }: { username: string },context: any) => {
    const headers = context.request?.headers;
      const clientHeader = headers?.get('client');
      context.logger.info('address resolver', `Client header: ${clientHeader}`);
      if(!clientHeader) {
        throw new GraphQLError("Missing required header: client");
      }
    const raw = readFileSync(filePath, "utf-8");
    const data = JSON.parse(raw);
    return data[username] || null;
  }
};
