interface Props {
  url: string;
  onClose: () => void;
}

export default function InvoicePreviewModal({ url, onClose }: Props) {
  return (
    <div
      className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-slate-100">
          <h3 className="font-bold">Fatura Önizleme</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        {url.endsWith('.pdf') ? (
          <iframe src={url} className="w-full h-[70vh]" title="Fatura" />
        ) : (
          <img src={url} alt="Fatura" className="w-full" />
        )}
      </div>
    </div>
  );
}
