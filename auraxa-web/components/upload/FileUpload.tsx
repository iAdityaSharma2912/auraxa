"use client";

import { useDropzone, type FileRejection } from "react-dropzone";
import { useCallback, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { UploadedFile, SupportedFileType } from "@/types";

const ACCEPTED_TYPES: Record<SupportedFileType, string[]> = {
  "image/jpeg": [".jpg", ".jpeg"],
  "image/png": [".png"],
  "image/heic": [".heic"],
  "text/plain": [".txt"],
  "application/json": [".json"],
};

const MAX_FILES = 3;
const MAX_SIZE_MB = 10;

interface FileUploadProps {
  onFilesChange: (files: UploadedFile[]) => void;
  disabled?: boolean;
}

function FileIcon({ type }: { type: string }) {
  if (type.startsWith("image/")) {
    return (
      <svg className="w-5 h-5 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <rect x="3" y="3" width="18" height="18" rx="2" strokeWidth="1.5" />
        <circle cx="8.5" cy="8.5" r="1.5" strokeWidth="1.5" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M21 15l-5-5L5 21" />
      </svg>
    );
  }
  return (
    <svg className="w-5 h-5 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  );
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

export default function FileUpload({ onFilesChange, disabled = false }: FileUploadProps) {
  const [files, setFiles] = useState<UploadedFile[]>([]);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const newFiles: UploadedFile[] = acceptedFiles.map((file) => ({
        file,
        status: "idle" as const,
        preview: file.type.startsWith("image/") ? URL.createObjectURL(file) : undefined,
      }));

      const updated = [...files, ...newFiles].slice(0, MAX_FILES);
      setFiles(updated);
      onFilesChange(updated);
    },
    [files, onFilesChange]
  );

  const removeFile = (index: number) => {
    const updated = files.filter((_, i) => i !== index);
    setFiles(updated);
    onFilesChange(updated);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPTED_TYPES,
    maxSize: MAX_SIZE_MB * 1024 * 1024,
    maxFiles: MAX_FILES,
    disabled: disabled || files.length >= MAX_FILES,
  });

  return (
    <div className="space-y-4">
      {/* Drop zone */}
      <div
        {...getRootProps()}
        className={`
          relative border-2 border-dashed rounded-2xl p-10 text-center transition-all duration-200 cursor-pointer
          ${isDragActive
            ? "border-violet-500/60 bg-violet-500/8"
            : files.length >= MAX_FILES || disabled
            ? "border-white/[0.05] opacity-50 cursor-not-allowed"
            : "border-white/[0.10] hover:border-violet-500/40 hover:bg-violet-500/4"
          }
        `}
      >
        <input {...getInputProps()} />

        {isDragActive && (
          <div className="absolute inset-0 rounded-2xl bg-violet-500/8 border-2 border-violet-500/50 flex items-center justify-center">
            <p className="font-syne text-violet-300 font-600">Drop files here</p>
          </div>
        )}

        <div className="flex flex-col items-center gap-4">
          {/* Upload icon */}
          <div className="w-14 h-14 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center">
            <svg className="w-6 h-6 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          </div>

          <div>
            <p className="font-syne font-600 text-white/60 mb-1">
              {files.length >= MAX_FILES ? "Maximum files reached" : "Drop your conversation here"}
            </p>
            <p className="text-sm text-white/30">
              Screenshots (.jpg, .png, .heic) · WhatsApp .txt · Telegram .json
            </p>
            <p className="text-xs text-white/20 mt-1.5">Up to {MAX_FILES} files · {MAX_SIZE_MB}MB each</p>
          </div>

          {files.length < MAX_FILES && !disabled && (
            <button
              type="button"
              className="px-5 py-2 bg-violet-500/15 hover:bg-violet-500/25 border border-violet-500/25 text-violet-300 text-sm font-medium rounded-xl transition-all duration-200"
            >
              Browse Files
            </button>
          )}
        </div>
      </div>

      {/* Supported formats */}
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-[11px] text-white/25 font-mono">Supports:</span>
        {["WhatsApp Screenshot", "WhatsApp .txt", "Telegram .json", "DM Screenshot"].map((f) => (
          <span key={f} className="text-[11px] text-white/30 bg-white/[0.04] px-2 py-1 rounded-md">
            {f}
          </span>
        ))}
      </div>

      {/* File list */}
      <AnimatePresence>
        {files.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-2"
          >
            {files.map((f, i) => (
              <motion.div
                key={`${f.file.name}-${i}`}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]"
              >
                {f.preview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={f.preview} alt="" className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                ) : (
                  <div className="w-10 h-10 rounded-lg bg-white/[0.05] flex items-center justify-center flex-shrink-0">
                    <FileIcon type={f.file.type} />
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white/70 truncate font-medium">{f.file.name}</p>
                  <p className="text-xs text-white/30">{formatBytes(f.file.size)}</p>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  {f.status === "idle" && (
                    <span className="text-[10px] text-white/25 font-mono">Ready</span>
                  )}
                  {f.status === "uploading" && (
                    <div className="w-4 h-4 border-2 border-violet-500/40 border-t-violet-400 rounded-full animate-spin" />
                  )}
                  {f.status === "done" && (
                    <span className="text-[10px] text-green-400/70 font-mono">Done</span>
                  )}
                  {f.status === "error" && (
                    <span className="text-[10px] text-red-400/70 font-mono">Error</span>
                  )}

                  {!disabled && (
                    <button
                      type="button"
                      onClick={() => removeFile(i)}
                      className="w-7 h-7 flex items-center justify-center rounded-lg text-white/20 hover:text-white/60 hover:bg-white/[0.06] transition-all duration-150"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
