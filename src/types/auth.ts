export type JwtPayload = {
  sub: string;
  type: "user" | "rider";
  iat?: number;
  exp?: number;
};

export type AuthContext = {
  id: string;
  type: "user" | "rider";
};
