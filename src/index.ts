import { createYoga, createSchema } from "graphql-yoga";
import { createServer } from "http";
import { resolvers } from "./resolvers/index.js";
import path from 'node:path';
import { readFileSync } from 'node:fs'; 

import { randomUUID } from "node:crypto";

const schemaFiles = [
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
      // Create a logger that prepends both the ID and the Client Name
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
  // Use the plugins system to append metadata to the response
  plugins: [
    {
      // This hook allows us to mutate the result before it is sent
      onExecutionResult({ result, context }) {
        // Ensure result is an object and not an AsyncIterable (for subscriptions/defer)
        if (result && !Array.isArray(result) && !('initialResult' in result)) {
          // Add the metadata object at the top level
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
