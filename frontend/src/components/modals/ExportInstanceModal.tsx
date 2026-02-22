import { Download, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import BaseModal from "./BaseModal";
import ModalIcon from "./ModalIcon";
import {
  exportInstance,
  getExportSize,
  type ExportResult,
} from "@/api/instance";
import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "motion/react";
import { onWSMessage, offWSMessage } from "@/hooks/useWebSocket";

interface ExportProgress {
  current: number;
  total: number;
  filename: string;
}

interface ExportInstanceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024)
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

const spring = { type: "spring" as const, bounce: 0, duration: 0.4 };

export default function ExportInstanceModal({
  isOpen,
  onClose,
}: ExportInstanceModalProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState<ExportProgress | null>(null);
  const [result, setResult] = useState<
    (ExportResult & { totalFiles: number }) | null
  >(null);
  const [estimatedBytes, setEstimatedBytes] = useState<number | null>(null);

  useEffect(() => {
    if (isOpen) {
      getExportSize()
        .then(setEstimatedBytes)
        .catch(() => setEstimatedBytes(null));
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isExporting) return;

    const listener = (message: { type: string; payload: unknown }) => {
      if (message.type === "export_progress") {
        const p = message.payload as ExportProgress;
        setProgress({ ...p });
      }
    };

    onWSMessage(listener);
    return () => offWSMessage(listener);
  }, [isExporting]);

  const handleExport = async () => {
    try {
      setIsExporting(true);
      setProgress(null);
      setResult(null);
      const exportResult = await exportInstance();
      setResult({
        ...exportResult,
        totalFiles: progress?.total ?? 0,
      });
    } catch (error) {
      console.error("Export failed:", error);
    } finally {
      setIsExporting(false);
    }
  };

  const handleClose = () => {
    setResult(null);
    setProgress(null);
    onClose();
  };

  const isDone = !!result;
  const pct = progress
    ? Math.round((progress.current / progress.total) * 100)
    : 0;

  return (
    <BaseModal isOpen={isOpen} onClose={handleClose} disableClose={isExporting}>
      <div className="p-6 md:p-8">
        {/* Icon */}
        <ModalIcon icon={isDone ? Check : Download} variant="default" />

        {/* Title */}
        <h2 className="text-2xl font-semibold text-white text-center mb-3">
          {isDone ? "Export Complete" : "Export Instance"}
        </h2>

        {/* Description — hides when done */}
        <AnimatePresence initial={false}>
          {!isDone && (
            <motion.div
              key="description"
              initial={{ opacity: 0, height: 0, filter: "blur(4px)" }}
              animate={{ opacity: 1, height: "auto", filter: "blur(0px)" }}
              exit={{ opacity: 0, height: 0, filter: "blur(4px)" }}
              transition={spring}
              className="overflow-hidden"
            >
              <p className="text-sm text-muted-foreground text-center mb-6">
                Download a complete backup of your instance including all
                projects, tracks, and settings.
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Middle section: estimate / progress / result */}
        <AnimatePresence initial={false} mode="wait">
          {isDone ? (
            <motion.div
              key="result"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.4 }}
            >
              <div className="text-sm text-muted-foreground text-center mb-6 space-y-1">
                <p>
                  <span className="text-white font-medium">
                    {result.filename}
                  </span>
                </p>
                <p>
                  {result.totalFiles > 0 && (
                    <>{result.totalFiles} files &middot; </>
                  )}
                  {formatSize(result.sizeBytes)}
                </p>
              </div>
            </motion.div>
          ) : isExporting ? (
            <motion.div
              key="progress"
              initial={{ opacity: 0, height: 0, filter: "blur(4px)" }}
              animate={{ opacity: 1, height: "auto", filter: "blur(0px)" }}
              exit={{ opacity: 0, height: 0, filter: "blur(4px)" }}
              transition={spring}
              className="overflow-hidden"
            >
              <div className="mb-6 space-y-2">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>
                    {progress
                      ? `${progress.current} / ${progress.total} files`
                      : "Preparing..."}
                  </span>
                  <span>{pct}%</span>
                </div>
                <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#0099bb] rounded-full transition-all duration-150"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground truncate h-4">
                  {progress?.filename ?? "\u00A0"}
                </p>
              </div>
            </motion.div>
          ) : (
            estimatedBytes !== null && (
              <motion.div
                key="estimate"
                initial={{ opacity: 0, height: 0, filter: "blur(4px)" }}
                animate={{ opacity: 1, height: "auto", filter: "blur(0px)" }}
                exit={{ opacity: 0, height: 0, filter: "blur(4px)" }}
                transition={spring}
                className="overflow-hidden"
              >
                <p className="text-xs text-muted-foreground text-center mb-6">
                  Estimated size:{" "}
                  <span className="text-white font-medium">
                    {formatSize(estimatedBytes)}
                  </span>
                </p>
              </motion.div>
            )
          )}
        </AnimatePresence>

        {/* Buttons */}
        <AnimatePresence initial={false} mode="wait">
          {isDone ? (
            <motion.div
              key="done-btn"
              initial={{ opacity: 0, filter: "blur(4px)" }}
              animate={{ opacity: 1, filter: "blur(0px)" }}
              transition={{ ...spring, delay: 0.4 }}
            >
              <Button
                onClick={handleClose}
                className="w-full bg-[#0099bb] hover:bg-[#007a94] text-white font-medium"
              >
                Done
              </Button>
            </motion.div>
          ) : (
            <motion.div
              key="action-btns"
              exit={{ opacity: 0, filter: "blur(4px)" }}
              transition={spring}
              className="flex flex-col gap-3"
            >
              <Button
                onClick={handleExport}
                disabled={isExporting}
                className="w-full bg-[#0099bb] hover:bg-[#007a94] text-white font-medium"
              >
                {isExporting ? "Exporting..." : "Export"}
              </Button>
              <Button
                onClick={handleClose}
                disabled={isExporting}
                className="w-full"
              >
                Cancel
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </BaseModal>
  );
}
