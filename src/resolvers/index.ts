import { Query } from './Query.js';
import { Mutation } from './Mutation.js';
import { nasaNeoResolver } from './NasaNeoFeed.js';

export const resolvers = {
  Query: {
    ...Query,
    ...nasaNeoResolver.Query
  },
  Mutation: {
    ...Mutation
  }
};