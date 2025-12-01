"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SignUp() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    newsletterOptIn: false,
  });
  const [errors, setErrors] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const validate = () => {
    const newErrors: any = {};
    if (!formData.username.trim()) newErrors.username = "Username is required";
    if (!formData.email.trim()) newErrors.email = "Email is required";
    if (!formData.password) newErrors.password = "Password is required";
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }
    return newErrors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError("");

    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: formData.username,
          email: formData.email,
          password: formData.password,
          newsletterOptIn: formData.newsletterOptIn,
        }),
        credentials: "include",
      });

      const data = await response.json();

      if (response.ok) {
        window.location.href = "/";
      } else {
        setServerError(data.error || "Signup failed");
      }
    } catch (error) {
      setServerError("Network error. Please check if backend is running.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">Create your account</h2>
          <p className="mt-2 text-center text-sm text-gray-900">
            Already have an account?{" "}
            <a href="/signin" className="font-medium text-blue-700 hover:text-blue-600">
              Sign in
            </a>
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {serverError && (
            <div className="rounded-md bg-red-100 p-4">
              <div className="text-sm text-red-800">{serverError}</div>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-900">
                Username
              </label>
              <input
                id="username"
                name="username"
                type="text"
                required
                value={formData.username}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-400 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900"
              />
              {errors.username && <p className="text-red-700 text-sm">{errors.username}</p>}
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-900">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-400 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900"
              />
              {errors.email && <p className="text-red-700 text-sm">{errors.email}</p>}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-900">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={formData.password}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-400 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900"
              />
              {errors.password && <p className="text-red-700 text-sm">{errors.password}</p>}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-900">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                value={formData.confirmPassword}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-400 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900"
              />
              {errors.confirmPassword && <p className="text-red-700 text-sm">{errors.confirmPassword}</p>}
            </div>
          </div>

          <div className="flex items-center">
            <input
              id="newsletterOptIn"
              name="newsletterOptIn"
              type="checkbox"
              checked={formData.newsletterOptIn}
              onChange={handleChange}
              className="h-4 w-4 text-blue-700 focus:ring-blue-500 border-gray-400 rounded"
            />
            <label htmlFor="newsletterOptIn" className="ml-2 block text-sm text-gray-900">
              Send me weekly newsletters
              <p className="text-gray-800 text-xs">
                Get top headlines personalized to your interests, delivered every week. You'll receive your first newsletter
                immediately after signing up!
              </p>
            </label>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-2 px-4 text-sm font-medium rounded-md text-white bg-blue-700 hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600 disabled:opacity-50"
            >
              {loading ? "Creating account..." : "Sign up"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
