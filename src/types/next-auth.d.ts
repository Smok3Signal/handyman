import "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: "EMPLOYER" | "TECHNICIAN";
    };
  }

  interface User {
    role: "EMPLOYER" | "TECHNICIAN";
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: "EMPLOYER" | "TECHNICIAN";
  }
}