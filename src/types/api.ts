export type ApiSuccess<T> = {
  status: "success";
  data: T;
};

export type ApiError = {
  status: "error";
  message: string;
  errors?: Record<string, string[]> | string[];
};

export type Paginated<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
};
