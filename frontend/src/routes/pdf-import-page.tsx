import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { useTranslation } from "react-i18next";
import i18n from "~/lib/i18n";
import {
  FileImage,
  Upload,
  CheckSquare,
  Square,
  Loader2,
  ArrowLeft,
  ArrowRight,
  Check,
  FileX,
} from "lucide-react";
import { toast } from "sonner";
import {
  uploadPdf,
  pollPdfStatus,
  confirmPdfSelection,
  type PdfExtractedItem,
} from "~/functions/pdf_import";
import { getSessionToken } from "~/functions/get_session_token";
import { Progress } from "~/components/ui/progress";

async function fetchThumbnailAsObjectUrl(thumbnailUrl: string): Promise<string> {
  const token = getSessionToken();
  const response = await fetch(thumbnailUrl, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error("Failed to load thumbnail");
  const blob = await response.blob();
  return URL.createObjectURL(blob);
}

type Step = "upload" | "select" | "confirm";

const POLL_INTERVAL_MS = 1500;
const MAX_PDF_SIZE = 50 * 1024 * 1024;

export default function PdfImportPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const clientUsername = searchParams.get("client") ?? "";

  const [step, setStep] = useState<Step>("upload");

  // Upload step
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Session / extraction
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [items, setItems] = useState<PdfExtractedItem[]>([]);
  const [thumbnailUrls, setThumbnailUrls] = useState<Record<number, string>>({});
  const [isExtracting, setIsExtracting] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const objectUrlsRef = useRef<string[]>([]);

  // Select step
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());

  // Confirm step
  const [names, setNames] = useState<Record<number, string>>({});
  const [isConfirming, setIsConfirming] = useState(false);

  // Cleanup poll and object URLs on unmount
  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      objectUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);

  // --- Polling ---
  const startPolling = useCallback((sid: string) => {
    setIsExtracting(true);
    pollRef.current = setInterval(async () => {
      try {
        const status = await pollPdfStatus(sid);
        setProgress({ current: status.progressCurrent, total: status.progressTotal });

        if (status.status === "DONE") {
          if (pollRef.current) clearInterval(pollRef.current);
          const extractedItems = status.items ?? [];
          setItems(extractedItems);

          // Fetch thumbnails with auth token and convert to object URLs
          const urlMap: Record<number, string> = {};
          await Promise.all(
            extractedItems.map(async (item) => {
              try {
                const objectUrl = await fetchThumbnailAsObjectUrl(item.thumbnailUrl);
                objectUrlsRef.current.push(objectUrl);
                urlMap[item.index] = objectUrl;
              } catch {
                // leave broken — grid shows muted bg fallback
              }
            }),
          );
          setThumbnailUrls(urlMap);
          setIsExtracting(false);
          setStep("select");
        } else if (status.status === "FAILED") {
          if (pollRef.current) clearInterval(pollRef.current);
          setIsExtracting(false);
          toast.error(i18n.t("pdfImport.extractionFailed"), {
            description: status.error ?? i18n.t("pdfImport.extractionFailedDescription"),
          });
          setStep("upload");
          setSessionId(null);
        }
      } catch (err) {
        if (pollRef.current) clearInterval(pollRef.current);
        setIsExtracting(false);
        const message = err instanceof Error ? err.message : "";
        if (message.includes("expired") || message.includes("not found")) {
          toast.error(i18n.t("pdfImport.sessionExpired"), {
            description: i18n.t("pdfImport.sessionExpiredDescription"),
          });
        } else {
          toast.error(i18n.t("pdfImport.lostConnection"), {
            description: i18n.t("pdfImport.lostConnectionDescription"),
          });
        }
        setStep("upload");
        setSessionId(null);
      }
    }, POLL_INTERVAL_MS);
  }, []);

  // --- Upload ---
  const handleFile = useCallback(
    async (file: File) => {
      if (file.type !== "application/pdf") {
        toast.error(i18n.t("pdfImport.invalidFileType"), { description: i18n.t("pdfImport.invalidFileTypeDescription") });
        return;
      }
      if (file.size > MAX_PDF_SIZE) {
        toast.error(i18n.t("pdfImport.fileTooLarge"), { description: i18n.t("pdfImport.fileTooLargeDescription") });
        return;
      }

      setIsUploading(true);
      try {
        const result = await uploadPdf(file);
        setSessionId(result.sessionId);
        setProgress({ current: 0, total: 0 });
        setIsUploading(false);
        startPolling(result.sessionId);
      } catch (err) {
        setIsUploading(false);
        toast.error(i18n.t("pdfImport.uploadFailed"), {
          description: err instanceof Error ? err.message : i18n.t("pdfImport.unknownError"),
        });
      }
    },
    [startPolling],
  );

  const onFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = "";
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  // --- Select step ---
  const toggleSelect = (index: number) => {
    setSelectedIndices((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedIndices.size === items.length) {
      setSelectedIndices(new Set());
    } else {
      setSelectedIndices(new Set(items.map((i) => i.index)));
    }
  };

  const goToConfirm = () => {
    if (selectedIndices.size === 0) {
      toast.error(i18n.t("pdfImport.noImagesSelected"), { description: i18n.t("pdfImport.noImagesSelectedDescription") });
      return;
    }
    // Pre-fill names from labels
    const initial: Record<number, string> = {};
    items
      .filter((i) => selectedIndices.has(i.index))
      .forEach((i) => {
        initial[i.index] = i.label;
      });
    setNames(initial);
    setStep("confirm");
  };

  // --- Confirm step ---
  const handleConfirm = async () => {
    if (!sessionId) return;
    const indices = Array.from(selectedIndices);
    const nameList = indices.map((idx) => names[idx] ?? "");

    setIsConfirming(true);
    try {
      const result = await confirmPdfSelection(sessionId, indices, nameList, clientUsername);
      toast.success(i18n.t("pdfImport.blueprintsSaved", { count: result.blueprintUrls.length }));

      // Navigate to editor with first blueprint URL
      const firstUrl = result.blueprintUrls[0];
      const params = new URLSearchParams();
      if (clientUsername) params.set("client", clientUsername);
      if (firstUrl) params.set("blueprint", firstUrl);
      navigate(`/topology-editor?${params.toString()}`);
    } catch (err) {
      setIsConfirming(false);
      const message = err instanceof Error ? err.message : "";
      if (message === "SESSION_EXPIRED") {
        toast.error(i18n.t("pdfImport.sessionExpired"), {
          description: i18n.t("pdfImport.sessionExpiredDescription"),
        });
        setStep("upload");
        setSessionId(null);
        setSelectedIndices(new Set());
        setItems([]);
      } else {
        toast.error(i18n.t("pdfImport.saveBlueprintsFailed"), {
          description: message || i18n.t("pdfImport.unknownError"),
        });
      }
    }
  };

  const selectedItems = items.filter((i) => selectedIndices.has(i.index));

  // --- Render helpers ---
  const stepNumber = step === "upload" ? 1 : step === "select" ? 2 : 3;

  return (
    <div className="h-full bg-background flex flex-col overflow-hidden">
      {/* Header */}
      <div className="border-b border-border bg-card px-6 py-4 flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded hover:bg-accent transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div>
          <h1 className="text-lg font-semibold">{t("pdfImport.headerTitle")}</h1>
          <p className="text-sm text-muted-foreground">
            {t("pdfImport.headerSubtitle")}
          </p>
        </div>
      </div>

      {/* Stepper */}
      <div className="flex items-center justify-center gap-0 px-6 py-5 border-b border-border bg-card">
        {[
          { n: 1, label: t("pdfImport.stepUpload") },
          { n: 2, label: t("pdfImport.stepSelect") },
          { n: 3, label: t("pdfImport.stepConfirm") },
        ].map(({ n, label }, i) => (
          <div key={n} className="flex items-center">
            <div className="flex flex-col items-center gap-1">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                  stepNumber > n
                    ? "bg-primary text-primary-foreground"
                    : stepNumber === n
                      ? "bg-primary text-primary-foreground ring-4 ring-primary/20"
                      : "bg-muted text-muted-foreground"
                }`}
              >
                {stepNumber > n ? <Check className="h-4 w-4" /> : n}
              </div>
              <span
                className={`text-xs whitespace-nowrap ${stepNumber === n ? "text-foreground font-medium" : "text-muted-foreground"}`}
              >
                {label}
              </span>
            </div>
            {i < 2 && (
              <div
                className={`w-16 h-px mx-2 mb-4 transition-colors ${stepNumber > n ? "bg-primary" : "bg-border"}`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col items-center justify-start p-6 pb-10">
        {/* ── Step 1: Upload ── */}
        {(step === "upload" || isExtracting) && (
          <div className="w-full max-w-lg flex flex-col gap-6">
            {/* Drop zone — disabled while extracting */}
            <div
              onDragOver={(e) => { e.preventDefault(); if (!isExtracting && !isUploading) setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={isExtracting || isUploading ? undefined : onDrop}
              onClick={() => !isExtracting && !isUploading && fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-12 flex flex-col items-center gap-4 transition-colors ${
                isExtracting || isUploading
                  ? "border-border opacity-50 cursor-not-allowed"
                  : isDragging
                    ? "border-primary bg-primary/5 cursor-copy"
                    : "border-border hover:border-primary/50 hover:bg-accent/30 cursor-pointer"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf"
                onChange={onFileInputChange}
                className="hidden"
              />
              {isUploading ? (
                <Loader2 className="h-10 w-10 text-primary animate-spin" />
              ) : (
                <FileImage className="h-10 w-10 text-muted-foreground" />
              )}
              <div className="text-center">
                <p className="font-medium">
                  {isUploading ? t("pdfImport.uploading") : t("pdfImport.dropHere")}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {isUploading ? t("pdfImport.pleaseWait") : t("pdfImport.clickToBrowse")}
                </p>
              </div>
            </div>

            {/* Extraction progress */}
            {isExtracting && (
              <div className="flex flex-col gap-3 bg-card border border-border rounded-xl p-5">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  <span className="text-sm font-medium">{t("pdfImport.extracting")}</span>
                  {progress.total > 0 && (
                    <span className="text-sm text-muted-foreground ml-auto">
                      {progress.current} / {progress.total}
                    </span>
                  )}
                </div>
                <Progress
                  value={
                    progress.total > 0
                      ? Math.round((progress.current / progress.total) * 100)
                      : undefined
                  }
                  className="h-2"
                />
                <p className="text-xs text-muted-foreground">
                  {t("pdfImport.extractingNote")}
                </p>
              </div>
            )}
          </div>
        )}

        {/* ── Step 2: Select ── */}
        {step === "select" && (
          <div className="w-full max-w-5xl flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  {t("pdfImport.imagesExtracted", { count: items.length })} —{" "}
                  <span className="text-foreground font-medium">
                    {t("pdfImport.selectedCount", { count: selectedIndices.size })}
                  </span>
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={toggleAll}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5"
                >
                  {selectedIndices.size === items.length ? (
                    <CheckSquare className="h-4 w-4" />
                  ) : (
                    <Square className="h-4 w-4" />
                  )}
                  {selectedIndices.size === items.length ? t("pdfImport.deselectAll") : t("pdfImport.selectAll")}
                </button>
                <button
                  onClick={goToConfirm}
                  disabled={selectedIndices.size === 0}
                  className="flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground text-sm rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {t("pdfImport.next")}
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>

            {items.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-16 text-muted-foreground">
                <FileX className="h-10 w-10" />
                <p className="text-sm">{t("pdfImport.noImagesExtracted")}</p>
                <button
                  onClick={() => setStep("upload")}
                  className="text-sm text-primary hover:underline"
                >
                  {t("pdfImport.uploadDifferent")}
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {items.map((item) => {
                  const selected = selectedIndices.has(item.index);
                  return (
                    <button
                      key={item.index}
                      onClick={() => toggleSelect(item.index)}
                      className={`relative rounded-lg overflow-hidden border-2 transition-all group text-left ${
                        selected
                          ? "border-primary ring-2 ring-primary/30"
                          : "border-border hover:border-primary/40"
                      }`}
                    >
                      <img
                        src={thumbnailUrls[item.index]}
                        alt={item.label}
                        className="w-full aspect-[4/3] object-cover bg-muted"
                        loading="lazy"
                      />
                      {/* Selection overlay */}
                      <div
                        className={`absolute inset-0 transition-opacity ${
                          selected ? "bg-primary/10" : "bg-transparent group-hover:bg-accent/20"
                        }`}
                      />
                      {/* Checkbox badge */}
                      <div
                        className={`absolute top-2 right-2 w-5 h-5 rounded flex items-center justify-center transition-colors ${
                          selected
                            ? "bg-primary text-primary-foreground"
                            : "bg-background/80 border border-border"
                        }`}
                      >
                        {selected && <Check className="h-3 w-3" />}
                      </div>
                      {/* Type badge */}
                      <div className="absolute top-2 left-2">
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-background/80 border border-border text-muted-foreground">
                          {item.type === "page" ? t("pdfImport.typePage") : t("pdfImport.typeImage")}
                        </span>
                      </div>
                      {/* Label */}
                      <div className="p-2 bg-card border-t border-border">
                        <p className="text-xs text-foreground truncate">{item.label}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {item.width}×{item.height}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── Step 3: Confirm ── */}
        {step === "confirm" && (
          <div className="w-full max-w-2xl flex flex-col gap-5">
            <p className="text-sm text-muted-foreground">
              {t("pdfImport.nameEachBlueprint")}
            </p>

            <div className="flex flex-col gap-3">
              {selectedItems.map((item) => (
                <div
                  key={item.index}
                  className="flex items-center gap-4 bg-card border border-border rounded-lg p-3"
                >
                  <img
                    src={thumbnailUrls[item.index]}
                    alt={item.label}
                    className="w-20 h-14 object-cover rounded bg-muted shrink-0"
                  />
                  <div className="flex flex-col gap-1 flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground">{item.label}</p>
                    <input
                      type="text"
                      value={names[item.index] ?? ""}
                      onChange={(e) =>
                        setNames((prev) => ({ ...prev, [item.index]: e.target.value }))
                      }
                      placeholder={t("pdfImport.blueprintNamePlaceholder")}
                      className="bg-secondary text-foreground text-sm rounded px-2 py-1.5 border border-border focus:outline-none focus:ring-2 focus:ring-ring w-full"
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                onClick={() => setStep("select")}
                disabled={isConfirming}
                className="flex items-center gap-1.5 px-4 py-2 bg-secondary text-foreground text-sm rounded-lg hover:bg-accent transition-colors disabled:opacity-50"
              >
                <ArrowLeft className="h-4 w-4" />
                {t("pdfImport.back")}
              </button>
              <button
                onClick={handleConfirm}
                disabled={isConfirming}
                className="flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground text-sm rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isConfirming ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4" />
                )}
                {isConfirming ? t("pdfImport.saving") : t("pdfImport.saveBlueprints", { count: selectedItems.length })}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
