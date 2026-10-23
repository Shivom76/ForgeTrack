import { useState } from "react";
import { Link, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import AuthCard from "../components/AuthCard";
import Field from "../components/Field";
import Button from "../components/Button";

export default function LoginPage() {
  const { user, login } = useAuth();
  const location = useLocation();
  const [form, setForm] = useState({ companyCode: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Already signed in (or just signed in): go where they were heading, or home.
  if (user) return <Navigate to={location.state?.from?.pathname || "/"} replace />;

  const update = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await login({
        companyCode: form.companyCode.trim(),
        email: form.email.trim(),
        password: form.password,
      });
      // On success `user` is set and the redirect above takes over.
    } catch (err) {
      setError(err.message);
      setSubmitting(false);
    }
  };

  return (
    <AuthCard
      title="Sign in"
      subtitle="Use the company code your admin gave you."
      footer={
        <>
          New company?{" "}
          <Link to="/register" className="font-semibold text-slate-900 underline decoration-amber-500 underline-offset-4">
            Register it here
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}
        <Field
          label="Company code"
          id="companyCode"
          name="companyCode"
          placeholder="e.g. abc-construction"
          autoComplete="organization"
          value={form.companyCode}
          onChange={update}
          required
          autoFocus
        />
        <Field
          label="Email"
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          value={form.email}
          onChange={update}
          required
        />
        <Field
          label="Password"
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          value={form.password}
          onChange={update}
          required
        />
        <Button type="submit" loading={submitting}>
          {submitting ? "Signing in…" : "Sign in"}
        </Button>
      </form>
    </AuthCard>
  );
}
