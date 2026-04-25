/**
 * Standard success response envelope.
 * All controller responses go through this shape via the response helpers.
 */
export type ApiSuccess<T> = {
  status: "success";
  data: T;
};

/**
 * Standard error response envelope.
 * Produced by the error middleware.
 */
export type ApiError = {
  status: "error";
  message: string;
  errors?: Record<string, string[]> | string[];
};

/**
 * Pagination wrapper for list endpoints.
 * Use when an endpoint returns a paginated collection.
 */
export type Paginated<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
};
