import type { EmployeeDocument } from "@/types/employee";

interface DocumentsSectionProps {
  documents: EmployeeDocument[];
  onChange: (next: EmployeeDocument[]) => void;
  disabled?: boolean;
}

const inputClass =
  "w-full rounded-xl border border-outline-variant/40 bg-surface-container-low px-3.5 py-2.5 font-body-md text-sm text-on-surface outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all";

const labelClass =
  "block font-label-md text-xs font-medium text-on-surface-variant";

const DocumentsSection = ({
  documents,
  onChange,
  disabled,
}: DocumentsSectionProps) => {
  const update = (index: number, patch: Partial<EmployeeDocument>) => {
    const next = documents.map((doc, i) =>
      i === index ? { ...doc, ...patch } : doc
    );
    onChange(next);
  };

  const remove = (index: number) => {
    onChange(documents.filter((_, i) => i !== index));
  };

  const add = () => {
    onChange([
      ...documents,
      { documentType: "", documentNumber: "", documentUrl: "" },
    ]);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-label-md text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
            Documents
          </p>
          <p className="font-body-sm text-[11px] text-on-surface-variant/70 mt-0.5">
            Store links to identity, address or contract documents.
          </p>
        </div>
        {!disabled && (
          <button
            type="button"
            onClick={add}
            className="inline-flex items-center gap-1.5 rounded-xl border border-outline-variant/40 bg-surface-container-low px-3.5 py-2 font-label-md text-xs font-bold text-on-surface hover:bg-surface-container transition-colors"
          >
            <span className="material-symbols-outlined text-base">add</span>
            Add Document
          </button>
        )}
      </div>

      {documents.length === 0 ? (
        <div className="rounded-xl border border-dashed border-outline-variant/40 px-4 py-6 text-center">
          <span className="material-symbols-outlined text-3xl text-outline-variant/70">
            description
          </span>
          <p className="font-body-sm text-xs text-on-surface-variant/70 mt-1">
            No documents added yet.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {documents.map((doc, index) => (
            <div
              key={index}
              className="grid grid-cols-1 sm:grid-cols-12 gap-3 rounded-xl border border-outline-variant/30 bg-surface-container-low p-3.5"
            >
              <div className="sm:col-span-3 space-y-1.5">
                <label className={labelClass} htmlFor={`doc-type-${index}`}>
                  Document Type
                </label>
                <input
                  id={`doc-type-${index}`}
                  type="text"
                  placeholder="e.g. Aadhaar Card"
                  value={doc.documentType}
                  onChange={(e) =>
                    update(index, { documentType: e.target.value })
                  }
                  disabled={disabled}
                  className={inputClass}
                />
              </div>
              <div className="sm:col-span-3 space-y-1.5">
                <label className={labelClass} htmlFor={`doc-num-${index}`}>
                  Document Number
                </label>
                <input
                  id={`doc-num-${index}`}
                  type="text"
                  placeholder="Optional"
                  value={doc.documentNumber ?? ""}
                  onChange={(e) =>
                    update(index, { documentNumber: e.target.value })
                  }
                  disabled={disabled}
                  className={inputClass}
                />
              </div>
              <div className="sm:col-span-5 space-y-1.5">
                <label className={labelClass} htmlFor={`doc-url-${index}`}>
                  Document URL
                </label>
                <input
                  id={`doc-url-${index}`}
                  type="url"
                  placeholder="https://..."
                  value={doc.documentUrl}
                  onChange={(e) =>
                    update(index, { documentUrl: e.target.value })
                  }
                  disabled={disabled}
                  className={inputClass}
                />
              </div>
              <div className="sm:col-span-1 flex items-end justify-end">
                {!disabled && (
                  <button
                    type="button"
                    onClick={() => remove(index)}
                    aria-label="Remove document"
                    className="flex h-10 w-10 items-center justify-center rounded-xl border border-outline-variant/40 text-error hover:bg-error/10 transition-colors"
                  >
                    <span className="material-symbols-outlined text-lg">
                      delete
                    </span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DocumentsSection;
