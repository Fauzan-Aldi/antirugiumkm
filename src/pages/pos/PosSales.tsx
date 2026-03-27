import {useMemo, useState} from 'react';
import {History, Lock, ReceiptText} from 'lucide-react';
import jsPDF from 'jspdf';
import {usePos} from '../../pos/PosContext';
import type {PosSale} from '../../pos/types';

function formatRupiah(value: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  })
    .format(value)
    .replace('IDR', 'Rp');
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(d);
}

function formatDateOnly(iso: string) {
  const d = new Date(iso);
  return new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'medium',
  }).format(d);
}

function toLocalDateKey(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function SaleDetail({sale, onClose}: {sale: PosSale; onClose: () => void}) {
  return (
    <div className="fixed inset-0 z-50 bg-black/40 p-4 grid place-items-center" role="dialog" aria-modal="true">
      <div className="w-full max-w-xl rounded-2xl bg-white shadow-xl overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between">
          <div>
            <div className="text-sm font-black">Detail Penjualan</div>
            <div className="text-xs text-slate-500">{formatDate(sale.createdAt)}</div>
          </div>
          <button className="h-10 rounded-xl px-4 text-sm font-bold bg-slate-100 hover:bg-slate-200" onClick={onClose}>
            Tutup
          </button>
        </div>
        <div className="p-4 sm:p-5 space-y-4">
          <div className="rounded-xl bg-slate-50 p-3 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">Metode</span>
              <span className="font-bold">{sale.paymentMethod === 'tunai' ? 'Tunai' : 'Transfer'}</span>
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-slate-500">Subtotal</span>
              <span className="font-bold">{formatRupiah(sale.subtotal)}</span>
            </div>
            <div className="flex justify-between mt-2 border-t border-dashed border-slate-300 pt-2">
              <span className="text-slate-700 font-black">Total</span>
              <span className="font-black text-[#137fec]">{formatRupiah(sale.total)}</span>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 overflow-hidden">
            <div className="px-3 py-2 bg-white border-b border-slate-200 text-xs font-bold text-slate-600">
              Item
            </div>
            <div className="divide-y divide-slate-100">
              {sale.items.map((it) => (
                <div key={it.id} className="p-3 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-bold truncate">{it.name}</div>
                    <div className="text-xs text-slate-500">
                      {it.quantity} x {formatRupiah(it.price)}
                    </div>
                  </div>
                  <div className="font-black">{formatRupiah(it.price * it.quantity)}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ShiftDetailModal({
  dateKey,
  sales,
  onClose,
}: {
  dateKey: string;
  sales: PosSale[];
  onClose: () => void;
}) {
  const total = sales.reduce((acc, s) => acc + s.total, 0);
  return (
    <div className="fixed inset-0 z-50 bg-black/40 p-4 grid place-items-center" role="dialog" aria-modal="true">
      <div className="w-full max-w-2xl rounded-2xl bg-white shadow-xl overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between">
          <div>
            <div className="text-sm font-black">Detail Shift {dateKey}</div>
            <div className="text-xs text-slate-500">{sales.length} transaksi</div>
          </div>
          <button className="h-10 rounded-xl px-4 text-sm font-bold bg-slate-100 hover:bg-slate-200" onClick={onClose}>
            Tutup
          </button>
        </div>
        <div className="p-4 sm:p-5 space-y-4 max-h-[70vh] overflow-auto">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm flex items-center justify-between">
            <span className="text-slate-600 font-semibold">Total Penjualan Shift</span>
            <span className="text-[#137fec] font-black">{formatRupiah(total)}</span>
          </div>
          <div className="rounded-xl border border-slate-200 overflow-hidden divide-y divide-slate-100">
            {sales.map((s) => (
              <div key={s.id} className="p-3 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-black text-sm truncate">{s.id}</div>
                  <div className="text-xs text-slate-500">{formatDate(s.createdAt)}</div>
                  <div className="text-xs text-slate-500 mt-1">{s.items.length} item - {s.paymentMethod === 'tunai' ? 'Tunai' : 'Transfer'}</div>
                </div>
                <div className="font-black text-sm text-[#137fec]">{formatRupiah(s.total)}</div>
              </div>
            ))}
            {sales.length === 0 && <div className="p-8 text-center text-sm text-slate-500">Belum ada transaksi.</div>}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PosSales() {
  const {sales, loading, account} = usePos();
  const [q, setQ] = useState('');
  const [selected, setSelected] = useState<PosSale | null>(null);
  const [pdfBusy, setPdfBusy] = useState(false);
  const [pdfBusyDateKey, setPdfBusyDateKey] = useState<string | null>(null);
  const [reportDateKey, setReportDateKey] = useState(() => toLocalDateKey(new Date()));
  const [selectedShiftDateKey, setSelectedShiftDateKey] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return sales;
    return sales.filter((s) => {
      if (s.id.toLowerCase().includes(query)) return true;
      return s.items.some((it) => it.name.toLowerCase().includes(query));
    });
  }, [sales, q]);

  const salesForReport = useMemo(() => {
    return sales.filter((s) => toLocalDateKey(new Date(s.createdAt)) === reportDateKey);
  }, [sales, reportDateKey]);

  const shiftSummary = useMemo(() => {
    return {
      totalKas: salesForReport.reduce((acc, s) => acc + s.total, 0),
      transaksi: salesForReport.length,
    };
  }, [salesForReport]);

  const latestSales = useMemo(() => filtered.slice(0, 5), [filtered]);

  const shiftHistory = useMemo(() => {
    const grouped = new Map<string, {dateKey: string; totalKas: number; transaksi: number; lastCreatedAt: string}>();
    for (const s of sales) {
      const dateKey = toLocalDateKey(new Date(s.createdAt));
      const curr = grouped.get(dateKey);
      if (!curr) {
        grouped.set(dateKey, {
          dateKey,
          totalKas: s.total,
          transaksi: 1,
          lastCreatedAt: s.createdAt,
        });
      } else {
        curr.totalKas += s.total;
        curr.transaksi += 1;
        if (new Date(s.createdAt).getTime() > new Date(curr.lastCreatedAt).getTime()) {
          curr.lastCreatedAt = s.createdAt;
        }
      }
    }
    return Array.from(grouped.values()).sort((a, b) => b.dateKey.localeCompare(a.dateKey));
  }, [sales]);

  const selectedShiftSales = useMemo(() => {
    if (!selectedShiftDateKey) return [];
    return sales.filter((s) => toLocalDateKey(new Date(s.createdAt)) === selectedShiftDateKey);
  }, [sales, selectedShiftDateKey]);

  const handleTutupShiftPdf = async (dateKey: string) => {
    if (pdfBusy || loading) return;

    const todaysSales = sales.filter((s) => toLocalDateKey(new Date(s.createdAt)) === dateKey);
    if (todaysSales.length === 0) {
      window.alert(`Belum ada penjualan pada tanggal ${dateKey}.`);
      return;
    }

    setPdfBusy(true);
    setPdfBusyDateKey(dateKey);
    try {
      const doc = new jsPDF({orientation: 'p', unit: 'pt', format: 'a4'});
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const left = 40;
      const right = pageWidth - 40;
      const contentWidth = right - left;
      const bottomLimit = pageHeight - 48;
      let y = 48;

      const ensureSpace = (needed = 20) => {
        if (y + needed > bottomLimit) {
          doc.addPage();
          y = 48;
        }
      };

      const drawCellText = (text: string, x: number, yTop: number, width: number, align: 'left' | 'right' = 'left') => {
        const safeText = String(text);
        const lines = doc.splitTextToSize(safeText, width - 8);
        const line = String(lines[0] ?? safeText);
        const yText = yTop + 14;
        if (align === 'right') {
          doc.text(line, x + width - 4, yText, {align: 'right'});
        } else {
          doc.text(line, x + 4, yText);
        }
      };

      const subtotal = todaysSales.reduce((acc, s) => acc + s.subtotal, 0);
      const tax = todaysSales.reduce((acc, s) => acc + s.tax, 0);
      const total = todaysSales.reduce((acc, s) => acc + s.total, 0);
      const tunaiTotal = todaysSales.filter((s) => s.paymentMethod === 'tunai').reduce((acc, s) => acc + s.total, 0);
      const transferTotal = todaysSales.filter((s) => s.paymentMethod === 'transfer').reduce((acc, s) => acc + s.total, 0);

      const itemMap = new Map<string, {name: string; quantity: number; amount: number}>();
      for (const sale of todaysSales) {
        for (const it of sale.items) {
          const prev = itemMap.get(it.name);
          const amount = it.price * it.quantity;
          if (!prev) {
            itemMap.set(it.name, {name: it.name, quantity: it.quantity, amount});
          } else {
            prev.quantity += it.quantity;
            prev.amount += amount;
          }
        }
      }

      const items = Array.from(itemMap.values()).sort((a, b) => b.amount - a.amount);
      const storeName = (account?.storeName ?? 'Anti Rugi').toUpperCase();
      const cashierName = account?.displayName ?? '-';
      const createdAt = new Intl.DateTimeFormat('id-ID', {dateStyle: 'full', timeStyle: 'short'}).format(new Date());

      // Header
      doc.setFillColor(19, 127, 236);
      doc.rect(left, y, contentWidth, 42, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(14);
      doc.text('LAPORAN TUTUP SHIFT', left + 12, y + 18);
      doc.setFontSize(11);
      doc.text(storeName, left + 12, y + 33);
      doc.setFontSize(10);
      doc.text(dateKey, right - 12, y + 18, {align: 'right'});
      doc.text('Dokumen Rekap Penjualan', right - 12, y + 33, {align: 'right'});
      doc.setTextColor(0, 0, 0);
      y += 56;

      // Info toko/kasir
      doc.setDrawColor(220, 220, 220);
      doc.setFillColor(248, 250, 252);
      doc.rect(left, y, contentWidth, 54, 'FD');
      doc.setFontSize(10);
      doc.text(`Nama Toko : ${account?.storeName ?? '-'}`, left + 10, y + 17);
      doc.text(`Kasir      : ${cashierName}`, left + 10, y + 31);
      doc.text(`Dicetak    : ${createdAt}`, left + 10, y + 45);
      y += 68;

      // Tabel ringkasan
      ensureSpace(140);
      doc.setFontSize(11);
      doc.text('Ringkasan Penjualan', left, y);
      y += 10;

      const summaryRows: Array<[string, string]> = [
        ['Jumlah Transaksi', String(todaysSales.length)],
        ['Subtotal', formatRupiah(subtotal)],
        ['Total Penjualan', formatRupiah(total)],
        ['Pembayaran Tunai', formatRupiah(tunaiTotal)],
        ['Pembayaran Transfer', formatRupiah(transferTotal)],
      ];
      const summaryLeftCol = contentWidth * 0.6;
      const summaryRightCol = contentWidth - summaryLeftCol;
      const summaryRowH = 20;

      doc.setFillColor(241, 245, 249);
      doc.setDrawColor(210, 214, 220);
      doc.rect(left, y, contentWidth, summaryRowH, 'FD');
      doc.setFontSize(10);
      doc.text('Keterangan', left + 6, y + 14);
      doc.text('Nilai', left + summaryLeftCol + summaryRightCol - 6, y + 14, {align: 'right'});
      y += summaryRowH;

      summaryRows.forEach((row, idx) => {
        ensureSpace(summaryRowH + 2);
        if (idx % 2 === 0) {
          doc.setFillColor(252, 252, 252);
          doc.rect(left, y, contentWidth, summaryRowH, 'F');
        }
        doc.rect(left, y, contentWidth, summaryRowH);
        doc.line(left + summaryLeftCol, y, left + summaryLeftCol, y + summaryRowH);
        doc.setFontSize(10);
        drawCellText(row[0], left, y, summaryLeftCol, 'left');
        drawCellText(row[1], left + summaryLeftCol, y, summaryRightCol, 'right');
        y += summaryRowH;
      });

      y += 14;
      ensureSpace(40);
      doc.setFontSize(11);
      doc.text('Rekap Item Terjual', left, y);
      y += 10;

      // Tabel item
      const itemCols = [contentWidth * 0.12, contentWidth * 0.52, contentWidth * 0.16, contentWidth * 0.20];
      const itemRowH = 20;
      const drawItemHeader = () => {
        ensureSpace(itemRowH + 2);
        doc.setFillColor(241, 245, 249);
        doc.rect(left, y, contentWidth, itemRowH, 'F');
        doc.rect(left, y, contentWidth, itemRowH);
        let x = left;
        itemCols.forEach((w) => {
          doc.line(x, y, x, y + itemRowH);
          x += w;
        });
        doc.line(right, y, right, y + itemRowH);
        doc.setFontSize(10);
        doc.text('No', left + 4, y + 14);
        doc.text('Nama Item', left + itemCols[0] + 4, y + 14);
        doc.text('Qty', left + itemCols[0] + itemCols[1] + itemCols[2] - 4, y + 14, {align: 'right'});
        doc.text('Jumlah', right - 4, y + 14, {align: 'right'});
        y += itemRowH;
      };

      drawItemHeader();
      items.forEach((it, idx) => {
        if (y + itemRowH > bottomLimit) {
          doc.addPage();
          y = 48;
          drawItemHeader();
        }
        if (idx % 2 === 0) {
          doc.setFillColor(252, 252, 252);
          doc.rect(left, y, contentWidth, itemRowH, 'F');
        }
        doc.rect(left, y, contentWidth, itemRowH);
        let x = left;
        itemCols.forEach((w) => {
          doc.line(x, y, x, y + itemRowH);
          x += w;
        });
        doc.line(right, y, right, y + itemRowH);

        drawCellText(String(idx + 1), left, y, itemCols[0], 'left');
        drawCellText(it.name, left + itemCols[0], y, itemCols[1], 'left');
        drawCellText(String(it.quantity), left + itemCols[0] + itemCols[1], y, itemCols[2], 'right');
        drawCellText(formatRupiah(it.amount), left + itemCols[0] + itemCols[1] + itemCols[2], y, itemCols[3], 'right');
        y += itemRowH;
      });

      ensureSpace(30);
      y += 10;
      doc.setFontSize(9);
      doc.setTextColor(100, 100, 100);
      doc.text('Dokumen ini dibuat otomatis oleh sistem POS Anti Rugi.', left, y);
      doc.setTextColor(0, 0, 0);

      if (items.length === 0) {
        ensureSpace(20);
        y += 14;
        doc.setFontSize(10);
        doc.text('Tidak ada item pada transaksi hari ini.', left, y);
      }

      doc.save(`Laporan_Tutup_Shift_${dateKey}.pdf`);
    } finally {
      setPdfBusy(false);
      setPdfBusyDateKey(null);
    }
  };

  return (
    <div className="p-4 sm:p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {loading && <div className="text-center text-sm font-bold text-slate-600">Memuat penjualan...</div>}

        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900">Laporan & Shift</h1>
          <p className="text-sm text-slate-500">Terhubung langsung dari transaksi Kasir ke riwayat penjualan.</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-700">
              <span className="inline-block size-2 rounded-full bg-[#137fec]" />
              Shift Aktif
            </div>
            <div className="text-[11px] font-semibold text-slate-500">{new Date().toLocaleString('id-ID')}</div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="rounded-xl bg-slate-50 border border-slate-200 p-3">
              <div className="text-[11px] uppercase tracking-wider text-slate-500">Total Kas</div>
              <div className="mt-1 text-3xl font-black text-slate-900">{formatRupiah(shiftSummary.totalKas)}</div>
            </div>
            <div className="rounded-xl bg-slate-50 border border-slate-200 p-3">
              <div className="text-[11px] uppercase tracking-wider text-slate-500">Transaksi</div>
              <div className="mt-1 text-3xl font-black text-slate-900">{shiftSummary.transaksi}</div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-slate-600">Tanggal Shift</label>
              <input
                type="date"
                className="h-11 rounded-xl bg-white border border-slate-200 px-3 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-[#137fec]"
                value={reportDateKey}
                onChange={(e) => setReportDateKey(e.target.value)}
                max={toLocalDateKey(new Date())}
              />
            </div>
            <button
              className="h-11 px-4 rounded-xl bg-[#137fec] text-white font-bold text-sm hover:bg-[#0f6bcc] transition-colors disabled:opacity-60 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
              disabled={pdfBusy || loading || salesForReport.length === 0}
              onClick={() => void handleTutupShiftPdf(reportDateKey)}
              type="button"
              title={salesForReport.length === 0 ? 'Belum ada penjualan di tanggal ini' : 'Rekap dan download PDF'}
            >
              <Lock className="size-4" />
              {pdfBusy && pdfBusyDateKey === reportDateKey ? 'Menyusun PDF...' : 'Tutup Shift'}
            </button>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
            <div className="text-sm font-black">Transaksi Terakhir</div>
            <input
              className="h-11 w-full sm:w-80 rounded-xl bg-slate-100 px-3 text-sm outline-none focus:ring-2 focus:ring-[#137fec]"
              placeholder="Cari ID / nama item..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>

          <div className="divide-y divide-slate-100">
            {latestSales.map((s) => (
              <button
                key={s.id}
                className="w-full text-left p-4 sm:p-5 hover:bg-slate-50 transition-colors"
                onClick={() => setSelected(s)}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <ReceiptText className="size-4 text-slate-400" />
                      <div className="font-black truncate">Penjualan</div>
                      <span className="text-xs font-bold rounded-full bg-slate-100 px-2 py-1 text-slate-600">
                        {s.items.length} item
                      </span>
                      <span className="text-xs font-bold rounded-full bg-slate-100 px-2 py-1 text-slate-600">
                        {s.paymentMethod === 'tunai' ? 'Tunai' : 'Transfer'}
                      </span>
                    </div>
                    <div className="mt-1 text-xs text-slate-500">{formatDate(s.createdAt)}</div>
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="text-sm font-black text-[#137fec]">{formatRupiah(s.total)}</div>
                    <div className="text-[11px] text-slate-400">{s.id}</div>
                  </div>
                </div>
              </button>
            ))}

            {latestSales.length === 0 && (
              <div className="p-10 text-center text-sm text-slate-500">Belum ada transaksi.</div>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center gap-2">
            <History className="size-4 text-slate-500" />
            <div className="text-sm font-black">Riwayat Shift</div>
          </div>
          <div className="divide-y divide-slate-100">
            {shiftHistory.map((day) => (
              <div key={day.dateKey} className="p-4 sm:p-5 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-black text-slate-900">{formatDateOnly(day.lastCreatedAt)}</div>
                  <div className="text-xs text-slate-500">{day.transaksi} transaksi</div>
                </div>
                <div className="text-right shrink-0 flex flex-col items-end gap-2">
                  <div>
                    <div className="text-sm font-black text-[#137fec]">{formatRupiah(day.totalKas)}</div>
                    <div className="text-[11px] text-slate-400">{day.dateKey}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedShiftDateKey(day.dateKey)}
                      className="h-8 px-3 rounded-lg border border-slate-200 bg-white text-slate-700 text-xs font-bold hover:bg-slate-50"
                    >
                      Lihat
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleTutupShiftPdf(day.dateKey)}
                      disabled={pdfBusy}
                      className="h-8 px-3 rounded-lg bg-[#137fec] text-white text-xs font-bold hover:bg-[#0f6bcc] disabled:opacity-60"
                    >
                      {pdfBusy && pdfBusyDateKey === day.dateKey ? 'Proses...' : 'PDF'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {shiftHistory.length === 0 && (
              <div className="p-10 text-center text-sm text-slate-500">Belum ada riwayat shift.</div>
            )}
          </div>
        </div>
      </div>

      {selected && <SaleDetail sale={selected} onClose={() => setSelected(null)} />}
      {selectedShiftDateKey && (
        <ShiftDetailModal
          dateKey={selectedShiftDateKey}
          sales={selectedShiftSales}
          onClose={() => setSelectedShiftDateKey(null)}
        />
      )}
    </div>
  );
}
