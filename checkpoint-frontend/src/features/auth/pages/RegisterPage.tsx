import { CheckCircle2 } from "lucide-react";
import { Footer } from "../../../components/Footer";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import type { ApiErrorResponse } from "../types/auth.types";

// Mirrors backend RegisterRequest validation exactly (docs section 2 + our DTO).
const schema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters").max(50),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

type FormValues = z.infer<typeof schema>;

export function RegisterPage() {
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  async function onSubmit(values: FormValues) {
    setServerError(null);
    try {
      await registerUser(values);
      navigate("/");
    } catch (err: any) {
      const apiError: ApiErrorResponse | undefined = err?.response?.data;

      if (apiError?.errors) {
        // Field-level validation errors from the backend
        Object.entries(apiError.errors).forEach(([field, message]) => {
          setError(field as keyof FormValues, { message });
        });
        return;
      }
      setServerError(apiError?.message ?? "Something went wrong. Please try again.");
    }
  }

  return (
    <div className="flex min-h-screen flex-col app-bg">
      <div className="flex flex-1 items-center justify-center px-4 py-8">
      <div className="w-full max-w-sm">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-500 text-white shadow-lg shadow-indigo-200">
          <CheckCircle2 size={26} />
        </div>
        <h1 className="mb-1 text-center text-2xl font-semibold text-slate-800">Checkpoint</h1>
        <p className="mb-6 text-center text-sm text-slate-500">Create your student account</p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 card p-6">
          {serverError && (
            <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{serverError}</div>
          )}

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Username</label>
            <input
              type="text"
              {...register("username")}
              className="w-full rounded-xl border border-slate-200 bg-white/80 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
            />
            {errors.username && <p className="mt-1 text-xs text-red-600">{errors.username.message}</p>}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Email</label>
            <input
              type="email"
              {...register("email")}
              className="w-full rounded-xl border border-slate-200 bg-white/80 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
            />
            {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Password</label>
            <input
              type="password"
              {...register("password")}
              className="w-full rounded-xl border border-slate-200 bg-white/80 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
            />
            {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 shadow-md shadow-indigo-200 px-3 py-2 text-sm font-medium text-white hover:from-indigo-700 hover:to-violet-700 disabled:opacity-50"
          >
            {isSubmitting ? "Creating account..." : "Register"}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-slate-500">
          Already have an account?{" "}
          <Link to="/login" className="font-medium text-indigo-600 underline">
            Log in
          </Link>
        </p>
      </div>
      </div>
      <Footer />
    </div>
  );
}
