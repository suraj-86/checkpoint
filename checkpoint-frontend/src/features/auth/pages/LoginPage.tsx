import { AuthShell } from "../components/AuthShell";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useNavigate } from "react-router-dom";
import { inputClass, labelClass, primaryButton } from "../../../components/ui/styles";
import { useAuth } from "../context/AuthContext";
import type { ApiErrorResponse } from "../types/auth.types";

const schema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

type FormValues = z.infer<typeof schema>;

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  async function onSubmit(values: FormValues) {
    setServerError(null);
    try {
      await login(values);
      navigate("/");
    } catch (err: any) {
      const apiError: ApiErrorResponse | undefined = err?.response?.data;
      setServerError(apiError?.message ?? "Something went wrong. Please try again.");
    }
  }

  return (
    <AuthShell subtitle="Log in to continue practicing" mood={serverError ? "oops" : "happy"}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 card p-6">
          {serverError && (
            <div className="rounded-xl border-2 border-rose-300 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700">{serverError}</div>
          )}

          <div>
            <label className={labelClass}>Username</label>
            <input
              type="text"
              {...register("username")}
              className={inputClass}
            />
            {errors.username && <p className="mt-1 text-xs text-red-600">{errors.username.message}</p>}
          </div>

          <div>
            <label className={labelClass}>Password</label>
            <input
              type="password"
              {...register("password")}
              className={inputClass}
            />
            {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className={`${primaryButton} w-full`}
          >
            {isSubmitting ? "Logging in..." : "Log in"}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-slate-500">
          No account?{" "}
          <Link to="/register" className="font-bold text-indigo-600 underline">
            Register
          </Link>
        </p>
    </AuthShell>
  );
}
