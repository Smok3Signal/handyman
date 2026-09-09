"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";

export default function AuthErrorPage() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  const errorMessages: Record<string, string> = {
    CredentialsSignin: "Invalid email or password. Please try again.",
    Default: "Something went wrong. Please try again.",
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-md text-center">
        <div className="text-5xl mb-4">⚠️</div>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Authentication Error</h1>
        <p className="text-gray-500 mb-6">
          {errorMessages[error || "Default"] || errorMessages["Default"]}
        </p>
        <div className="flex gap-3 justify-center">
          <Link
            href="/login"
            className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition"
          >
            Back to Login
          </Link>
          <Link
            href="/register"
            className="border border-gray-300 text-gray-600 px-6 py-2 rounded-lg font-medium hover:bg-gray-50 transition"
          >
            Register
          </Link>
        </div>
      </div>
    </div>
  );
}