import { AuthShell } from "../components/AuthShell";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useNavigate } from "react-router-dom";
import { inputClass, labelClass, primaryButton } from "../../../components/ui/styles";
import { useAuth } from "../context/AuthContext";
import type { ApiErrorResponse } from "../types/auth.types";
import { validateUsername } from "../../../lib/username";
import { UsernameHints } from "../components/UsernameHints";
import { blocksSubmit, useUsernameStatus } from "../hooks/useUsernameStatus";

const schema = z.object({
  username: z.string().superRefine((v, ctx) => {
    const problem = validateUsername(v);
    if (problem) ctx.addIssue({ code: "custom", message: problem });
  }),
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
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const usernameState = useUsernameStatus(watch("username") ?? "");

  async function onSubmit(values: FormValues) {
    setServerError(null);
    try {
      await registerUser(values);
      navigate("/");
    } catch (err: any) {
      const apiError: ApiErrorResponse | undefined = err?.response?.data;

      if (apiError?.errors) {
        Object.entries(apiError.errors).forEach(([field, message]) => {
          setError(field as keyof FormValues, { message });
        });
        return;
      }
      if (apiError?.message?.toLowerCase().startsWith("username")) {
        setError("username", { message: apiError.message });
        return;
      }
      setServerError(apiError?.message ?? "Something went wrong. Please try again.");
    }
  }

  return (
    <AuthShell subtitle="Create your student account" mood={serverError ? "oops" : "happy"}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 card p-6">
          {serverError && (
            <div className="rounded-xl border-2 border-rose-300 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700">{serverError}</div>
          )}

          <div>
            <label className={labelClass}>Username</label>
            <input
              type="text"
              maxLength={20}
              autoComplete="username"
              {...register("username")}
              className={inputClass}
            />
            {errors.username && <p className="mt-1 text-xs text-red-600">{errors.username.message}</p>}
            <UsernameHints state={usernameState} />
          </div>

          <div>
            <label className={labelClass}>Email</label>
            <input
              type="email"
              {...register("email")}
              className={inputClass}
            />
            {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>}
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
            disabled={isSubmitting || blocksSubmit(usernameState)}
            className={`${primaryButton} w-full`}
          >
            {isSubmitting ? "Creating account..." : "Register"}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-slate-500">
          Already have an account?{" "}
          <Link to="/login" className="font-bold text-indigo-600 underline">
            Log in
          </Link>
        </p>
    </AuthShell>
  );
}
