import { describe, it, expect, vi, beforeEach } from 'vitest';
import { nasaNeoResolver } from './NasaNeoFeed.js'; // Fixed to relative same-directory path
import { execute } from '../../.mesh/index.js';     // Fixed to step up two levels out of /src/resolvers

// Mock the Mesh index module
vi.mock('../../.mesh/index.js', () => ({
  getBuiltMesh: vi.fn(),
  execute: vi.fn(),
}));

describe('NasaNeoFeed Resolver', () => {
  const mockContext = {
    logger: {
      info: vi.fn(),
      error: vi.fn(),
      warn: vi.fn(),
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should successfully fetch, flatten, and map NASA Neo data', async () => {
    const mockMeshResponse = {
      data: {
        getFeed: {
          element_count: 1,
          near_earth_objects: {
            '2026-05-18': [
              {
                id: '12345',
                name: 'Asteroid Bennu',
                is_potentially_hazardous_asteroid: true,
                estimated_diameter: {
                  kilometers: {
                    estimated_diameter_min: 0.4,
                    estimated_diameter_max: 0.5,
                  },
                },
                close_approach_data: [
                  {
                    close_approach_date: '2026-05-18',
                    relative_velocity: {
                      kilometers_per_hour: '54000',
                    },
                    miss_distance: {
                      kilometers: '1200000',
                    },
                  },
                ],
              },
            ],
          },
        },
      },
    };

    vi.mocked(execute).mockResolvedValueOnce(mockMeshResponse as any);

    const args = { startDate: '2026-05-18', endDate: '2026-05-19' };
    const result = await nasaNeoResolver.Query.nearEarthObjects(null, args, mockContext);

    expect(execute).toHaveBeenCalledTimes(1);
    expect(result).toEqual({
      elementCount: 1,
      objects: [
        {
          id: '12345',
          name: 'Asteroid Bennu',
          isPotentiallyHazardousAsteroid: true,
          estimatedDiameterMinKm: 0.4,
          estimatedDiameterMaxKm: 0.5,
          closeApproachDate: '2026-05-18',
          relativeVelocityKph: '54000',
          missDistanceKm: '1200000',
        },
      ],
    });
  });

  it('should return null and log a warning if Mesh returns empty or missing getFeed data', async () => {
    vi.mocked(execute).mockResolvedValueOnce({ data: { getFeed: null } } as any);

    const args = { startDate: '2026-05-18', endDate: '2026-05-19' };
    const result = await nasaNeoResolver.Query.nearEarthObjects(null, args, mockContext);

    expect(result).toBeNull();
    expect(mockContext.logger.warn).toHaveBeenCalledWith(
      'Mesh execution returned empty data response.'
    );
  });

  it('should throw an error if the internal Mesh execution returns graphQL errors', async () => {
    const mockErrorResponse = {
      errors: [{ message: 'Rate limit exceeded on NASA API' }],
    };

    vi.mocked(execute).mockResolvedValueOnce(mockErrorResponse as any);

    const args = { startDate: '2026-05-18', endDate: '2026-05-19' };

    await expect(
      nasaNeoResolver.Query.nearEarthObjects(null, args, mockContext)
    ).rejects.toThrow('Upstream integration failed: Rate limit exceeded on NASA API');
  });
});