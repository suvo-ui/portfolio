import { useEffect, useState } from "react";

import { Layout } from "@/components/Layout";
import { PrintsSection } from "@/components/PrintsSection";
import ArtworkModal from "@/components/ArtworkModal";
import type { Print } from "@/types/print";
import { useAuth } from "@/context/AuthContext";
import { apiUrl } from "@/lib/api";

export default function Prints() {
  const { isAdmin } = useAuth();
  const [prints, setPrints] = useState<Print[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPrint, setSelectedPrint] = useState<Print | null>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const fetchPrints = async () => {
      try {
        const response = await fetch(apiUrl("/api/prints"));
        if (!response.ok) throw new Error("Failed to fetch prints");
        const data = await response.json();
        setPrints(data);
      } catch (error) {
        console.error("Error fetching prints:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPrints();
  }, []);

  const handleOpenPrint = (print: Print) => {
    setSelectedPrint(print);
    setShowModal(true);
  };

  const handleEditPrint = (print: Print) => {
    // For now, perhaps redirect to admin or something
    // Since admin is separate, maybe not implement edit from here
  };

  const handleDeletePrint = async (id: number) => {
    if (!confirm("Are you sure you want to delete this print?")) return;
    try {
      const response = await fetch(apiUrl(`/api/admin/prints/${id}`), {
        method: "DELETE",
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to delete print");
      setPrints((prev) => prev.filter((p) => p.id !== id));
      alert("Print deleted successfully.");
    } catch (error) {
      console.error("Error deleting print:", error);
      alert("Failed to delete print.");
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading prints...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-background">
        <div className="pt-16">
          <PrintsSection
            prints={prints}
            isAdmin={isAdmin}
            onOpenPrint={handleOpenPrint}
            onEditPrint={handleEditPrint}
            onDeletePrint={handleDeletePrint}
          />
        </div>
      </div>

      <ArtworkModal
        artwork={selectedPrint}
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        isAdmin={isAdmin}
        onDelete={handleDeletePrint}
        onEdit={handleEditPrint}
      />
    </Layout>
  );
}
