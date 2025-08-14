import { useState } from "react";
import axiosInstance from "../utils/axiosInstance";

export function useExportModal({ endpoint, getParams, filenamePrefix }) {
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportFormat, setExportFormat] = useState("csv");
  const [exportLoading, setExportLoading] = useState(false);

  const handleExport = async () => {
    setExportLoading(true);
    try {
      const params = new URLSearchParams(getParams ? getParams() : {});
      const url = `${endpoint}/${exportFormat}?${params.toString()}`;
      const response = await axiosInstance.get(url, { responseType: "blob" });
      const dateStr = new Date().toISOString().split("T")[0];
      const filename = `${filenamePrefix}_${dateStr}.${exportFormat}`;
      const blob = new Blob([response.data], {
        type: exportFormat === "csv" ? "text/csv" : "application/pdf",
      });
      const link = document.createElement("a");
      link.href = window.URL.createObjectURL(blob);
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setShowExportModal(false);
    } catch (error) {
      alert("Failed to export. Please try again.");
    } finally {
      setExportLoading(false);
    }
  };

  return {
    showExportModal,
    setShowExportModal,
    exportFormat,
    setExportFormat,
    exportLoading,
    handleExport,
  };
} 