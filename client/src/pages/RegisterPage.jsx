import { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import AuthCard from "../components/AuthCard";
import Field from "../components/Field";
import Button from "../components/Button";

export default function RegisterPage() {
  const { user, registerCompany } = useAuth();
  const [form, setForm] = useState({
    companyName: "",
    adminName: "",
    contactEmail: "",
    adminPassword: "",
  });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (user) return <Navigate to="/" replace />;

  const update = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await registerCompany({
        companyName: form.companyName.trim(),
        adminName: form.adminName.trim(),
        contactEmail: form.contactEmail.trim(),
        adminPassword: form.adminPassword,
      });
      // The API signs the new admin in, so the redirect above takes over.
    } catch (err) {
      setError(err.message);
      setSubmitting(false);
    }
  };

  return (
    <AuthCard
      title="Register your company"
      subtitle="Create a workspace and your admin account."
      footer={
        <>
          Already registered?{" "}
          <Link to="/login" className="font-semibold text-slate-900 underline decoration-amber-500 underline-offset-4">
            Sign in
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
          label="Company name"
          id="companyName"
          name="companyName"
          placeholder="ABC Construction"
          autoComplete="organization"
          value={form.companyName}
          onChange={update}
          required
          autoFocus
        />
        <Field
          label="Your name"
          id="adminName"
          name="adminName"
          autoComplete="name"
          value={form.adminName}
          onChange={update}
          required
        />
        <Field
          label="Work email"
          id="contactEmail"
          name="contactEmail"
          type="email"
          autoComplete="email"
          value={form.contactEmail}
          onChange={update}
          required
        />
        <Field
          label="Password"
          id="adminPassword"
          name="adminPassword"
          type="password"
          autoComplete="new-password"
          hint="At least 8 characters."
          value={form.adminPassword}
          onChange={update}
          minLength={8}
          required
        />
        <Button type="submit" loading={submitting}>
          {submitting ? "Creating workspace…" : "Create workspace"}
        </Button>
      </form>
    </AuthCard>
  );
}
