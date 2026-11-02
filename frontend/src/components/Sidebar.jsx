
import {
    LayoutDashboard,
    BriefcaseBusiness,
    Settings,
    LogOut,
    Code2,
} from "lucide-react";
import { NavLink } from "react-router-dom";
export default function Sidebar() {
    const handleLogout = () => {
        localStorage.removeItem("access_token");
        window.location.href = "/login";
    };

    return (
        <aside className="w-64 min-h-screen bg-slate-950 text-white p-6 flex flex-col">

            <div className="flex items-center gap-3 mb-12">
                <div className="bg-blue-600 p-2 rounded-xl">
                    <Code2 size={24} />
                </div>
                <h1 className="text-2xl font-bold">DevTrack</h1>
            </div>

            <p className="text-xs uppercase tracking-wider text-slate-500 mb-4">
                Workspace
            </p>

            <nav className="space-y-2">
                <NavLink
                    to="/"
                    end
                    className={({ isActive }) =>
                        `flex items-center gap-3 p-3 rounded-xl ${isActive
                            ? "bg-blue-600 text-white"
                            : "text-slate-300 hover:bg-slate-800"
                        }`
                    }
                >
                    <LayoutDashboard size={20} />
                    Dashboard
                </NavLink>

                <NavLink
                    to="/applications"
                    className={({ isActive }) =>
                        `flex items-center gap-3 p-3 rounded-xl ${isActive
                            ? "bg-blue-600 text-white"
                            : "text-slate-300 hover:bg-slate-800"
                        }`
                    }
                >
                    <BriefcaseBusiness size={20} />
                    Applications
                </NavLink>
            </nav>

            <div className="mt-auto space-y-2">
                <a className="flex items-center gap-3 p-3 text-slate-300">
                    <Settings size={20} />
                    Settings
                </a>

                <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 p-3 text-red-400 hover:bg-slate-800 rounded-xl w-full"
                >
                    <LogOut size={20} />
                    Logout
                </button>
            </div>

        </aside>
    );
}
