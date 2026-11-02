
export default function StatCard({ title, value, icon: Icon, color }) {
    return (
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <div className="flex justify-between items-center">
                <p className="text-sm text-slate-500">{title}</p>

                <div className={`p-3 rounded-xl ${color}`}>
                    <Icon size={21} />
                </div>
            </div>

            <h2 className="text-3xl font-bold text-slate-900 mt-5">
                {value}
            </h2>
        </div>
    );
}
