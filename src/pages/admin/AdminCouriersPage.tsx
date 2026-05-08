import AdminCourierApplicationsTab from "@/components/admin/AdminCourierApplicationsTab";
import AdminCouriersManageTab from "@/components/admin/AdminCouriersManageTab";

export default function AdminCouriersPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <AdminCouriersManageTab />
      <AdminCourierApplicationsTab />
    </div>
  );
}