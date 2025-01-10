import NextAuth from "next-auth";

declare module "next-auth" {
  interface User {
    id?: number;
    username?: string;
    jwt?: string;
    address?: string;
    public_key?: string;
  }

  interface Session {
    user: {
      id: number;
      username: string;
      jwt: string;
      address?: string;
      public_key?: string;
    };
  }

  interface JWT {
    id?: number;
    username?: string;
    jwt?: string;
    address?: string;
    public_key?: string;
  }
}
