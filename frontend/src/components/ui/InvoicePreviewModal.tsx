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
        className="bg-zinc-900 border border-white/10 rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-auto shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-white/[0.07]">
          <h3 className="font-bold text-white text-sm">Fatura Önizleme</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white/60 hover:text-white"
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
