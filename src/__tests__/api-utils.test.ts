import { successResponse, errorResponse } from '@/lib/api-utils';

describe('API Utilities', () => {
  describe('successResponse', () => {
    it('should create a success response with default status 200', async () => {
      const data = { message: 'Success' };
      const response = successResponse(data);

      expect(response.status).toBe(200);

      const json = await response.json();
      expect(json).toEqual({
        success: true,
        data,
      });
    });

    it('should create a success response with custom status', async () => {
      const data = { id: '123' };
      const response = successResponse(data, 201);

      expect(response.status).toBe(201);

      const json = await response.json();
      expect(json).toEqual({
        success: true,
        data,
      });
    });
  });

  describe('errorResponse', () => {
    it('should create an error response with default status 400', async () => {
      const message = 'Validation failed';
      const response = errorResponse(message);

      expect(response.status).toBe(400);

      const json = await response.json();
      expect(json).toEqual({
        success: false,
        error: {
          message,
        },
      });
    });

    it('should create an error response with custom status and details', async () => {
      const message = 'Invalid input';
      const errors = [{ field: 'email', message: 'Invalid email format' }];
      const response = errorResponse(message, 422, errors);

      expect(response.status).toBe(422);

      const json = await response.json();
      expect(json).toEqual({
        success: false,
        error: {
          message,
          details: errors,
        },
      });
    });
  });
});
