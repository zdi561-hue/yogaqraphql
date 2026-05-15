import { readFileSync, writeFileSync } from "fs";
import { GraphQLError } from "graphql";
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const filePath = path.resolve(__dirname, "../../data/address.json");

export const Mutation = {
  updateAddress: (
    _: any,
    { username, input }: { username: string; input: any },
    context: any
  ) => {
     const headers = context.request?.headers;
      const clientHeader = headers?.get('client');
      context.logger.info('insertAddress resolver', `Client header: ${clientHeader}`);
      if(!clientHeader) {
        context.logger.error('insertAddress resolver', `Client header: ${clientHeader}`);
        throw new GraphQLError("insertAddress resolver Missing required header: client");
      } else if(clientHeader === "strata") {
        context.logger.error('insertAddress resolver', 'Header client is strata');
        throw new GraphQLError("insertAddress resolver, Header client is strata");
      }
    const raw = readFileSync(filePath, "utf-8");
    const data = JSON.parse(raw);

    data[username] = input;

    writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");

    return input;
  }
};
