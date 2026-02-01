export default function Dashboard() {
  return (
    <div className="min-h-screen bg-background p-8">
      <h1 className="text-3xl font-bold text-primary mb-6">
        Dashboard
      </h1>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow">
          <h3 className="font-semibold">My Skills</h3>
          <p className="text-sm text-gray-500">3 skills listed</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow">
          <h3 className="font-semibold">Requests</h3>
          <p className="text-sm text-gray-500">2 pending exchanges</p>
        </div>
      </div>
    </div>
  );
}