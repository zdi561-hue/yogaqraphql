import { createYoga, createSchema } from "graphql-yoga";
import { createServer } from "http";
import { resolvers } from "./resolvers/index.js";
import path from 'node:path';
import { readFileSync } from 'node:fs'; 
import { randomUUID } from "node:crypto";

const schemaFiles = [
  "schema/nasaneofeed.graphql",
  "schema/query.graphql",
  "schema/mutation.graphql",
  "schema/types/address.graphql"
];

const typeDefs = schemaFiles
  .map((file) => readFileSync(path.join("src", file), "utf-8"))
  .join("\n");

const yoga = createYoga({
  schema: createSchema({
    typeDefs,
    resolvers
  }),
  context: async ({ request }) => {
    const requestId = randomUUID();
    const clientName = request.headers.get('client') || 'unknown-client';
    return {
      request,
      requestId,
      clientName,
      logger: {
        ...console,
        info: (message: string, ...args: any[]) => 
          console.info(`requestId=[${requestId}] client=[${clientName}] INFO:`, message, ...args),
        error: (message: string, ...args: any[]) => 
          console.error(`requestId=[${requestId}] client=[${clientName}] ERROR:`, message, ...args),
        warn: (message: string, ...args: any[]) => 
          console.warn(`requestId=[${requestId}] client=[${clientName}] WARN:`, message, ...args),
      },
    };
  },
  plugins: [
    {
      onExecutionResult({ result, context }) {
        if (result && !Array.isArray(result) && !('initialResult' in result)) {
          (result as any).metadata = {
            requestId: (context as any).requestId
          };
        }
      }
    }
  ]
});

const server = createServer(yoga);

server.listen(4000, () => {
  console.log("🚀 Yoga GraphQL running at http://localhost:4000/graphql");
});