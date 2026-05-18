import { getBuiltMesh, execute } from '../../.mesh/index.js'; // Import the internal executor
import { parse } from 'graphql';

export const nasaNeoResolver = {
  Query: {
    nearEarthObjects: async (_parent: any, args: { startDate: string; endDate: string }, context: any) => {
      context.logger.info(`Fetching NASA NEO feed for range: ${args.startDate} to ${args.endDate}`);

      try {
        // 1. Parse an internal GraphQL operation to run against your local Mesh source
        const document = parse(`
          query GetNasaFeed($start: String!, $end: String!) {
            getFeed(startDate: $start, endDate: $end) {
              element_count
              near_earth_objects
            }
          }
        `);

        // 2. Execute directly against the local compiled Mesh schema layer
        const result = await execute(
          document, 
          { start: args.startDate, end: args.endDate }, 
          context
        );

        // Check for any upstream errors thrown by Mesh
        if (result.errors && result.errors.length > 0) {
          context.logger.error("Mesh execution returned internal errors:", JSON.stringify(result.errors));
          throw new Error(result.errors[0].message);
        }

        const meshResponse = result?.data?.getFeed;

        if (!meshResponse) {
          context.logger.warn("Mesh execution returned empty data response.");
          return null;
        }

        const elementCount = meshResponse.element_count || 0;
        const rawNeoObjects = meshResponse.near_earth_objects || {};
        const flattenedObjects: any[] = [];
        
        // 3. Flatten the dynamic date keys safely into your target layout
        Object.keys(rawNeoObjects).forEach((dateKey) => {
          const asteroidsForDate = rawNeoObjects[dateKey] || [];
          asteroidsForDate.forEach((asteroid: any) => {
            const primaryCloseApproach = asteroid.close_approach_data?.[0] || {};

            flattenedObjects.push({
              id: asteroid.id,
              name: asteroid.name,
              isPotentiallyHazardousAsteroid: asteroid.is_potentially_hazardous_asteroid,
              estimatedDiameterMinKm: asteroid.estimated_diameter?.kilometers?.estimated_diameter_min,
              estimatedDiameterMaxKm: asteroid.estimated_diameter?.kilometers?.estimated_diameter_max,
              closeApproachDate: primaryCloseApproach.close_approach_date,
              relativeVelocityKph: primaryCloseApproach.relative_velocity?.kilometers_per_hour,
              missDistanceKm: primaryCloseApproach.miss_distance?.kilometers
            });
          });
        });

        return {
          elementCount,
          objects: flattenedObjects
        };

      } catch (error: any) {
        context.logger.error("Failed inside nearEarthObjects resolver execution:", error.message || error);
        throw new Error(`Upstream integration failed: ${error.message || 'Unknown error'}`);
      }
    }
  }
};