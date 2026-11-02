
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Code2 } from "lucide-react";
import api from "../services/api";

export default function Login() {
    const navigate = useNavigate();

    const [form, setForm] = useState({
        email: "",
        password: "",
    });

    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const response = await api.post("/auth/login", form);

            localStorage.setItem(
                "access_token",
                response.data.access_token
            );

            navigate("/");
        } catch (err) {
            setError(
                err.response?.data?.detail || "Login failed. Check your credentials."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-5">
            <div className="w-full max-w-md bg-white rounded-3xl p-8 shadow-xl">

                <div className="flex items-center gap-3 mb-8">
                    <div className="bg-blue-600 p-3 rounded-xl text-white">
                        <Code2 size={25} />
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900">
                        DevTrack
                    </h1>
                </div>

                <h2 className="text-3xl font-bold text-slate-900">
                    Welcome back
                </h2>

                <p className="text-slate-500 mt-2 mb-8">
                    Sign in to continue tracking your career journey.
                </p>

                <form onSubmit={handleSubmit} className="space-y-5">

                    <div>
                        <label className="block text-sm font-medium mb-2">
                            Email address
                        </label>
                        <input
                            type="email"
                            required
                            value={form.email}
                            onChange={(e) =>
                                setForm({ ...form, email: e.target.value })
                            }
                            placeholder="you@example.com"
                            className="w-full border border-slate-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2">
                            Password
                        </label>
                        <input
                            type="password"
                            required
                            value={form.password}
                            onChange={(e) =>
                                setForm({ ...form, password: e.target.value })
                            }
                            placeholder="Enter your password"
                            className="w-full border border-slate-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    {error && (
                        <p className="text-red-600 text-sm">{error}</p>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold p-3 rounded-xl disabled:opacity-60"
                    >
                        {loading ? "Signing in..." : "Sign In"}
                    </button>

                </form>

                <p className="text-center text-sm text-slate-500 mt-7">
                    Don't have an account?{" "}
                    <Link
                        to="/register"
                        className="text-blue-600 font-semibold"
                    >
                        Create account
                    </Link>
                </p>

            </div>
        </div>
    );
}
