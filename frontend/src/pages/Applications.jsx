
import { useEffect, useState } from "react";

import {
    Search,
    Plus,
    BriefcaseBusiness,
    MapPin,
    ChevronLeft,
    ChevronRight,
    RefreshCw,
    X,
    Pencil,
    Trash2,
    CalendarDays,
} from "lucide-react";

import api from "../services/api";

const initialForm = {
    company_name: "",
    job_title: "",
    location: "",
    job_type: "Full-time",
    status: "Applied",
    job_url: "",
    notes: "",
    follow_up_date: "",
};

export default function Applications() {
    const [jobs, setJobs] = useState([]);
    const [search, setSearch] = useState("");
    const [status, setStatus] = useState("");
    const [skip, setSkip] = useState(0);
    const limit = 10;

    const [total, setTotal] = useState(0);
    const [hasMore, setHasMore] = useState(false);
    const [loading, setLoading] = useState(true);

    const [showModal, setShowModal] = useState(false);
    const [editingJobId, setEditingJobId] = useState(null);
    const [deletingId, setDeletingId] = useState(null);

    const [form, setForm] = useState(initialForm);
    const [saving, setSaving] = useState(false);

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    // ==========================================
    // FETCH APPLICATIONS
    // ==========================================

    const fetchJobs = async (filters = {}) => {
        try {
            setLoading(true);
            setError("");

            const currentSearch = filters.search ?? search;
            const currentStatus = filters.status ?? status;
            const currentSkip = filters.skip ?? skip;

            const response = await api.get("/jobs/", {
                params: {
                    search: currentSearch || undefined,
                    status: currentStatus || undefined,
                    skip: currentSkip,
                    limit,
                },
            });

            setJobs(response.data.jobs);
            setTotal(response.data.total);
            setHasMore(response.data.has_more);
        } catch (err) {
            console.error("Fetch jobs error:", err);

            setError(
                err.response?.data?.detail ||
                "Unable to load applications."
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchJobs();
    }, [search, status, skip]);

    // ==========================================
    // FORM HANDLER
    // ==========================================

    const handleFormChange = (e) => {
        const { name, value } = e.target;

        setForm((previous) => ({
            ...previous,
            [name]: value,
        }));
    };

    // ==========================================
    // OPEN ADD MODAL
    // ==========================================

    const openAddModal = () => {
        setEditingJobId(null);
        setForm(initialForm);
        setError("");
        setSuccess("");
        setShowModal(true);
    };

    // ==========================================
    // EDIT APPLICATION
    // ==========================================

    const handleEditJob = (job) => {
        setEditingJobId(job.id);

        setForm({
            company_name: job.company_name || "",
            job_title: job.job_title || "",
            location: job.location || "",
            job_type: job.job_type || "Full-time",
            status: job.status || "Applied",
            job_url: job.job_url || "",
            notes: job.notes || "",
            follow_up_date: job.follow_up_date || "",
        });

        setError("");
        setSuccess("");
        setShowModal(true);
    };

    // ==========================================
    // ADD OR UPDATE APPLICATION
    // ==========================================

    const handleSaveJob = async (e) => {
        e.preventDefault();

        try {
            setSaving(true);
            setError("");
            setSuccess("");

            const payload = {
                ...form,
                follow_up_date: form.follow_up_date || null,
            };

            if (editingJobId !== null) {
                // UPDATE EXISTING APPLICATION
                await api.put(
                    `/jobs/${editingJobId}`,
                    payload
                );

                setSuccess("Application updated successfully!");
            } else {
                // CREATE NEW APPLICATION
                await api.post("/jobs/", payload);

                setSuccess("Application added successfully!");
            }

            setForm(initialForm);
            setEditingJobId(null);
            setShowModal(false);

            // Reset filters and pagination
            setSearch("");
            setStatus("");
            setSkip(0);

            // Fetch updated applications
            await fetchJobs({
                search: "",
                status: "",
                skip: 0,
            });

        } catch (err) {
            console.error("Save job error:", err);

            setError(
                err.response?.data?.detail ||
                "Unable to save application."
            );
        } finally {
            setSaving(false);
        }
    };

    // ==========================================
    // DELETE APPLICATION
    // ==========================================

    const handleDeleteJob = async (jobId) => {
        const confirmed = window.confirm(
            "Are you sure you want to delete this application?"
        );

        if (!confirmed) return;

        try {
            setDeletingId(jobId);
            setError("");
            setSuccess("");

            await api.delete(`/jobs/${jobId}`);

            setSuccess("Application deleted successfully!");

            if (jobs.length === 1 && skip > 0) {
                const previousSkip = Math.max(0, skip - limit);

                setSkip(previousSkip);

                await fetchJobs({
                    skip: previousSkip,
                });
            } else {
                await fetchJobs();
            }

        } catch (err) {
            console.error("Delete job error:", err);

            setError(
                err.response?.data?.detail ||
                "Unable to delete application."
            );
        } finally {
            setDeletingId(null);
        }
    };

    // ==========================================
    // CLOSE MODAL
    // ==========================================

    const closeModal = () => {
        setShowModal(false);
        setEditingJobId(null);
        setForm(initialForm);
        setError("");
    };

    // ==========================================
    // STATUS BADGE STYLING
    // ==========================================

    const getStatusStyle = (jobStatus) => {
        const styles = {
            Applied: "bg-blue-100 text-blue-700",
            Assessment: "bg-purple-100 text-purple-700",
            Interview: "bg-orange-100 text-orange-700",
            Offer: "bg-emerald-100 text-emerald-700",
            Rejected: "bg-red-100 text-red-700",
        };

        return styles[jobStatus] || "bg-slate-100 text-slate-600";
    };

    // ==========================================
    // MAIN UI
    // ==========================================

    return (
        <main className="flex-1 min-w-0 p-5 md:p-8">

            {/* HEADER */}

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
                <div>
                    <p className="text-sm text-slate-500">
                        Workspace / Applications
                    </p>

                    <h1 className="text-3xl font-bold text-slate-900 mt-2">
                        Job Applications
                    </h1>

                    <p className="text-slate-500 mt-2">
                        Manage and track your job search.
                    </p>
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={() => fetchJobs()}
                        disabled={loading}
                        className="flex items-center justify-center gap-2 border border-slate-200 bg-white px-4 py-3 rounded-xl hover:bg-slate-50 disabled:opacity-50"
                    >
                        <RefreshCw size={18} />
                        Refresh
                    </button>

                    <button
                        onClick={openAddModal}
                        className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-xl"
                    >
                        <Plus size={19} />
                        Add Application
                    </button>
                </div>
            </div>

            {/* SUCCESS MESSAGE */}

            {success && (
                <div className="bg-emerald-50 text-emerald-700 p-4 rounded-xl mb-5 flex justify-between items-center">
                    <span>{success}</span>

                    <button onClick={() => setSuccess("")}>
                        <X size={18} />
                    </button>
                </div>
            )}

            {/* ERROR MESSAGE */}

            {error && !showModal && (
                <div className="bg-red-50 text-red-700 p-4 rounded-xl mb-5 flex justify-between items-center">
                    <span>{error}</span>

                    <button onClick={() => setError("")}>
                        <X size={18} />
                    </button>
                </div>
            )}

            {/* SEARCH AND FILTER */}

            <div className="bg-white border border-slate-200 rounded-2xl p-4 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                    <div className="relative">
                        <Search
                            size={19}
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                        />

                        <input
                            type="text"
                            value={search}
                            onChange={(e) => {
                                setSearch(e.target.value);
                                setSkip(0);
                            }}
                            placeholder="Search company or job title..."
                            className="w-full border border-slate-200 rounded-xl pl-10 pr-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <select
                        value={status}
                        onChange={(e) => {
                            setStatus(e.target.value);
                            setSkip(0);
                        }}
                        className="w-full border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="">All statuses</option>
                        <option value="Applied">Applied</option>
                        <option value="Assessment">Assessment</option>
                        <option value="Interview">Interview</option>
                        <option value="Offer">Offer</option>
                        <option value="Rejected">Rejected</option>
                    </select>

                </div>
            </div>

            {/* APPLICATIONS TABLE */}

            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">

                <div className="p-5 border-b border-slate-200 flex items-center justify-between">
                    <h2 className="font-semibold text-lg">
                        All Applications
                    </h2>

                    <span className="text-sm text-slate-500">
                        {total} applications
                    </span>
                </div>

                {loading ? (
                    <div className="p-12 text-center text-slate-500">
                        Loading applications...
                    </div>
                ) : jobs.length === 0 ? (
                    <div className="p-12 text-center">
                        <BriefcaseBusiness
                            size={40}
                            className="mx-auto text-slate-300 mb-4"
                        />

                        <h3 className="font-semibold text-slate-800">
                            No applications found
                        </h3>

                        <p className="text-sm text-slate-500 mt-2">
                            Try changing your search or add a new application.
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">

                            <thead className="bg-slate-50 text-slate-500 text-sm">
                                <tr>
                                    <th className="px-5 py-4 font-medium">
                                        Company
                                    </th>

                                    <th className="px-5 py-4 font-medium">
                                        Position
                                    </th>

                                    <th className="px-5 py-4 font-medium">
                                        Location
                                    </th>

                                    <th className="px-5 py-4 font-medium">
                                        Type
                                    </th>

                                    <th className="px-5 py-4 font-medium">
                                        Status
                                    </th>

                                    <th className="px-5 py-4 font-medium">
                                        Follow-up Date
                                    </th>

                                    <th className="px-5 py-4 font-medium">
                                        Actions
                                    </th>
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-slate-100">
                                {jobs.map((job) => (
                                    <tr
                                        key={job.id}
                                        className="hover:bg-slate-50"
                                    >
                                        <td className="px-5 py-4 font-semibold text-slate-800">
                                            {job.company_name}
                                        </td>

                                        <td className="px-5 py-4 text-slate-600">
                                            {job.job_title}
                                        </td>

                                        <td className="px-5 py-4 text-slate-500">
                                            <span className="flex items-center gap-1">
                                                <MapPin size={15} />
                                                {job.location || "Not specified"}
                                            </span>
                                        </td>

                                        <td className="px-5 py-4 text-slate-600">
                                            {job.job_type || "Not specified"}
                                        </td>

                                        <td className="px-5 py-4">
                                            <span
                                                className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusStyle(job.status)}`}
                                            >
                                                {job.status}
                                            </span>
                                        </td>

                                        <td className="px-5 py-4 text-slate-600 whitespace-nowrap">
                                            <span className="flex items-center gap-2">
                                                <CalendarDays
                                                    size={15}
                                                    className="text-slate-400"
                                                />

                                                {job.follow_up_date || "Not scheduled"}
                                            </span>
                                        </td>

                                        <td className="px-5 py-4">
                                            <div className="flex items-center gap-2">

                                                <button
                                                    onClick={() => handleEditJob(job)}
                                                    title="Edit application"
                                                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                                                >
                                                    <Pencil size={17} />
                                                </button>

                                                <button
                                                    onClick={() => handleDeleteJob(job.id)}
                                                    disabled={deletingId === job.id}
                                                    title="Delete application"
                                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-50"
                                                >
                                                    <Trash2 size={17} />
                                                </button>

                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>

                        </table>
                    </div>
                )}

                {/* PAGINATION */}

                <div className="p-5 border-t border-slate-200 flex items-center justify-between">
                    <p className="text-sm text-slate-500">
                        Showing {total === 0 ? 0 : skip + 1}–
                        {Math.min(skip + jobs.length, total)} of {total}
                    </p>

                    <div className="flex gap-2">
                        <button
                            disabled={skip === 0 || loading}
                            onClick={() => setSkip(Math.max(0, skip - limit))}
                            className="p-2 border rounded-lg disabled:opacity-40 hover:bg-slate-50"
                        >
                            <ChevronLeft size={20} />
                        </button>

                        <button
                            disabled={!hasMore || loading}
                            onClick={() => setSkip(skip + limit)}
                            className="p-2 border rounded-lg disabled:opacity-40 hover:bg-slate-50"
                        >
                            <ChevronRight size={20} />
                        </button>
                    </div>
                </div>

            </div>

            {/* ADD / EDIT MODAL */}

            {showModal && (
                <div className="fixed inset-0 z-50 bg-slate-950/50 flex items-center justify-center p-4">

                    <div className="bg-white w-full max-w-xl rounded-2xl shadow-xl max-h-[90vh] overflow-y-auto">

                        {/* MODAL HEADER */}

                        <div className="flex items-center justify-between p-6 border-b">
                            <div>
                                <h2 className="text-xl font-bold text-slate-900">
                                    {editingJobId !== null
                                        ? "Edit Job Application"
                                        : "Add Job Application"}
                                </h2>

                                <p className="text-sm text-slate-500 mt-1">
                                    Enter the job details below.
                                </p>
                            </div>

                            <button
                                onClick={closeModal}
                                className="p-2 hover:bg-slate-100 rounded-lg"
                            >
                                <X size={21} />
                            </button>
                        </div>

                        {/* MODAL FORM */}

                        <form
                            onSubmit={handleSaveJob}
                            className="p-6 space-y-4"
                        >

                            {/* COMPANY */}

                            <div>
                                <label className="block text-sm font-medium mb-2">
                                    Company name *
                                </label>

                                <input
                                    required
                                    name="company_name"
                                    value={form.company_name}
                                    onChange={handleFormChange}
                                    placeholder="e.g. Google"
                                    className="w-full border border-slate-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            {/* JOB TITLE */}

                            <div>
                                <label className="block text-sm font-medium mb-2">
                                    Job title *
                                </label>

                                <input
                                    required
                                    name="job_title"
                                    value={form.job_title}
                                    onChange={handleFormChange}
                                    placeholder="e.g. Backend Developer"
                                    className="w-full border border-slate-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            {/* LOCATION AND JOB TYPE */}

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                                <div>
                                    <label className="block text-sm font-medium mb-2">
                                        Location
                                    </label>

                                    <input
                                        name="location"
                                        value={form.location}
                                        onChange={handleFormChange}
                                        placeholder="Bengaluru"
                                        className="w-full border border-slate-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2">
                                        Job type
                                    </label>

                                    <select
                                        name="job_type"
                                        value={form.job_type}
                                        onChange={handleFormChange}
                                        className="w-full border border-slate-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option>Full-time</option>
                                        <option>Part-time</option>
                                        <option>Internship</option>
                                        <option>Contract</option>
                                        <option>Remote</option>
                                    </select>
                                </div>

                            </div>

                            {/* APPLICATION STATUS */}

                            <div>
                                <label className="block text-sm font-medium mb-2">
                                    Application status
                                </label>

                                <select
                                    name="status"
                                    value={form.status}
                                    onChange={handleFormChange}
                                    className="w-full border border-slate-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option>Applied</option>
                                    <option>Assessment</option>
                                    <option>Interview</option>
                                    <option>Offer</option>
                                    <option>Rejected</option>
                                </select>
                            </div>

                            {/* FOLLOW-UP DATE */}

                            <div>
                                <label className="block text-sm font-medium mb-2">
                                    Follow-up Date
                                </label>

                                <input
                                    type="date"
                                    name="follow_up_date"
                                    value={form.follow_up_date}
                                    onChange={handleFormChange}
                                    className="w-full border border-slate-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-500"
                                />

                                <p className="text-xs text-slate-500 mt-1">
                                    Schedule a date to follow up with the company.
                                </p>
                            </div>

                            {/* JOB URL */}

                            <div>
                                <label className="block text-sm font-medium mb-2">
                                    Job URL
                                </label>

                                <input
                                    type="url"
                                    name="job_url"
                                    value={form.job_url}
                                    onChange={handleFormChange}
                                    placeholder="https://company.com/careers"
                                    className="w-full border border-slate-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            {/* NOTES */}

                            <div>
                                <label className="block text-sm font-medium mb-2">
                                    Notes
                                </label>

                                <textarea
                                    name="notes"
                                    rows="3"
                                    value={form.notes}
                                    onChange={handleFormChange}
                                    placeholder="Add any additional notes..."
                                    className="w-full border border-slate-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            {/* ERROR */}

                            {error && (
                                <p className="text-sm text-red-600">
                                    {error}
                                </p>
                            )}

                            {/* FORM BUTTONS */}

                            <div className="flex justify-end gap-3 pt-3">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="px-5 py-3 border rounded-xl hover:bg-slate-50"
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl disabled:opacity-60"
                                >
                                    {saving
                                        ? "Saving..."
                                        : editingJobId !== null
                                            ? "Update Application"
                                            : "Save Application"}
                                </button>
                            </div>

                        </form>

                    </div>
                </div>
            )}

        </main>
    );
}
