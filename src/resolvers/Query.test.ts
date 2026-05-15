import { describe, it, expect, vi } from 'vitest';
import { Query } from './Query.js';
import { GraphQLError } from 'graphql';
import * as fs from 'fs';

// Mock the filesystem so we don't depend on the real address.json
vi.mock('fs');

describe('Query.address resolver', () => {
  const mockContext = {
    request: {
      headers: new Map()
    },
    logger: {
      info: vi.fn(),
      error: vi.fn()
    },
    requestId: 'test-id'
  };

  it('should throw GraphQLError if client header is missing', () => {
    // Setup context with NO client header
    mockContext.request.headers.set('client', undefined);

    expect(() => 
      Query.address({}, { username: 'zenong' }, mockContext as any)
    ).toThrow(GraphQLError);
    
    expect(() => 
      Query.address({}, { username: 'zenong' }, mockContext as any)
    ).toThrow('Missing required header: client');
  });

  it('should return address data when client header is present', () => {
    // 1. Setup header
    mockContext.request.headers.set('client', 'zding');

    // 2. Mock the file content
    const mockData = JSON.stringify({
      zenong: { street: '123 Main St', city: 'Naperville', state: 'IL', zipcode: '60540' }
    });
    vi.mocked(fs.readFileSync).mockReturnValue(mockData);

    // 3. Execute resolver
    const result = Query.address({}, { username: 'zenong' }, mockContext as any);

    // 4. Assertions
    expect(result).toEqual({
      street: '123 Main St',
      city: 'Naperville',
      state: 'IL',
      zipcode: '60540'
    });
    expect(mockContext.logger.info).toHaveBeenCalled();
  });

  it('should return null data when client header is present but user not found', () => {
    // 1. Setup header
    mockContext.request.headers.set('client', 'zding');

    // 2. Mock the file content as a valid JSON string
    // We return an object that does NOT contain the key "zenon"
    const mockData = JSON.stringify({
      someone_else: { street: '555 Side St', city: 'Chicago', state: 'IL', zipcode: '60601' }
    });
    vi.mocked(fs.readFileSync).mockReturnValue(mockData);

    // 3. Execute resolver with a username not in the mockData
    const result = Query.address({}, { username: 'zenon' }, mockContext as any);

    // 4. Assertions
    expect(result).toBeNull(); // Your resolver returns data[username] || null;
    expect(mockContext.logger.info).toHaveBeenCalled();
  });
});