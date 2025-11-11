// File: src/pages/admin/terms/index.tsx (updated with handleDelete local filter)
import { useState, useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import { TermsManagementTable } from "@/components/ui/admin/terms/terms-management-table";
import { TermsForm } from "@/components/ui/admin/terms/terms-form";
import { TermsViewModal } from "@/components/ui/admin/terms/terms-view-modal";
import { TermsHistoryModal } from "@/components/ui/admin/terms/terms-history-modal";
import { getAllTerms } from "@/services/terms/terms.api";
import { Terms } from "@/services/terms/terms.api";
import { toast } from "sonner";
import { Button } from "@/components/ui/common/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/common/card";
import { History } from "lucide-react";
import { Badge } from "@/components/ui/common/badge";

export default function AdminTermsPage() {
  const [termsList, setTermsList] = useState<Terms[]>([]);
  const [selectedTerms, setSelectedTerms] = useState<Terms | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTerms();
  }, []);

  const fetchTerms = async () => {
    try {
      setLoading(true);
      const data = await getAllTerms();
      setTermsList(data);
    } catch {
      toast.error("Lỗi tải danh sách điều khoản");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (terms: Terms) => {
    setSelectedTerms(terms);
    setIsEditModalOpen(true);
  };

  const handleView = (terms: Terms) => {
    setSelectedTerms(terms);
    setIsViewModalOpen(true);
  };

  const handleDelete = (id: string) => {
    // FIXED: Local filter after successful delete (API called in modal)
    setTermsList((prev) => prev.filter((t) => t._id !== id));
  };

  const handleCreateSuccess = () => {
    setIsEditModalOpen(false);
    setSelectedTerms(null);
    fetchTerms();
  };

  const handleCloseModal = () => {
    setIsEditModalOpen(false);
    setIsViewModalOpen(false);
    setSelectedTerms(null);
  };

  const handleOpenHistory = () => {
    setIsHistoryModalOpen(true);
  };

  const handleCloseHistory = () => {
    setIsHistoryModalOpen(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <div className="flex items-center gap-4">
            <CardTitle className="text-2xl font-bold text-gray-900">
              Quản Lý Điều Khoản
            </CardTitle>
            <Badge variant="secondary" className="bg-blue-100 text-blue-800">
              {termsList.filter((t) => t.isActive).length} active
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={handleOpenHistory}
              className="gap-2"
            >
              <History className="w-4 h-4" />
              Xem Lịch Sử
            </Button>
            <Button onClick={() => setIsEditModalOpen(true)}>Tạo Mới</Button>
          </div>
        </CardHeader>
      </Card>

      {/* Table */}
      <TermsManagementTable
        data={termsList.filter((t) => t.isActive)}
        onEdit={handleEdit}
        onView={handleView}
        isHistoryView={false}
      />

      {/* Create/Edit Modal */}
      <AnimatePresence>
        {isEditModalOpen && (
          <TermsForm
            isOpen={isEditModalOpen}
            onClose={handleCloseModal}
            terms={selectedTerms}
            onSuccess={handleCreateSuccess}
          />
        )}
      </AnimatePresence>

      {/* View Modal */}
      <AnimatePresence>
        {isViewModalOpen && selectedTerms && (
          <TermsViewModal terms={selectedTerms} onClose={handleCloseModal} />
        )}
      </AnimatePresence>

      {/* History Modal */}
      <AnimatePresence>
        {isHistoryModalOpen && (
          <TermsHistoryModal
            data={termsList.filter((t) => !t.isActive)}
            onView={handleView}
            onDelete={handleDelete}
            onClose={handleCloseHistory}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
