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

export class PublicUser {
  id: string;
  fullName: string;
  phone: string;

  constructor(user: { id: string; fullName: string; phone: string }) {
    this.id = user.id;
    this.fullName = user.fullName;
    this.phone = user.phone;
  }
}
