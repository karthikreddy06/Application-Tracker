import { useEffect, useState } from "react";

import {
    BriefcaseBusiness,
    ClipboardCheck,
    Users,
    Trophy,
    TrendingUp,
    XCircle,
    RefreshCw,
    ArrowUpRight,
    Bell,
    X,
    CalendarDays,
    Clock,
    AlertTriangle,
    CheckCircle2,
    BellRing,
} from "lucide-react";

import {
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Tooltip,
    Legend,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
} from "recharts";

import StatCard from "../components/StatCard";
import api from "../services/api";

const STATUS_COLORS = {
    Applied: "#3B82F6",
    Assessment: "#8B5CF6",
    Interview: "#F97316",
    Offer: "#10B981",
    Rejected: "#EF4444",
};

// Format YYYY-MM-DD without timezone shifting
const formatDate = (dateString) => {
    if (!dateString) return "Not scheduled";

    const [year, month, day] = dateString.split("-");

    return `${day}/${month}/${year}`;
};

// Get today's date in local YYYY-MM-DD format
const getToday = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
};

export default function Dashboard() {
    const [stats, setStats] = useState({
        total_applications: 0,
        applied: 0,
        assessments: 0,
        interviews: 0,
        offers: 0,
        rejected: 0,
        success_rate: 0,
    });

    const [recentJobs, setRecentJobs] = useState([]);
    const [reminders, setReminders] = useState({
        overdue_count: 0,
        due_today_count: 0,
        upcoming_count: 0,
        total_reminders: 0,
        overdue: [],
        due_today: [],
        upcoming: [],
    });

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [notificationOpen, setNotificationOpen] = useState(false);
    const [notificationPermission, setNotificationPermission] =
        useState(() => {
            return "Notification" in window
                ? Notification.permission
                : "unsupported";
        });

    // Fetch dashboard data
    const fetchDashboard = async () => {
        try {
            setLoading(true);
            setError("");

            const [
                statsResponse,
                jobsResponse,
                remindersResponse,
            ] = await Promise.all([
                api.get("/jobs/stats"),
                api.get("/jobs/", {
                    params: {
                        skip: 0,
                        limit: 5,
                    },
                }),
                api.get("/jobs/reminders"),
            ]);

            setStats(statsResponse.data);
            setRecentJobs(jobsResponse.data.jobs || []);
            setReminders(remindersResponse.data);
        } catch (err) {
            console.error("Dashboard API error:", err);

            setError(
                err.response?.status === 401
                    ? "Please log in to view your dashboard."
                    : "Unable to load dashboard data."
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDashboard();
    }, []);

    // Refresh reminders automatically every 60 seconds
    useEffect(() => {
        const interval = setInterval(async () => {
            try {
                const response = await api.get("/jobs/reminders");
                setReminders(response.data);
            } catch (err) {
                console.error("Reminder refresh failed:", err);
            }
        }, 60000);

        return () => clearInterval(interval);
    }, []);

    // Request browser notification permission
    const enableBrowserNotifications = async () => {
        if (!("Notification" in window)) {
            alert("Your browser does not support desktop notifications.");
            return;
        }

        if (Notification.permission === "granted") {
            setNotificationPermission("granted");
            return;
        }

        if (Notification.permission === "denied") {
            alert(
                "Notifications are blocked. Please enable them in your browser site settings."
            );
            return;
        }

        const permission = await Notification.requestPermission();
        setNotificationPermission(permission);
    };

    // Send browser notifications without repeating the same reminder
    useEffect(() => {
        if (
            notificationPermission !== "granted" ||
            !("Notification" in window)
        ) {
            return;
        }

        const today = getToday();

        const tomorrowDate = new Date();
        tomorrowDate.setDate(tomorrowDate.getDate() + 1);

        const tomorrowYear = tomorrowDate.getFullYear();
        const tomorrowMonth = String(
            tomorrowDate.getMonth() + 1
        ).padStart(2, "0");
        const tomorrowDay = String(
            tomorrowDate.getDate()
        ).padStart(2, "0");

        const tomorrow =
            `${tomorrowYear}-${tomorrowMonth}-${tomorrowDay}`;

        const importantReminders = [
            ...(reminders.overdue || []).map((job) => ({
                ...job,
                reminderType: "Overdue",
            })),

            ...(reminders.due_today || []).map((job) => ({
                ...job,
                reminderType: "Due Today",
            })),

            ...(reminders.upcoming || [])
                .filter(
                    (job) =>
                        job.follow_up_date <= tomorrow
                )
                .map((job) => ({
                    ...job,
                    reminderType: "Tomorrow",
                })),
        ];

        let notified = {};

        try {
            notified = JSON.parse(
                localStorage.getItem("devtrack_notified_reminders") ||
                "{}"
            );
        } catch {
            notified = {};
        }

        importantReminders.forEach((job) => {
            const reminderKey =
                `${job.id}_${job.follow_up_date}`;

            if (notified[reminderKey]) {
                return;
            }

            const notification = new Notification(
                `DevTrack: ${job.reminderType}`,
                {
                    body:
                        `${job.company_name} — ${job.job_title}\n` +
                        `Follow-up: ${formatDate(job.follow_up_date)}`,
                    icon: "/favicon.ico",
                    tag: reminderKey,
                }
            );

            notification.onclick = () => {
                window.focus();
                setNotificationOpen(true);
                notification.close();
            };

            notified[reminderKey] = true;
        });

        try {
            localStorage.setItem(
                "devtrack_notified_reminders",
                JSON.stringify(notified)
            );
        } catch (err) {
            console.error("Could not save notification history:", err);
        }
    }, [reminders, notificationPermission]);

    const chartData = [
        { name: "Applied", value: stats.applied },
        { name: "Assessment", value: stats.assessments },
        { name: "Interview", value: stats.interviews },
        { name: "Offer", value: stats.offers },
        { name: "Rejected", value: stats.rejected },
    ];

    const getStatusStyle = (status) => {
        const styles = {
            Applied: "bg-blue-100 text-blue-700",
            Assessment: "bg-purple-100 text-purple-700",
            Interview: "bg-orange-100 text-orange-700",
            Offer: "bg-emerald-100 text-emerald-700",
            Rejected: "bg-red-100 text-red-700",
        };

        return styles[status] || "bg-slate-100 text-slate-600";
    };

    const getReminderStyle = (type) => {
        const styles = {
            overdue: "bg-red-100 text-red-700",
            today: "bg-amber-100 text-amber-700",
            upcoming: "bg-blue-100 text-blue-700",
        };

        return styles[type];
    };

    const renderReminderList = (jobs, type, label) => {
        if (!jobs || jobs.length === 0) return null;

        return (
            <div className="mb-5">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-slate-800">
                        {label}
                    </h3>

                    <span
                        className={`text-xs px-2.5 py-1 rounded-full font-semibold ${getReminderStyle(type)}`}
                    >
                        {jobs.length}
                    </span>
                </div>

                <div className="space-y-2">
                    {jobs.map((job) => (
                        <div
                            key={job.id}
                            className="p-3 rounded-xl border border-slate-100 hover:bg-slate-50 transition"
                        >
                            <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                    <p className="font-semibold text-sm text-slate-800">
                                        {job.company_name}
                                    </p>

                                    <p className="text-xs text-slate-500 mt-1">
                                        {job.job_title}
                                    </p>

                                    <p className="text-xs text-slate-500 mt-2 flex items-center gap-1">
                                        <CalendarDays size={13} />
                                        {formatDate(job.follow_up_date)}
                                    </p>
                                </div>

                                <span className="text-xs text-slate-500 whitespace-nowrap">
                                    {job.status}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    return (
        <main className="flex-1 min-w-0 p-5 md:p-8 bg-slate-50 min-h-screen">

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
                <div>
                    <p className="text-sm text-slate-500">
                        Workspace / Overview
                    </p>

                    <h1 className="text-3xl font-bold text-slate-900 mt-2">
                        Dashboard
                    </h1>

                    <p className="text-slate-500 mt-2">
                        Track your job search journey in one place.
                    </p>
                </div>

                <div className="flex items-center gap-3">

                    {/* Notification Bell */}
                    <div className="relative">
                        <button
                            onClick={() =>
                                setNotificationOpen(!notificationOpen)
                            }
                            className="relative flex items-center justify-center bg-white border border-slate-200 w-12 h-12 rounded-xl hover:bg-slate-100 transition"
                            aria-label="Open notifications"
                        >
                            <Bell size={21} className="text-slate-700" />

                            {reminders.total_reminders > 0 && (
                                <span className="absolute -top-2 -right-2 min-w-5 h-5 px-1 flex items-center justify-center bg-red-500 text-white text-xs font-bold rounded-full">
                                    {reminders.total_reminders > 99
                                        ? "99+"
                                        : reminders.total_reminders}
                                </span>
                            )}
                        </button>

                        {/* Notification Dropdown */}
                        {notificationOpen && (
                            <div className="absolute right-0 top-14 w-[340px] sm:w-[390px] max-h-[75vh] overflow-y-auto bg-white border border-slate-200 rounded-2xl shadow-xl z-50">

                                <div className="p-4 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white">
                                    <div>
                                        <h2 className="font-bold text-slate-900">
                                            Notifications
                                        </h2>

                                        <p className="text-xs text-slate-500 mt-1">
                                            Your job follow-up reminders
                                        </p>
                                    </div>

                                    <button
                                        onClick={() =>
                                            setNotificationOpen(false)
                                        }
                                        className="p-2 hover:bg-slate-100 rounded-lg"
                                        aria-label="Close notifications"
                                    >
                                        <X size={18} />
                                    </button>
                                </div>

                                <div className="p-4">

                                    {/* Notification Summary */}
                                    <div className="grid grid-cols-3 gap-2 mb-5">
                                        <div className="bg-red-50 rounded-xl p-3 text-center">
                                            <p className="text-xl font-bold text-red-600">
                                                {reminders.overdue_count}
                                            </p>
                                            <p className="text-xs text-red-600">
                                                Overdue
                                            </p>
                                        </div>

                                        <div className="bg-amber-50 rounded-xl p-3 text-center">
                                            <p className="text-xl font-bold text-amber-600">
                                                {reminders.due_today_count}
                                            </p>
                                            <p className="text-xs text-amber-600">
                                                Today
                                            </p>
                                        </div>

                                        <div className="bg-blue-50 rounded-xl p-3 text-center">
                                            <p className="text-xl font-bold text-blue-600">
                                                {reminders.upcoming_count}
                                            </p>
                                            <p className="text-xs text-blue-600">
                                                Upcoming
                                            </p>
                                        </div>
                                    </div>

                                    {reminders.total_reminders === 0 ? (
                                        <div className="py-8 text-center">
                                            <CheckCircle2
                                                size={35}
                                                className="mx-auto text-emerald-500 mb-3"
                                            />

                                            <p className="font-semibold text-slate-700">
                                                You're all caught up!
                                            </p>

                                            <p className="text-xs text-slate-500 mt-1">
                                                No follow-up reminders right now.
                                            </p>
                                        </div>
                                    ) : (
                                        <>
                                            {renderReminderList(
                                                reminders.overdue,
                                                "overdue",
                                                "Overdue Follow-ups"
                                            )}

                                            {renderReminderList(
                                                reminders.due_today,
                                                "today",
                                                "Due Today"
                                            )}

                                            {renderReminderList(
                                                reminders.upcoming,
                                                "upcoming",
                                                "Upcoming Follow-ups"
                                            )}
                                        </>
                                    )}
                                </div>

                                {/* Browser Notification Permission */}
                                <div className="p-4 border-t border-slate-100 bg-slate-50">
                                    {notificationPermission === "granted" ? (
                                        <div className="flex items-center gap-2 text-sm text-emerald-700">
                                            <BellRing size={17} />
                                            Desktop notifications enabled
                                        </div>
                                    ) : notificationPermission === "unsupported" ? (
                                        <p className="text-xs text-slate-500">
                                            Your browser does not support desktop notifications.
                                        </p>
                                    ) : notificationPermission === "denied" ? (
                                        <p className="text-xs text-red-600">
                                            Notifications are blocked. Enable them in browser site settings.
                                        </p>
                                    ) : (
                                        <button
                                            onClick={enableBrowserNotifications}
                                            className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-700 transition"
                                        >
                                            <BellRing size={17} />
                                            Enable Desktop Notifications
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Refresh Dashboard */}
                    <button
                        onClick={fetchDashboard}
                        disabled={loading}
                        className="flex items-center justify-center gap-2 bg-white border border-slate-200 px-4 py-3 rounded-xl hover:bg-slate-100 disabled:opacity-50"
                    >
                        <RefreshCw
                            size={18}
                            className={loading ? "animate-spin" : ""}
                        />
                        <span className="hidden sm:inline">
                            Refresh Dashboard
                        </span>
                    </button>
                </div>
            </div>

            {/* Error */}
            {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-xl mb-6">
                    {error}
                </div>
            )}

            {loading ? (
                <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-500">
                    Loading dashboard...
                </div>
            ) : (
                <>
                    {/* Reminder Overview */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-6">

                        <div className="bg-white border border-slate-200 rounded-2xl p-5">
                            <div className="flex items-center justify-between">
                                <p className="text-sm text-slate-500">
                                    Overdue Follow-ups
                                </p>
                                <AlertTriangle
                                    className="text-red-500"
                                    size={21}
                                />
                            </div>

                            <h2 className="text-3xl font-bold mt-3 text-red-600">
                                {reminders.overdue_count}
                            </h2>

                            <p className="text-xs text-slate-500 mt-1">
                                Missed follow-up dates
                            </p>
                        </div>

                        <div className="bg-white border border-slate-200 rounded-2xl p-5">
                            <div className="flex items-center justify-between">
                                <p className="text-sm text-slate-500">
                                    Due Today
                                </p>
                                <Clock
                                    className="text-amber-500"
                                    size={21}
                                />
                            </div>

                            <h2 className="text-3xl font-bold mt-3 text-amber-600">
                                {reminders.due_today_count}
                            </h2>

                            <p className="text-xs text-slate-500 mt-1">
                                Follow-ups scheduled for today
                            </p>
                        </div>

                        <div className="bg-white border border-slate-200 rounded-2xl p-5">
                            <div className="flex items-center justify-between">
                                <p className="text-sm text-slate-500">
                                    Upcoming Follow-ups
                                </p>
                                <CalendarDays
                                    className="text-blue-500"
                                    size={21}
                                />
                            </div>

                            <h2 className="text-3xl font-bold mt-3 text-blue-600">
                                {reminders.upcoming_count}
                            </h2>

                            <p className="text-xs text-slate-500 mt-1">
                                Within the next 7 days
                            </p>
                        </div>
                    </div>

                    {/* KPI Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">

                        <StatCard
                            title="Total Applications"
                            value={stats.total_applications}
                            icon={BriefcaseBusiness}
                            color="bg-blue-100 text-blue-600"
                        />

                        <StatCard
                            title="Applied"
                            value={stats.applied}
                            icon={ClipboardCheck}
                            color="bg-indigo-100 text-indigo-600"
                        />

                        <StatCard
                            title="Interviews"
                            value={stats.interviews}
                            icon={Users}
                            color="bg-orange-100 text-orange-600"
                        />

                        <StatCard
                            title="Offers"
                            value={stats.offers}
                            icon={Trophy}
                            color="bg-emerald-100 text-emerald-600"
                        />

                    </div>

                    {/* Secondary Statistics */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mt-6">

                        <div className="bg-white border border-slate-200 rounded-2xl p-5">
                            <div className="flex justify-between items-center">
                                <p className="text-sm text-slate-500">
                                    Assessments
                                </p>
                                <ClipboardCheck
                                    className="text-purple-500"
                                    size={21}
                                />
                            </div>

                            <h2 className="text-3xl font-bold mt-3 text-slate-900">
                                {stats.assessments}
                            </h2>
                        </div>

                        <div className="bg-white border border-slate-200 rounded-2xl p-5">
                            <div className="flex justify-between items-center">
                                <p className="text-sm text-slate-500">
                                    Rejected
                                </p>
                                <XCircle
                                    className="text-red-500"
                                    size={21}
                                />
                            </div>

                            <h2 className="text-3xl font-bold mt-3 text-slate-900">
                                {stats.rejected}
                            </h2>
                        </div>

                        <div className="bg-white border border-slate-200 rounded-2xl p-5">
                            <div className="flex justify-between items-center">
                                <p className="text-sm text-slate-500">
                                    Success Rate
                                </p>
                                <TrendingUp
                                    className="text-emerald-500"
                                    size={21}
                                />
                            </div>

                            <h2 className="text-3xl font-bold mt-3 text-emerald-600">
                                {stats.success_rate}%
                            </h2>
                        </div>

                    </div>

                    {/* Charts */}
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mt-6">

                        {/* Pie Chart */}
                        <div className="bg-white border border-slate-200 rounded-2xl p-6">

                            <div className="mb-5">
                                <h2 className="text-lg font-bold text-slate-900">
                                    Application Status
                                </h2>

                                <p className="text-sm text-slate-500 mt-1">
                                    Distribution of your applications
                                </p>
                            </div>

                            {stats.total_applications === 0 ? (
                                <div className="h-72 flex items-center justify-center text-slate-400">
                                    No application data available.
                                </div>
                            ) : (
                                <ResponsiveContainer width="100%" height={280}>
                                    <PieChart>
                                        <Pie
                                            data={chartData.filter(
                                                (item) => item.value > 0
                                            )}
                                            dataKey="value"
                                            nameKey="name"
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={65}
                                            outerRadius={95}
                                            paddingAngle={4}
                                        >
                                            {chartData
                                                .filter((item) => item.value > 0)
                                                .map((entry) => (
                                                    <Cell
                                                        key={entry.name}
                                                        fill={STATUS_COLORS[entry.name]}
                                                    />
                                                ))}
                                        </Pie>

                                        <Tooltip />
                                        <Legend />
                                    </PieChart>
                                </ResponsiveContainer>
                            )}
                        </div>

                        {/* Bar Chart */}
                        <div className="bg-white border border-slate-200 rounded-2xl p-6">

                            <div className="mb-5">
                                <h2 className="text-lg font-bold text-slate-900">
                                    Applications Overview
                                </h2>

                                <p className="text-sm text-slate-500 mt-1">
                                    Compare applications by status
                                </p>
                            </div>

                            <ResponsiveContainer width="100%" height={280}>
                                <BarChart
                                    data={chartData}
                                    margin={{
                                        top: 10,
                                        right: 10,
                                        left: -20,
                                        bottom: 5,
                                    }}
                                >
                                    <CartesianGrid
                                        strokeDasharray="3 3"
                                        vertical={false}
                                    />

                                    <XAxis
                                        dataKey="name"
                                        tick={{ fontSize: 11 }}
                                        axisLine={false}
                                        tickLine={false}
                                    />

                                    <YAxis
                                        allowDecimals={false}
                                        axisLine={false}
                                        tickLine={false}
                                    />

                                    <Tooltip />

                                    <Bar
                                        dataKey="value"
                                        name="Applications"
                                        radius={[6, 6, 0, 0]}
                                    >
                                        {chartData.map((entry) => (
                                            <Cell
                                                key={entry.name}
                                                fill={STATUS_COLORS[entry.name]}
                                            />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>

                    </div>

                    {/* Success Rate */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-6 mt-6">

                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h2 className="text-lg font-bold text-slate-900">
                                    Application Success Rate
                                </h2>

                                <p className="text-sm text-slate-500 mt-1">
                                    Based on your dashboard statistics
                                </p>
                            </div>

                            <span className="text-2xl font-bold text-emerald-600">
                                {stats.success_rate}%
                            </span>
                        </div>

                        <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                            <div
                                className="bg-emerald-500 h-3 rounded-full transition-all duration-700"
                                style={{
                                    width: `${Math.min(
                                        100,
                                        Math.max(0, Number(stats.success_rate) || 0)
                                    )}%`,
                                }}
                            />
                        </div>
                    </div>

                    {/* Recent Applications */}
                    <div className="bg-white border border-slate-200 rounded-2xl mt-6 overflow-hidden">

                        <div className="p-6 border-b border-slate-200 flex items-center justify-between">
                            <div>
                                <h2 className="text-lg font-bold text-slate-900">
                                    Recent Applications
                                </h2>

                                <p className="text-sm text-slate-500 mt-1">
                                    Your latest job applications
                                </p>
                            </div>

                            <a
                                href="/applications"
                                className="flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700"
                            >
                                View all
                                <ArrowUpRight size={16} />
                            </a>
                        </div>

                        {recentJobs.length === 0 ? (
                            <div className="p-10 text-center text-slate-500">
                                No applications added yet.
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">

                                    <thead className="bg-slate-50 text-slate-500 text-sm">
                                        <tr>
                                            <th className="px-6 py-4 font-medium">
                                                Company
                                            </th>

                                            <th className="px-6 py-4 font-medium">
                                                Position
                                            </th>

                                            <th className="px-6 py-4 font-medium">
                                                Location
                                            </th>

                                            <th className="px-6 py-4 font-medium">
                                                Status
                                            </th>
                                        </tr>
                                    </thead>

                                    <tbody className="divide-y divide-slate-100">
                                        {recentJobs.map((job) => (
                                            <tr
                                                key={job.id}
                                                className="hover:bg-slate-50"
                                            >
                                                <td className="px-6 py-4 font-semibold text-slate-800">
                                                    {job.company_name}
                                                </td>

                                                <td className="px-6 py-4 text-slate-600">
                                                    {job.job_title}
                                                </td>

                                                <td className="px-6 py-4 text-slate-500">
                                                    {job.location || "Not specified"}
                                                </td>

                                                <td className="px-6 py-4">
                                                    <span
                                                        className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusStyle(job.status)}`}
                                                    >
                                                        {job.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>

                                </table>
                            </div>
                        )}

                    </div>
                </>
            )}

        </main>
    );
}