import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Mutation } from './Mutation.js';
import { GraphQLError } from 'graphql';
import * as fs from 'node:fs';

// Mock the filesystem module
vi.mock('node:fs');

describe('Mutation.updateAddress', () => {
  const mockContext = {
    request: {
      headers: new Map()
    },
    logger: {
      info: vi.fn(),
      error: vi.fn()
    },
    requestId: 'test-uuid-123'
  };

  const mockInput = {
    street: "456 Oak Ave",
    city: "Naperville",
    state: "IL",
    zipcode: "60540"
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockContext.request.headers.clear();
  });

  it('should throw error if client header is missing', () => {
    expect(() => 
      Mutation.updateAddress({}, { username: 'zenong', input: mockInput }, mockContext as any)
    ).toThrow(GraphQLError);
    
    expect(mockContext.logger.error).toHaveBeenCalledWith(
      expect.stringContaining('insertAddress resolver'), 
      expect.stringContaining('Client header: undefined')
    );
  });

  it('should throw error if client is "strata"', () => {
    mockContext.request.headers.set('client', 'strata');

    expect(() => 
      Mutation.updateAddress({}, { username: 'zenong', input: mockInput }, mockContext as any)
    ).toThrow("insertAddress resolver, Header client is strata");
  });

  it('should successfully update the address and write to file', () => {
    // 1. Setup valid header
    mockContext.request.headers.set('client', 'zding');

    // 2. Mock existing file content
    const existingData = { otherUser: { street: "123 Main" } };
    vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify(existingData));

    // 3. Run mutation
    const result = Mutation.updateAddress(
      {}, 
      { username: 'zenong', input: mockInput }, 
      mockContext as any
    );

    // 4. Assertions
    expect(result).toEqual(mockInput);
    
    // Check if writeFileSync was called with the combined data
    const expectedStoredData = JSON.stringify({
      ...existingData,
      zenong: mockInput
    }, null, 2);

    expect(fs.writeFileSync).toHaveBeenCalledWith(
      expect.any(String), // The filePath
      expectedStoredData,
      "utf-8"
    );
  });
});