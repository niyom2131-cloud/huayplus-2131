import React, { useState, useMemo } from 'react';
import * as XLSX from 'xlsx';
import type { BookingItem } from './App';

export interface PeriodDrawRecord {
  winningTop: string;
  winningBottom: string;
  useProportionalRule: boolean;
  customTopPrize: number | null;
  customBottomPrize: number | null;
  topPrizePaid: boolean;
  bottomPrizePaid: boolean;
  extraExpenseTitle: string;
  extraExpenseAmount: number;
}

export interface PeriodData {
  bookings: Record<string, BookingItem>;
  draw: PeriodDrawRecord;
}

export const THAI_MONTHS = [
  { value: '01', label: 'มกราคม', short: 'ม.ค.' },
  { value: '02', label: 'กุมภาพันธ์', short: 'ก.พ.' },
  { value: '03', label: 'มีนาคม', short: 'มี.ค.' },
  { value: '04', label: 'เมษายน', short: 'เม.ย.' },
  { value: '05', label: 'พฤษภาคม', short: 'พ.ค.' },
  { value: '06', label: 'มิถุนายน', short: 'มิ.ย.' },
  { value: '07', label: 'กรกฎาคม', short: 'ก.ค.' },
  { value: '08', label: 'สิงหาคม', short: 'ส.ค.' },
  { value: '09', label: 'กันยายน', short: 'ก.ย.' },
  { value: '10', label: 'ตุลาคม', short: 'ต.ค.' },
  { value: '11', label: 'พฤศจิกายน', short: 'พ.ย.' },
  { value: '12', label: 'ธันวาคม', short: 'ธ.ค.' },
];

export const DEFAULT_DRAW_RECORD: PeriodDrawRecord = {
  winningTop: '',
  winningBottom: '',
  useProportionalRule: true,
  customTopPrize: null,
  customBottomPrize: null,
  topPrizePaid: false,
  bottomPrizePaid: false,
  extraExpenseTitle: '',
  extraExpenseAmount: 0,
};

export function formatPeriodLabel(yearBE: string, monthVal: string, day: '01' | '16'): string {
  const m = THAI_MONTHS.find((item) => item.value === monthVal);
  const dayNum = day === '01' ? '1' : '16';
  return `งวดวันที่ ${dayNum} ${m ? m.label : ''} ${yearBE}`;
}

export function calculatePrizePerReward(
  totalSoldCount: number,
  useProportionalRule: boolean
): number {
  if (!useProportionalRule) return 3000;
  // กติกา: ขายสลากไม่ถึงจำนวน 60 ตัวเลข เงินรางวัลลดลงตามสัดส่วน
  // ตัวอย่าง ขายสลากได้ 50 ตัวเลข ๆ ละ 100 บาท ได้เงิน 5,000 บาท เงินรางวัลเหลือ 2,500 บาท (คือ เลขละ 50 บาท)
  if (totalSoldCount >= 60) {
    return 3000;
  }
  return totalSoldCount * 50;
}

interface AdminDashboardProps {
  yearBE: string;
  monthVal: string;
  daySlot: '01' | '16';
  onChangePeriod: (yearBE: string, monthVal: string, daySlot: '01' | '16') => void;
  currentPeriodData: PeriodData;
  otherSlotPeriodData: PeriodData;
  onUpdateDrawRecord: (nextDraw: PeriodDrawRecord) => void;
  onToggleBookingStatus: (num: string) => void;
  onMarkAllPersonPaid: (personName: string) => void;
  onOpenBookingModal: (num: string) => void;
  onShowToast: (msg: string, isError?: boolean) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  yearBE,
  monthVal,
  daySlot,
  onChangePeriod,
  currentPeriodData,
  otherSlotPeriodData,
  onUpdateDrawRecord,
  onToggleBookingStatus,
  onMarkAllPersonPaid,
  onOpenBookingModal,
  onShowToast,
}) => {
  const [adminSubTab, setAdminSubTab] = useState<'summary' | 'revenue' | 'unpaid' | 'winners'>(
    'summary'
  );

  const { bookings, draw } = currentPeriodData;
  const periodLabel = formatPeriodLabel(yearBE, monthVal, daySlot);
  const monthObj = THAI_MONTHS.find((m) => m.value === monthVal) || THAI_MONTHS[10];

  // --- Compute Financial Metrics for Current Period ---
  const metrics = useMemo(() => {
    const keys = Object.keys(bookings).sort();
    const paidList: { num: string; item: BookingItem }[] = [];
    const unpaidList: { num: string; item: BookingItem }[] = [];

    const byPerson: Record<
      string,
      {
        name: string;
        paidNums: string[];
        unpaidNums: string[];
        totalNums: number;
        paidAmount: number;
        unpaidAmount: number;
      }
    > = {};

    keys.forEach((num) => {
      const item = bookings[num];
      if (!item) return;
      if (!byPerson[item.name]) {
        byPerson[item.name] = {
          name: item.name,
          paidNums: [],
          unpaidNums: [],
          totalNums: 0,
          paidAmount: 0,
          unpaidAmount: 0,
        };
      }
      byPerson[item.name].totalNums += 1;

      if (item.status === 'paid') {
        paidList.push({ num, item });
        byPerson[item.name].paidNums.push(num);
        byPerson[item.name].paidAmount += 100;
      } else {
        unpaidList.push({ num, item });
        byPerson[item.name].unpaidNums.push(num);
        byPerson[item.name].unpaidAmount += 100;
      }
    });

    const totalBookedCount = keys.length;
    const paidCount = paidList.length;
    const unpaidCount = unpaidList.length;

    const totalExpectedRevenue = totalBookedCount * 100;
    const paidRevenue = paidCount * 100;
    const unpaidRevenue = unpaidCount * 100;

    // Prize Calculation
    const autoPrizePerWinner = calculatePrizePerWinner(totalBookedCount, draw.useProportionalRule);
    const topPrizeUnit = draw.customTopPrize !== null ? draw.customTopPrize : autoPrizePerWinner;
    const bottomPrizeUnit =
      draw.customBottomPrize !== null ? draw.customBottomPrize : autoPrizePerWinner;

    const topWinnerBooking =
      draw.winningTop.length === 2 ? bookings[draw.winningTop] || null : null;
    const bottomWinnerBooking =
      draw.winningBottom.length === 2 ? bookings[draw.winningBottom] || null : null;

    // รายจ่ายรางวัลเฉพาะกรณีมีผู้จองเลขที่ถูกรางวัล
    const actualTopPayout = topWinnerBooking ? topPrizeUnit : 0;
    const actualBottomPayout = bottomWinnerBooking ? bottomPrizeUnit : 0;
    const extraExpense = Number(draw.extraExpenseAmount) || 0;

    const totalExpense = actualTopPayout + actualBottomPayout + extraExpense;
    const netProfitFromPaid = paidRevenue - totalExpense;
    const netProfitIfAllPaid = totalExpectedRevenue - totalExpense;

    return {
      keys,
      paidList,
      unpaidList,
      personSummary: Object.values(byPerson).sort((a, b) => b.totalNums - a.totalNums),
      unpaidPersons: Object.values(byPerson)
        .filter((p) => p.unpaidNums.length > 0)
        .sort((a, b) => b.unpaidAmount - a.unpaidAmount),
      paidPersons: Object.values(byPerson)
        .filter((p) => p.paidNums.length > 0)
        .sort((a, b) => b.paidAmount - a.paidAmount),
      totalBookedCount,
      paidCount,
      unpaidCount,
      totalExpectedRevenue,
      paidRevenue,
      unpaidRevenue,
      autoPrizePerWinner,
      topPrizeUnit,
      bottomPrizeUnit,
      topWinnerBooking,
      bottomWinnerBooking,
      actualTopPayout,
      actualBottomPayout,
      extraExpense,
      totalExpense,
      netProfitFromPaid,
      netProfitIfAllPaid,
    };
  }, [bookings, draw]);

  // Helper for other slot in the same month (to show 2-period monthly summary)
  const otherSlotMetrics = useMemo(() => {
    const otherBookings = otherSlotPeriodData.bookings;
    const otherDraw = otherSlotPeriodData.draw;
    const keys = Object.keys(otherBookings);
    let paid = 0;
    let unpaid = 0;
    keys.forEach((k) => {
      if (otherBookings[k]?.status === 'paid') paid++;
      else unpaid++;
    });
    const autoPrize = calculatePrizePerWinner(keys.length, otherDraw.useProportionalRule);
    const topUnit = otherDraw.customTopPrize !== null ? otherDraw.customTopPrize : autoPrize;
    const botUnit = otherDraw.customBottomPrize !== null ? otherDraw.customBottomPrize : autoPrize;
    const topWin = otherDraw.winningTop.length === 2 ? otherBookings[otherDraw.winningTop] : null;
    const botWin =
      otherDraw.winningBottom.length === 2 ? otherBookings[otherDraw.winningBottom] : null;
    const expense =
      (topWin ? topUnit : 0) + (botWin ? botUnit : 0) + (Number(otherDraw.extraExpenseAmount) || 0);

    return {
      totalBookedCount: keys.length,
      paidRevenue: paid * 100,
      unpaidRevenue: unpaid * 100,
      totalExpectedRevenue: keys.length * 100,
      totalExpense: expense,
      netProfitFromPaid: paid * 100 - expense,
    };
  }, [otherSlotPeriodData]);

  function calculatePrizePerWinner(soldCount: number, proportional: boolean) {
    return calculatePrizePerReward(soldCount, proportional);
  }

  // --- Build Multi-Sheet Excel Workbook (.xlsx) ---
  const buildExcelWorkbook = () => {
    const wb = XLSX.utils.book_new();

    const day01Stats = daySlot === '01' ? metrics : otherSlotMetrics;
    const day16Stats = daySlot === '16' ? metrics : otherSlotMetrics;

    // Sheet 1: สรุปยอดรายรับ-รายจ่าย (ประจำงวด & รวม 2 งวดประจำเดือน)
    const summaryRows = [
      ['รายงานสรุปบัญชีรายรับ-รายจ่าย หวยพลัส+ สลากการกุศล นนส.ขส. 2131'],
      [`ประจำงวด: ${periodLabel}`],
      [`ข้อมูล ณ วันที่: ${new Date().toLocaleString('th-TH')}`],
      [],
      ['1. สรุปยอดประจำงวดปัจจุบัน', 'จำนวน (เลข)', 'จำนวนเงิน (บาท)', 'หมายเหตุ'],
      [
        'ยอดจองรวมทั้งหมด',
        metrics.totalBookedCount,
        metrics.totalExpectedRevenue,
        'เบอร์ละ 100 บาท',
      ],
      [
        'รายรับที่โอนแล้ว (สีฟ้า)',
        metrics.paidCount,
        metrics.paidRevenue,
        'ชำระเงินเรียบร้อยแล้ว',
      ],
      [
        'รายการค้างจ่าย / รอโอน (สีเหลือง)',
        metrics.unpaidCount,
        metrics.unpaidRevenue,
        'อยู่ระหว่างรอโอนเงิน',
      ],
      [
        'หมายเลขว่างคงเหลือ',
        100 - metrics.totalBookedCount,
        0,
        'ไม่มีผู้จอง',
      ],
      [],
      ['2. รายจ่ายเงินรางวัลประจำงวด', 'หมายเลขที่ออก', 'ผู้ถูกรางวัล', 'จำนวนเงินรางวัล (บาท)', 'สถานะการจ่ายรางวัล'],
      [
        'รางวัลเลขท้าย 2 ตัวบน',
        draw.winningTop || '-',
        metrics.topWinnerBooking ? metrics.topWinnerBooking.name : 'ไม่มีผู้ถูก / เลขว่าง',
        metrics.actualTopPayout,
        metrics.topWinnerBooking ? (draw.topPrizePaid ? 'จ่ายรางวัลแล้ว' : 'รอจ่ายรางวัล') : '-',
      ],
      [
        'รางวัลเลขท้าย 2 ตัวล่าง',
        draw.winningBottom || '-',
        metrics.bottomWinnerBooking ? metrics.bottomWinnerBooking.name : 'ไม่มีผู้ถูก / เลขว่าง',
        metrics.actualBottomPayout,
        metrics.bottomWinnerBooking
          ? draw.bottomPrizePaid
            ? 'จ่ายรางวัลแล้ว'
            : 'รอจ่ายรางวัล'
          : '-',
      ],
      [
        'รายจ่ายอื่นๆ ประจำงวด',
        '-',
        draw.extraExpenseTitle || '-',
        metrics.extraExpense,
        '-',
      ],
      ['รวมรายจ่ายประจำงวดทั้งสิ้น', '', '', metrics.totalExpense, ''],
      [],
      ['3. สรุปกำไรสุทธิ / เงินคงเหลือเข้าสวัสดิการ', '', 'จำนวนเงิน (บาท)', 'รายละเอียด'],
      [
        'คงเหลือสุทธิ (คิดจากยอดที่โอนแล้วจริง)',
        '',
        metrics.netProfitFromPaid,
        'รายรับโอนแล้ว หัก รายจ่ายรวม',
      ],
      [
        'คงเหลือสุทธิ (กรณีเก็บยอดค้างจ่ายครบ 100%)',
        '',
        metrics.netProfitIfAllPaid,
        'ยอดจองรวมทั้งหมด หัก รายจ่ายรวม',
      ],
      [],
      [`4. สรุปภาพรวมรายเดือน (${monthObj.label} ${yearBE} - รวม 2 งวด)`, 'งวดวันที่ 1', 'งวดวันที่ 16', 'รวมทั้งเดือน (2 งวด)'],
      [
        'จำนวนเลขที่จอง (เลข)',
        day01Stats.totalBookedCount,
        day16Stats.totalBookedCount,
        day01Stats.totalBookedCount + day16Stats.totalBookedCount,
      ],
      [
        'รายรับที่โอนแล้ว (บาท)',
        day01Stats.paidRevenue,
        day16Stats.paidRevenue,
        day01Stats.paidRevenue + day16Stats.paidRevenue,
      ],
      [
        'ยอดค้างจ่าย รอโอน (บาท)',
        day01Stats.unpaidRevenue,
        day16Stats.unpaidRevenue,
        day01Stats.unpaidRevenue + day16Stats.unpaidRevenue,
      ],
      [
        'รายจ่ายรางวัลรวม (บาท)',
        day01Stats.totalExpense,
        day16Stats.totalExpense,
        day01Stats.totalExpense + day16Stats.totalExpense,
      ],
      [
        'กำไร/เงินคงเหลือสุทธิ (บาท)',
        day01Stats.netProfitFromPaid,
        day16Stats.netProfitFromPaid,
        day01Stats.netProfitFromPaid + day16Stats.netProfitFromPaid,
      ],
    ];
    const wsSummary = XLSX.utils.aoa_to_sheet(summaryRows);
    wsSummary['!cols'] = [{ wch: 38 }, { wch: 18 }, { wch: 24 }, { wch: 24 }, { wch: 22 }];
    XLSX.utils.book_append_sheet(wb, wsSummary, '1_สรุปรายรับรายจ่าย');

    // Sheet 2: รายรับจากคนที่จอง (โอนแล้ว + สรุปรายบุคคล)
    const revRows: (string | number)[][] = [
      [`รายรับจากผู้จอง (${periodLabel})`],
      ['ลำดับ', 'ชื่อผู้จอง', 'จำนวนเลขที่จองรวม', 'เลขที่โอนแล้ว (สีฟ้า)', 'ยอดโอนแล้ว (บาท)', 'เลขที่ค้างจ่าย (สีเหลือง)', 'ยอดค้างจ่าย (บาท)'],
    ];
    metrics.personSummary.forEach((p, idx) => {
      revRows.push([
        idx + 1,
        p.name,
        p.totalNums,
        p.paidNums.join(', ') || '-',
        p.paidAmount,
        p.unpaidNums.join(', ') || '-',
        p.unpaidAmount,
      ]);
    });
    revRows.push([
      '',
      'รวมทั้งสิ้น',
      metrics.totalBookedCount,
      `${metrics.paidCount} เลข`,
      metrics.paidRevenue,
      `${metrics.unpaidCount} เลข`,
      metrics.unpaidRevenue,
    ]);
    const wsRevenue = XLSX.utils.aoa_to_sheet(revRows);
    wsRevenue['!cols'] = [
      { wch: 8 },
      { wch: 26 },
      { wch: 18 },
      { wch: 28 },
      { wch: 18 },
      { wch: 28 },
      { wch: 18 },
    ];
    XLSX.utils.book_append_sheet(wb, wsRevenue, '2_รายรับตามรายชื่อ');

    // Sheet 3: รายการค้างจ่าย (รอโอน - สีเหลือง)
    const unpaidRows: (string | number)[][] = [
      [`รายการค้างจ่าย / รอโอน (${periodLabel})`],
      ['ลำดับ', 'หมายเลข', 'ชื่อผู้จอง', 'สถานะ', 'จำนวนเงินค้างชำระ (บาท)', 'หมายเหตุ'],
    ];
    metrics.unpaidList.forEach((entry, idx) => {
      unpaidRows.push([
        idx + 1,
        entry.num,
        entry.item.name,
        'รอโอน (สีเหลือง)',
        100,
        entry.item.note || '-',
      ]);
    });
    unpaidRows.push(['', '', 'รวมยอดค้างชำระทั้งสิ้น', `${metrics.unpaidCount} เลข`, metrics.unpaidRevenue, '']);
    const wsUnpaid = XLSX.utils.aoa_to_sheet(unpaidRows);
    wsUnpaid['!cols'] = [{ wch: 8 }, { wch: 12 }, { wch: 26 }, { wch: 18 }, { wch: 24 }, { wch: 24 }];
    XLSX.utils.book_append_sheet(wb, wsUnpaid, '3_รายการค้างจ่าย');

    // Sheet 4: ตารางหมายเลข 00-99 ทั้งหมด
    const allRows: (string | number)[][] = [
      [`ตารางหมายเลข 00-99 ทั้งหมด (${periodLabel})`],
      ['หมายเลข', 'สถานะ', 'ชื่อผู้จอง', 'ยอดเงิน (บาท)', 'ผลการถูกรางวัล', 'หมายเหตุ'],
    ];
    for (let i = 0; i < 100; i++) {
      const num = String(i).padStart(2, '0');
      const b = bookings[num];
      const isTop = draw.winningTop === num && draw.winningTop.length === 2;
      const isBot = draw.winningBottom === num && draw.winningBottom.length === 2;
      let winText = '-';
      if (isTop && isBot) winText = `ถูกทั้งบนและล่าง (${metrics.topPrizeUnit + metrics.bottomPrizeUnit} บ.)`;
      else if (isTop) winText = `ถูกรางวัล 2 ตัวบน (${metrics.topPrizeUnit} บ.)`;
      else if (isBot) winText = `ถูกรางวัล 2 ตัวล่าง (${metrics.bottomPrizeUnit} บ.)`;

      allRows.push([
        num,
        !b ? 'ว่าง' : b.status === 'paid' ? 'โอนแล้ว (สีฟ้า)' : 'รอโอน (สีเหลือง)',
        b ? b.name : '-',
        !b ? 0 : 100,
        winText,
        b?.note || '-',
      ]);
    }
    const wsAll = XLSX.utils.aoa_to_sheet(allRows);
    wsAll['!cols'] = [{ wch: 12 }, { wch: 18 }, { wch: 26 }, { wch: 15 }, { wch: 28 }, { wch: 22 }];
    XLSX.utils.book_append_sheet(wb, wsAll, '4_ตารางเลข00-99');

    return wb;
  };

  const getExcelFileName = () => {
    const dayStr = daySlot === '01' ? '1' : '16';
    return `สรุปบัญชีหวยพลัส-งวด${dayStr}-${monthObj.short}-${yearBE}.xlsx`;
  };

  // Download Excel (.xlsx) directly
  const handleDownloadExcel = () => {
    try {
      const wb = buildExcelWorkbook();
      XLSX.writeFile(wb, getExcelFileName());
      onShowToast(`ดาวน์โหลดไฟล์ Excel (${getExcelFileName()}) สำเร็จ!`);
    } catch (err) {
      console.error('Excel export error:', err);
      onShowToast('เกิดข้อผิดพลาดในการสร้างไฟล์ Excel', true);
    }
  };

  // Share Excel (.xlsx) directly to LINE Application via Web Share API (or fallback download + LINE share)
  const handleShareExcelToLine = async () => {
    try {
      const wb = buildExcelWorkbook();
      const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const fileName = getExcelFileName();
      const blob = new Blob([wbout], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const file = new File([blob], fileName, {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({
            title: `สรุปบัญชี หวยพลัส+ (${periodLabel})`,
            text: `ไฟล์ Excel สรุปรายรับ-รายจ่าย หวยพลัส+ (${periodLabel})`,
            files: [file],
          });
          onShowToast('เปิดเมนูแชร์ไฟล์ Excel ส่งเข้าแอป LINE สำเร็จ!');
          return;
        } catch (err: unknown) {
          if (err instanceof Error && err.name === 'AbortError') return;
        }
      }

      // Fallback on desktop / browsers that don't share raw .xlsx via navigator.share:
      // 1) Download the .xlsx file immediately
      XLSX.writeFile(wb, fileName);
      onShowToast('บันทึกไฟล์ Excel ลงเครื่องแล้ว สามารถลากส่งในแชท LINE ได้เลย!');
    } catch (err) {
      console.error('Share Excel error:', err);
      handleDownloadExcel();
    }
  };

  // Build Formatted Financial Summary Text for LINE Chat
  const generateAdminLineReportText = () => {
    const lines: string[] = [];
    lines.push(`📊 สรุปบัญชี หวยพลัส+ สลากการกุศล นนส.ขส. 2131`);
    lines.push(`🗓️ ประจำ${periodLabel}`);
    lines.push(`━━━━━━━━━━━━━━`);
    lines.push(`💰 1. สรุปรายรับจากการจอง:`);
    lines.push(`• จองทั้งหมด: ${metrics.totalBookedCount} เลข (${metrics.totalExpectedRevenue.toLocaleString()} บาท)`);
    lines.push(`• 🔵 โอนแล้ว (รับจริง): ${metrics.paidCount} เลข = ${metrics.paidRevenue.toLocaleString()} บาท`);
    lines.push(`• 🟡 ค้างจ่าย (รอโอน): ${metrics.unpaidCount} เลข = ${metrics.unpaidRevenue.toLocaleString()} บาท`);
    lines.push(`• ⬜ เลขว่าง: ${100 - metrics.totalBookedCount} เลข`);

    if (metrics.unpaidPersons.length > 0) {
      lines.push(`━━━━━━━━━━━━━━`);
      lines.push(`⏳ 2. รายชื่อค้างชำระ (${metrics.unpaidCount} เลข):`);
      metrics.unpaidPersons.forEach((p, idx) => {
        lines.push(
          `${idx + 1}. ${p.name} : เลข [${p.unpaidNums.join(', ')}] = ${p.unpaidAmount.toLocaleString()} บ.`
        );
      });
    }

    lines.push(`━━━━━━━━━━━━━━`);
    lines.push(`🏆 3. ผลรางวัลและรายจ่ายประจำงวด:`);
    lines.push(
      `• เลขท้าย 2 ตัวบน: [${draw.winningTop || 'ยังไม่ระบุ'}] -> ${
        metrics.topWinnerBooking
          ? `ผู้ถูก: ${metrics.topWinnerBooking.name} (${metrics.actualTopPayout.toLocaleString()} บ.)`
          : 'ไม่มีผู้ถูก'
      }`
    );
    lines.push(
      `• เลขท้าย 2 ตัวล่าง: [${draw.winningBottom || 'ยังไม่ระบุ'}] -> ${
        metrics.bottomWinnerBooking
          ? `ผู้ถูก: ${metrics.bottomWinnerBooking.name} (${metrics.actualBottomPayout.toLocaleString()} บ.)`
          : 'ไม่มีผู้ถูก'
      }`
    );
    if (metrics.extraExpense > 0) {
      lines.push(
        `• รายจ่ายอื่นๆ (${draw.extraExpenseTitle || 'เพิ่มเติม'}): ${metrics.extraExpense.toLocaleString()} บ.`
      );
    }
    lines.push(`• รวมรายจ่ายทั้งสิ้น: ${metrics.totalExpense.toLocaleString()} บาท`);
    lines.push(`━━━━━━━━━━━━━━`);
    lines.push(
      `✅ สรุปคงเหลือสุทธิ (จากยอดโอนแล้ว): ${metrics.netProfitFromPaid.toLocaleString()} บาท`
    );
    lines.push(
      `📈 สรุปคงเหลือสุทธิ (หากเก็บครบ 100%): ${metrics.netProfitIfAllPaid.toLocaleString()} บาท`
    );

    return lines.join('\n');
  };

  const handleCopyAdminSummaryToLine = async () => {
    const text = generateAdminLineReportText();
    try {
      await navigator.clipboard.writeText(text);
      onShowToast('คัดลอกสรุปบัญชีรายรับ-รายจ่ายแล้ว! กดวางใน LINE ได้เลย');
    } catch {
      onShowToast('คัดลอกสรุปบัญชีสำเร็จ');
    }
  };

  const handleCopyUnpaidListToLine = async () => {
    if (metrics.unpaidPersons.length === 0) {
      onShowToast('ไม่มีรายการค้างชำระในงวดนี้ครับ!');
      return;
    }
    const lines: string[] = [];
    lines.push(`📣 แจ้งรายการรอโอนชำระ (${periodLabel})`);
    lines.push(`🎰 หวยพลัส+ สลากการกุศล นนส.ขส. 2131 (เบอร์ละ 100 บาท)`);
    lines.push(`━━━━━━━━━━━━━━`);
    metrics.unpaidPersons.forEach((p, i) => {
      lines.push(
        `🟡 ${i + 1}. ${p.name} — เลข: ${p.unpaidNums.join(', ')} (รวม ${p.unpaidAmount.toLocaleString()} บาท)`
      );
    });
    lines.push(`━━━━━━━━━━━━━━`);
    lines.push(`รวมค้างชำระ: ${metrics.unpaidCount} หมายเลข (${metrics.unpaidRevenue.toLocaleString()} บาท)`);
    lines.push(`⏰ ปิดการขายเวลา 14.00 น. ของวันออกสลาก ขอบคุณครับ`);

    try {
      await navigator.clipboard.writeText(lines.join('\n'));
      onShowToast('คัดลอกรายการแจ้งยอดค้างจ่ายแล้ว! วางในแชท LINE ได้เลย');
    } catch {
      onShowToast('คัดลอกรายการค้างจ่ายสำเร็จ');
    }
  };

  const day01Summary = daySlot === '01' ? metrics : otherSlotMetrics;
  const day16Summary = daySlot === '16' ? metrics : otherSlotMetrics;

  return (
    <div className="space-y-4 pb-8">
      {/* SECTION 4: ระบบเลือกงวด (1 เดือนมี 2 งวด: วันที่ 1 และ วันที่ 16 ของทุกเดือน) */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 shadow-sm border border-slate-200/90">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3.5 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-xl bg-huay-navy text-amber-300 flex items-center justify-center text-sm">
                <i className="fa-solid fa-calendar-check"></i>
              </span>
              <h2 className="font-extrabold text-base sm:text-lg text-slate-900">
                ระบบจัดการงวดประจำเดือน (2 งวด/เดือน: วันที่ 1 และ วันที่ 16)
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              กำลังจัดการข้อมูลของ: <strong className="text-huay-navy">{periodLabel}</strong> (แยกข้อมูลอิสระแต่ละงวด)
            </p>
          </div>

          {/* Month & Year Selectors */}
          <div className="flex items-center gap-2">
            <select
              value={monthVal}
              onChange={(e) => onChangePeriod(yearBE, e.target.value, daySlot)}
              className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200/70 border border-slate-200 text-xs sm:text-sm font-bold text-slate-800 outline-none cursor-pointer"
            >
              {THAI_MONTHS.map((m) => (
                <option key={m.value} value={m.value}>
                  เดือน{m.label}
                </option>
              ))}
            </select>

            <select
              value={yearBE}
              onChange={(e) => onChangePeriod(e.target.value, monthVal, daySlot)}
              className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200/70 border border-slate-200 text-xs sm:text-sm font-bold text-slate-800 outline-none cursor-pointer"
            >
              {['2568', '2569', '2570', '2571'].map((y) => (
                <option key={y} value={y}>
                  พ.ศ. {y}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 2 Draws Per Month Selector Cards (งวดวันที่ 1 & งวดวันที่ 16) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3.5">
          <button
            type="button"
            onClick={() => onChangePeriod(yearBE, monthVal, '01')}
            className={`p-3.5 rounded-2xl border-2 text-left transition flex items-center justify-between cursor-pointer ${
              daySlot === '01'
                ? 'bg-huay-navy text-white border-amber-400 shadow-md'
                : 'bg-slate-50 hover:bg-amber-50/40 text-slate-800 border-slate-200'
            }`}
          >
            <div>
              <div className="flex items-center gap-2">
                <span
                  className={`text-[11px] font-extrabold px-2 py-0.5 rounded-md ${
                    daySlot === '01' ? 'bg-amber-400 text-slate-950' : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  งวดที่ 1 ของเดือน
                </span>
                {daySlot === '01' && (
                  <span className="text-[11px] font-bold text-emerald-300">● กำลังเปิดใช้งาน</span>
                )}
              </div>
              <p className="font-black text-base sm:text-lg mt-1">
                งวดวันที่ 1 {monthObj.label} {yearBE}
              </p>
              <p
                className={`text-xs mt-0.5 ${
                  daySlot === '01' ? 'text-slate-200' : 'text-slate-500'
                }`}
              >
                จองแล้ว {day01Summary.totalBookedCount} เลข · โอนแล้ว{' '}
                {day01Summary.paidRevenue.toLocaleString()} บ.
              </p>
            </div>
            <i
              className={`fa-solid fa-circle-check text-xl ${
                daySlot === '01' ? 'text-amber-400' : 'text-slate-300'
              }`}
            ></i>
          </button>

          <button
            type="button"
            onClick={() => onChangePeriod(yearBE, monthVal, '16')}
            className={`p-3.5 rounded-2xl border-2 text-left transition flex items-center justify-between cursor-pointer ${
              daySlot === '16'
                ? 'bg-huay-navy text-white border-amber-400 shadow-md'
                : 'bg-slate-50 hover:bg-amber-50/40 text-slate-800 border-slate-200'
            }`}
          >
            <div>
              <div className="flex items-center gap-2">
                <span
                  className={`text-[11px] font-extrabold px-2 py-0.5 rounded-md ${
                    daySlot === '16' ? 'bg-amber-400 text-slate-950' : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  งวดที่ 2 ของเดือน
                </span>
                {daySlot === '16' && (
                  <span className="text-[11px] font-bold text-emerald-300">● กำลังเปิดใช้งาน</span>
                )}
              </div>
              <p className="font-black text-base sm:text-lg mt-1">
                งวดวันที่ 16 {monthObj.label} {yearBE}
              </p>
              <p
                className={`text-xs mt-0.5 ${
                  daySlot === '16' ? 'text-slate-200' : 'text-slate-500'
                }`}
              >
                จองแล้ว {day16Summary.totalBookedCount} เลข · โอนแล้ว{' '}
                {day16Summary.paidRevenue.toLocaleString()} บ.
              </p>
            </div>
            <i
              className={`fa-solid fa-circle-check text-xl ${
                daySlot === '16' ? 'text-amber-400' : 'text-slate-300'
              }`}
            ></i>
          </button>
        </div>
      </div>

      {/* KPI FINANCIAL CARDS (รายรับโอนแล้ว, ค้างจ่ายรอโอน, รายจ่ายรางวัล, สรุปกำไรสุทธิ) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Card 1: รายรับจากคนที่จอง (โอนแล้ว) */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-sky-200">
          <div className="flex items-center justify-between text-xs font-bold text-sky-700 mb-1">
            <span>1. รายรับ (โอนแล้ว · สีฟ้า)</span>
            <i className="fa-solid fa-sack-dollar text-sky-500 text-base"></i>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-sky-600 tabular-nums">
            {metrics.paidRevenue.toLocaleString()}{' '}
            <span className="text-sm font-bold text-slate-500">บาท</span>
          </p>
          <p className="text-[11px] text-slate-500 mt-1">
            ชำระแล้ว {metrics.paidCount} เลข (จากยอดจองรวม {metrics.totalExpectedRevenue.toLocaleString()} บ.)
          </p>
        </div>

        {/* Card 2: รายการค้างจ่ายจากคนที่จอง (รอโอน) */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-yellow-300">
          <div className="flex items-center justify-between text-xs font-bold text-yellow-800 mb-1">
            <span>2. ค้างจ่าย (รอโอน · เหลือง)</span>
            <i className="fa-solid fa-clock-rotate-left text-yellow-600 text-base"></i>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-yellow-600 tabular-nums">
            {metrics.unpaidRevenue.toLocaleString()}{' '}
            <span className="text-sm font-bold text-slate-500">บาท</span>
          </p>
          <p className="text-[11px] text-slate-500 mt-1">
            รอโอน {metrics.unpaidCount} เลข ({metrics.unpaidPersons.length} รายชื่อ)
          </p>
        </div>

        {/* Card 3: รายจ่าย คนที่ถูกประจำงวด */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-rose-200">
          <div className="flex items-center justify-between text-xs font-bold text-rose-700 mb-1">
            <span>3. รายจ่ายรางวัลประจำงวด</span>
            <i className="fa-solid fa-trophy text-rose-500 text-base"></i>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-rose-600 tabular-nums">
            {metrics.totalExpense.toLocaleString()}{' '}
            <span className="text-sm font-bold text-slate-500">บาท</span>
          </p>
          <p className="text-[11px] text-slate-500 mt-1">
            บน: {draw.winningTop || '-'} ({metrics.actualTopPayout.toLocaleString()} บ.) · ล่าง:{' '}
            {draw.winningBottom || '-'} ({metrics.actualBottomPayout.toLocaleString()} บ.)
          </p>
        </div>

        {/* Card 4: สรุปยอดรายรับ-รายจ่ายสุทธิ */}
        <div className="bg-huay-navy text-white rounded-2xl p-4 shadow-md border border-amber-400">
          <div className="flex items-center justify-between text-xs font-bold text-amber-300 mb-1">
            <span>5. สรุปคงเหลือสุทธิ (รับจริง-จ่าย)</span>
            <i className="fa-solid fa-scale-balanced text-amber-300 text-base"></i>
          </div>
          <p
            className={`text-2xl sm:text-3xl font-black tabular-nums ${
              metrics.netProfitFromPaid >= 0 ? 'text-emerald-300' : 'text-rose-300'
            }`}
          >
            {metrics.netProfitFromPaid >= 0 ? '+' : ''}
            {metrics.netProfitFromPaid.toLocaleString()}{' '}
            <span className="text-sm font-bold text-slate-300">บาท</span>
          </p>
          <p className="text-[11px] text-slate-300 mt-1">
            หากเก็บค้างจ่ายครบ: {metrics.netProfitIfAllPaid >= 0 ? '+' : ''}
            {metrics.netProfitIfAllPaid.toLocaleString()} บาท
          </p>
        </div>
      </div>

      {/* EXCEL & LINE EXPORT BAR (ส่งออกเป็นไฟล์ Excel ไปที่ Application LINE) */}
      <div className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-900 text-white rounded-3xl p-4 sm:p-5 shadow-md border border-emerald-400/40 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-md bg-emerald-400 text-slate-950 font-black text-xs">
              EXCEL + LINE
            </span>
            <h3 className="font-extrabold text-base sm:text-lg text-white">
              ส่งออกรายงานสรุปรายรับ-รายจ่ายเป็นไฟล์ Excel (.xlsx) เข้าแอป LINE
            </h3>
          </div>
          <p className="text-xs text-emerald-100">
            ไฟล์ Excel ประกอบด้วย 4 ชีตครบถ้วน: 1.สรุปงบรายรับ-รายจ่าย (รายงวด & รวม 2 งวด) · 2.รายรับรายบุคคล ·
            3.รายการค้างจ่าย · 4.ผู้ถูกรางวัลและตาราง 00-99
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleShareExcelToLine}
            className="bg-line hover:bg-line-dark text-white font-extrabold py-2.5 px-4 rounded-xl shadow-md border border-green-300/40 transition flex items-center gap-2 text-xs sm:text-sm cursor-pointer whitespace-nowrap"
          >
            <i className="fa-brands fa-line text-lg"></i>
            <span>แชร์ไฟล์ Excel (.xlsx) เข้า LINE</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadExcel}
            className="bg-white text-emerald-950 hover:bg-emerald-50 font-extrabold py-2.5 px-4 rounded-xl shadow-md transition flex items-center gap-2 text-xs sm:text-sm cursor-pointer whitespace-nowrap"
          >
            <i className="fa-solid fa-file-excel text-emerald-600 text-base"></i>
            <span>ดาวน์โหลดไฟล์ Excel (.xlsx)</span>
          </button>

          <button
            type="button"
            onClick={handleCopyAdminSummaryToLine}
            className="bg-slate-900/80 hover:bg-slate-900 text-amber-300 font-bold py-2.5 px-3.5 rounded-xl border border-amber-400/40 transition flex items-center gap-1.5 text-xs sm:text-sm cursor-pointer whitespace-nowrap"
          >
            <i className="fa-regular fa-copy"></i>
            <span>คัดลอกข้อความสรุปงบส่ง LINE</span>
          </button>
        </div>
      </div>

      {/* ADMIN NAVIGATION SUB-TABS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 bg-white p-1.5 rounded-2xl shadow-sm border border-slate-200">
        <button
          type="button"
          onClick={() => setAdminSubTab('summary')}
          className={`py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold transition flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap ${
            adminSubTab === 'summary'
              ? 'bg-huay-navy text-amber-300 shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <i className="fa-solid fa-chart-pie"></i>
          <span>สรุปงบ & ตรวจรางวัล</span>
        </button>

        <button
          type="button"
          onClick={() => setAdminSubTab('revenue')}
          className={`py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold transition flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap ${
            adminSubTab === 'revenue'
              ? 'bg-sky-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <i className="fa-solid fa-circle-check"></i>
          <span>1. รายรับคนจอง ({metrics.paidCount})</span>
        </button>

        <button
          type="button"
          onClick={() => setAdminSubTab('unpaid')}
          className={`py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold transition flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap ${
            adminSubTab === 'unpaid'
              ? 'bg-yellow-400 text-slate-950 shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <i className="fa-solid fa-hourglass-half"></i>
          <span>2. ค้างจ่าย ({metrics.unpaidCount})</span>
        </button>

        <button
          type="button"
          onClick={() => setAdminSubTab('winners')}
          className={`py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold transition flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap ${
            adminSubTab === 'winners'
              ? 'bg-rose-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <i className="fa-solid fa-trophy"></i>
          <span>3. รายจ่ายผู้ถูกรางวัล</span>
        </button>
      </div>

      {/* ==================================================================== */}
      {/* SUB-TAB 1 & 4: SUMMARY & WINNERS CALCULATOR                          */}
      {/* ==================================================================== */}
      {(adminSubTab === 'summary' || adminSubTab === 'winners') && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
          {/* Left 7 Cols: บันทึกเลขที่ออก & ตรวจผู้ถูกรางวัลประจำงวด */}
          <div className="lg:col-span-7 bg-white rounded-3xl p-4 sm:p-5 shadow-sm border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-extrabold text-base text-slate-900">
                  3. บันทึกผลรางวัลและคำนวณรายจ่ายคนที่ถูกประจำงวด ({periodLabel})
                </h3>
                <p className="text-xs text-slate-500">
                  พิมพ์เลข 2 ตัวบน และ 2 ตัวล่าง ระบบจะค้นหาชื่อผู้ถูกรางวัลจากแผงให้อัตโนมัติ
                </p>
              </div>
              <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 whitespace-nowrap">
                รางวัลละ {metrics.autoPrizePerWinner.toLocaleString()} บ.
              </span>
            </div>

            {/* Proportional Rule Toggle */}
            <div className="bg-amber-50/90 border border-amber-200 rounded-2xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="text-xs">
                <p className="font-bold text-slate-900">
                  กติกาคำนวณเงินรางวัล (ยอดจองปัจจุบัน: {metrics.totalBookedCount} เลข)
                </p>
                <p className="text-slate-600">
                  {metrics.totalBookedCount < 60 && draw.useProportionalRule
                    ? `ขายได้ ${metrics.totalBookedCount} เลข (ไม่ถึง 60 เลข) คิดตามสัดส่วน = รางวัลละ ${(
                        metrics.totalBookedCount * 50
                      ).toLocaleString()} บาท`
                    : `จ่ายรางวัลเต็มจำนวน รางวัลละ 3,000 บาท`}
                </p>
              </div>
              <label className="inline-flex items-center gap-2 cursor-pointer shrink-0 bg-white px-3 py-1.5 rounded-xl border border-amber-300 text-xs font-bold text-slate-800">
                <input
                  type="checkbox"
                  checked={draw.useProportionalRule}
                  onChange={(e) =>
                    onUpdateDrawRecord({
                      ...draw,
                      useProportionalRule: e.target.checked,
                    })
                  }
                  className="rounded text-huay-navy focus:ring-0"
                />
                <span>ลดรางวัลตามสัดส่วนเมื่อขายไม่ถึง 60 เลข</span>
              </label>
            </div>

            {/* Top & Bottom Winning Number Inputs + Winner Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* รางวัล 2 ตัวบน */}
              <div className="rounded-2xl border-2 border-slate-200 p-3.5 bg-slate-50/60 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-slate-700">
                    เลขท้าย 2 ตัวบน
                  </span>
                  <span className="text-xs font-bold text-rose-600">
                    รางวัล {metrics.topPrizeUnit.toLocaleString()} บาท
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    maxLength={2}
                    value={draw.winningTop}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '').slice(0, 2);
                      onUpdateDrawRecord({ ...draw, winningTop: val });
                    }}
                    placeholder="00"
                    className="w-24 text-center py-2.5 bg-white border-2 border-slate-300 focus:border-huay-navy rounded-xl text-2xl font-black text-slate-900 tabular-nums outline-none"
                  />
                  <div className="flex-1 min-w-0">
                    <label className="block text-[10px] font-semibold text-slate-500">
                      ปรับจำนวนเงินรางวัลบน (บาท)
                    </label>
                    <input
                      type="number"
                      min={0}
                      step={100}
                      value={draw.customTopPrize !== null ? draw.customTopPrize : metrics.autoPrizePerWinner}
                      onChange={(e) =>
                        onUpdateDrawRecord({
                          ...draw,
                          customTopPrize: e.target.value === '' ? null : Number(e.target.value),
                        })
                      }
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-800 outline-none"
                    />
                  </div>
                </div>

                {/* Winner Result Box */}
                {draw.winningTop.length === 2 ? (
                  metrics.topWinnerBooking ? (
                    <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-300 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-emerald-900">
                          🎉 ผู้ถูกรางวัลบน (เลข {draw.winningTop}):
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                            metrics.topWinnerBooking.status === 'paid'
                              ? 'bg-sky-500 text-white'
                              : 'bg-yellow-400 text-slate-900'
                          }`}
                        >
                          ค่าสลาก: {metrics.topWinnerBooking.status === 'paid' ? 'โอนแล้ว' : 'รอโอน'}
                        </span>
                      </div>
                      <p className="text-base font-black text-slate-900">
                        {metrics.topWinnerBooking.name}
                      </p>
                      <div className="flex items-center justify-between pt-1 border-t border-emerald-200">
                        <span className="text-xs font-bold text-rose-700">
                          จ่ายรางวัล: {metrics.actualTopPayout.toLocaleString()} บ.
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            onUpdateDrawRecord({ ...draw, topPrizePaid: !draw.topPrizePaid })
                          }
                          className={`text-xs font-bold px-2.5 py-1 rounded-lg border transition cursor-pointer ${
                            draw.topPrizePaid
                              ? 'bg-emerald-600 text-white border-emerald-700'
                              : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                          }`}
                        >
                          {draw.topPrizePaid ? '✓ จ่ายรางวัลแล้ว' : 'กดเมื่อจ่ายรางวัลแล้ว'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 rounded-xl bg-slate-100 border border-slate-200 text-center">
                      <p className="text-xs font-bold text-slate-600">
                        หมายเลข {draw.winningTop} เป็น "เลขว่าง" (ไม่มีผู้ถูกรางวัล)
                      </p>
                      <p className="text-[11px] text-slate-500">รายจ่ายรางวัลบน = 0 บาท</p>
                    </div>
                  )
                ) : (
                  <p className="text-xs text-slate-400 text-center py-2">
                    กรอกเลข 2 หลัก (00-99) เพื่อตรวจผู้ถูกรางวัลบน
                  </p>
                )}
              </div>

              {/* รางวัล 2 ตัวล่าง */}
              <div className="rounded-2xl border-2 border-slate-200 p-3.5 bg-slate-50/60 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-slate-700">
                    เลขท้าย 2 ตัวล่าง
                  </span>
                  <span className="text-xs font-bold text-rose-600">
                    รางวัล {metrics.bottomPrizeUnit.toLocaleString()} บาท
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    maxLength={2}
                    value={draw.winningBottom}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '').slice(0, 2);
                      onUpdateDrawRecord({ ...draw, winningBottom: val });
                    }}
                    placeholder="00"
                    className="w-24 text-center py-2.5 bg-white border-2 border-slate-300 focus:border-huay-navy rounded-xl text-2xl font-black text-slate-900 tabular-nums outline-none"
                  />
                  <div className="flex-1 min-w-0">
                    <label className="block text-[10px] font-semibold text-slate-500">
                      ปรับจำนวนเงินรางวัลล่าง (บาท)
                    </label>
                    <input
                      type="number"
                      min={0}
                      step={100}
                      value={
                        draw.customBottomPrize !== null
                          ? draw.customBottomPrize
                          : metrics.autoPrizePerWinner
                      }
                      onChange={(e) =>
                        onUpdateDrawRecord({
                          ...draw,
                          customBottomPrize: e.target.value === '' ? null : Number(e.target.value),
                        })
                      }
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-800 outline-none"
                    />
                  </div>
                </div>

                {/* Winner Result Box */}
                {draw.winningBottom.length === 2 ? (
                  metrics.bottomWinnerBooking ? (
                    <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-300 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-emerald-900">
                          🎉 ผู้ถูกรางวัลล่าง (เลข {draw.winningBottom}):
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                            metrics.bottomWinnerBooking.status === 'paid'
                              ? 'bg-sky-500 text-white'
                              : 'bg-yellow-400 text-slate-900'
                          }`}
                        >
                          ค่าสลาก: {metrics.bottomWinnerBooking.status === 'paid' ? 'โอนแล้ว' : 'รอโอน'}
                        </span>
                      </div>
                      <p className="text-base font-black text-slate-900">
                        {metrics.bottomWinnerBooking.name}
                      </p>
                      <div className="flex items-center justify-between pt-1 border-t border-emerald-200">
                        <span className="text-xs font-bold text-rose-700">
                          จ่ายรางวัล: {metrics.actualBottomPayout.toLocaleString()} บ.
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            onUpdateDrawRecord({
                              ...draw,
                              bottomPrizePaid: !draw.bottomPrizePaid,
                            })
                          }
                          className={`text-xs font-bold px-2.5 py-1 rounded-lg border transition cursor-pointer ${
                            draw.bottomPrizePaid
                              ? 'bg-emerald-600 text-white border-emerald-700'
                              : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                          }`}
                        >
                          {draw.bottomPrizePaid ? '✓ จ่ายรางวัลแล้ว' : 'กดเมื่อจ่ายรางวัลแล้ว'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 rounded-xl bg-slate-100 border border-slate-200 text-center">
                      <p className="text-xs font-bold text-slate-600">
                        หมายเลข {draw.winningBottom} เป็น "เลขว่าง" (ไม่มีผู้ถูกรางวัล)
                      </p>
                      <p className="text-[11px] text-slate-500">รายจ่ายรางวัลล่าง = 0 บาท</p>
                    </div>
                  )
                ) : (
                  <p className="text-xs text-slate-400 text-center py-2">
                    กรอกเลข 2 หลัก (00-99) เพื่อตรวจผู้ถูกรางวัลล่าง
                  </p>
                )}
              </div>
            </div>

            {/* Extra Expense Input */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-slate-100">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  รายการรายจ่ายอื่นๆ ประจำงวด (ถ้ามี)
                </label>
                <input
                  type="text"
                  value={draw.extraExpenseTitle}
                  onChange={(e) =>
                    onUpdateDrawRecord({ ...draw, extraExpenseTitle: e.target.value })
                  }
                  placeholder="เช่น ค่าธรรมเนียม, สมทบกิจกรรมพิเศษ..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium outline-none focus:border-huay-navy"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  จำนวนเงินรายจ่ายอื่น (บาท)
                </label>
                <input
                  type="number"
                  min={0}
                  value={draw.extraExpenseAmount || ''}
                  onChange={(e) =>
                    onUpdateDrawRecord({
                      ...draw,
                      extraExpenseAmount: Number(e.target.value) || 0,
                    })
                  }
                  placeholder="0"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-huay-navy tabular-nums"
                />
              </div>
            </div>
          </div>

          {/* Right 5 Cols: ตารางสรุปงบดุลประจำงวด & สรุปรวม 2 งวดประจำเดือน */}
          <div className="lg:col-span-5 bg-white rounded-3xl p-4 sm:p-5 shadow-sm border border-slate-200 space-y-4">
            <h3 className="font-extrabold text-base text-slate-900 border-b border-slate-100 pb-3">
              5. ตารางสรุปยอดรายรับ - รายจ่าย ({periodLabel})
            </h3>

            <div className="space-y-2 text-xs sm:text-sm">
              <div className="flex justify-between py-2 px-3 rounded-xl bg-slate-50">
                <span className="text-slate-600 font-medium">
                  ยอดจองทั้งหมด ({metrics.totalBookedCount} เลข × 100 บ.)
                </span>
                <span className="font-bold text-slate-900 tabular-nums">
                  {metrics.totalExpectedRevenue.toLocaleString()} บาท
                </span>
              </div>

              <div className="flex justify-between py-2 px-3 rounded-xl bg-sky-50 border border-sky-200">
                <span className="text-sky-900 font-bold">
                  + รายรับจริงที่โอนแล้ว ({metrics.paidCount} เลข)
                </span>
                <span className="font-black text-sky-700 tabular-nums">
                  +{metrics.paidRevenue.toLocaleString()} บาท
                </span>
              </div>

              <div className="flex justify-between py-2 px-3 rounded-xl bg-yellow-50 border border-yellow-300">
                <span className="text-yellow-900 font-bold">
                  • รายการค้างจ่าย รอโอน ({metrics.unpaidCount} เลข)
                </span>
                <span className="font-black text-yellow-700 tabular-nums">
                  {metrics.unpaidRevenue.toLocaleString()} บาท
                </span>
              </div>

              <div className="flex justify-between py-2 px-3 rounded-xl bg-rose-50 border border-rose-200">
                <span className="text-rose-900 font-bold">- รวมรายจ่ายรางวัลประจำงวด</span>
                <span className="font-black text-rose-700 tabular-nums">
                  -{metrics.totalExpense.toLocaleString()} บาท
                </span>
              </div>

              <div className="flex justify-between items-center py-3 px-4 rounded-2xl bg-huay-navy text-white mt-2">
                <div>
                  <p className="font-extrabold text-xs text-amber-300">
                    คงเหลือสุทธิ (คิดจากยอดโอนแล้วจริง)
                  </p>
                  <p className="text-[11px] text-slate-300">
                    หากเก็บยอดค้างจ่ายครบ: {metrics.netProfitIfAllPaid.toLocaleString()} บาท
                  </p>
                </div>
                <span className="text-xl font-black text-emerald-300 tabular-nums">
                  {metrics.netProfitFromPaid >= 0 ? '+' : ''}
                  {metrics.netProfitFromPaid.toLocaleString()} บ.
                </span>
              </div>
            </div>

            {/* Monthly 2-Draw Combined Box */}
            <div className="pt-3 border-t border-slate-200">
              <p className="text-xs font-extrabold text-slate-800 mb-2">
                สรุปรวม 2 งวดประจำเดือน{monthObj.label} {yearBE} (วันที่ 1 + วันที่ 16):
              </p>
              <div className="grid grid-cols-3 gap-2 text-center bg-slate-50 p-3 rounded-2xl border border-slate-200 text-xs">
                <div>
                  <p className="text-[11px] text-slate-500">รายรับโอนแล้ว (2 งวด)</p>
                  <p className="font-black text-sky-600 text-sm tabular-nums">
                    {(day01Summary.paidRevenue + day16Summary.paidRevenue).toLocaleString()} บ.
                  </p>
                </div>
                <div>
                  <p className="text-[11px] text-slate-500">รายจ่ายรวม (2 งวด)</p>
                  <p className="font-black text-rose-600 text-sm tabular-nums">
                    {(day01Summary.totalExpense + day16Summary.totalExpense).toLocaleString()} บ.
                  </p>
                </div>
                <div>
                  <p className="text-[11px] text-slate-500">คงเหลือสุทธิทั้งเดือน</p>
                  <p className="font-black text-emerald-600 text-sm tabular-nums">
                    {(
                      day01Summary.netProfitFromPaid + day16Summary.netProfitFromPaid
                    ).toLocaleString()}{' '}
                    บ.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* SUB-TAB 2: 1. รายรับจากคนที่จอง (Revenue & Booker Summary Table)       */}
      {/* ==================================================================== */}
      {(adminSubTab === 'revenue' || adminSubTab === 'summary') && (
        <div className="bg-white rounded-3xl p-4 sm:p-5 shadow-sm border border-slate-200 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-extrabold text-base text-slate-900">
                1. ตารางรายรับจากคนที่จอง (สรุปยอดรายบุคคล — {periodLabel})
              </h3>
              <p className="text-xs text-slate-500">
                โอนแล้ว (สีฟ้า): {metrics.paidCount} เลข = {metrics.paidRevenue.toLocaleString()} บาท ·
                รวมผู้จองทั้งหมด {metrics.personSummary.length} ท่าน
              </p>
            </div>
          </div>

          {metrics.personSummary.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-sm">
              ยังไม่มีข้อมูลผู้จองในงวดนี้
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs sm:text-sm">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                    <th className="py-2.5 px-3 rounded-tl-xl">#</th>
                    <th className="py-2.5 px-3">ชื่อผู้จอง</th>
                    <th className="py-2.5 px-3 text-center">จำนวนรวม</th>
                    <th className="py-2.5 px-3">เลขที่โอนแล้ว (สีฟ้า)</th>
                    <th className="py-2.5 px-3 text-right">รายรับโอนแล้ว</th>
                    <th className="py-2.5 px-3 text-right rounded-tr-xl">ค้างจ่าย (รอโอน)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {metrics.personSummary.map((p, idx) => (
                    <tr key={p.name} className="hover:bg-slate-50/80">
                      <td className="py-2.5 px-3 text-slate-400 font-semibold tabular-nums">
                        {idx + 1}
                      </td>
                      <td className="py-2.5 px-3 font-bold text-slate-900">{p.name}</td>
                      <td className="py-2.5 px-3 text-center font-bold tabular-nums">
                        {p.totalNums} เลข
                      </td>
                      <td className="py-2.5 px-3">
                        {p.paidNums.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {p.paidNums.map((n) => (
                              <button
                                key={n}
                                type="button"
                                onClick={() => onOpenBookingModal(n)}
                                className="px-2 py-0.5 rounded-md bg-sky-500 text-white font-bold text-xs tabular-nums cursor-pointer"
                              >
                                {n}
                              </button>
                            ))}
                          </div>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-right font-extrabold text-sky-600 tabular-nums">
                        {p.paidAmount.toLocaleString()} บ.
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold tabular-nums">
                        {p.unpaidAmount > 0 ? (
                          <span className="text-yellow-700 bg-yellow-100 px-2 py-0.5 rounded-md">
                            {p.unpaidAmount.toLocaleString()} บ. ({p.unpaidNums.join(', ')})
                          </span>
                        ) : (
                          <span className="text-emerald-600">ครบแล้ว</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ==================================================================== */}
      {/* SUB-TAB 3: 2. รายการค้างจ่ายจากคนที่จอง (Unpaid / Pending List)        */}
      {/* ==================================================================== */}
      {(adminSubTab === 'unpaid' || adminSubTab === 'summary') && (
        <div className="bg-white rounded-3xl p-4 sm:p-5 shadow-sm border border-yellow-300 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-extrabold text-base text-slate-900">
                2. รายการค้างจ่ายจากคนที่จอง (สถานะรอโอน · สีเหลือง)
              </h3>
              <p className="text-xs text-slate-500">
                รวมค้างจ่าย {metrics.unpaidCount} เลข เป็นเงินทั้งสิ้น{' '}
                <strong className="text-yellow-700">
                  {metrics.unpaidRevenue.toLocaleString()} บาท
                </strong>{' '}
                (กดปุ่ม "รับโอนแล้ว" เพื่อเปลี่ยนเป็นสีฟ้าได้ทันที)
              </p>
            </div>

            <button
              type="button"
              onClick={handleCopyUnpaidListToLine}
              className="bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-extrabold py-2 px-3.5 rounded-xl text-xs transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap self-start sm:self-auto"
            >
              <i className="fa-brands fa-line text-sm"></i>
              <span>คัดลอกรายการค้างจ่ายส่ง LINE</span>
            </button>
          </div>

          {metrics.unpaidPersons.length === 0 ? (
            <div className="text-center py-8 bg-emerald-50/60 rounded-2xl border border-emerald-200 text-emerald-800 font-bold text-sm">
              <i className="fa-solid fa-circle-check text-xl mb-1 block text-emerald-600"></i>
              ไม่มีรายการค้างจ่าย! ผู้จองชำระเงินครบทุกหมายเลขแล้ว
            </div>
          ) : (
            <div className="space-y-2">
              {metrics.unpaidPersons.map((person, idx) => (
                <div
                  key={person.name}
                  className="p-3 rounded-2xl bg-yellow-50/70 border border-yellow-300 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-400 tabular-nums">
                        #{idx + 1}
                      </span>
                      <span className="font-extrabold text-sm sm:text-base text-slate-900">
                        {person.name}
                      </span>
                      <span className="text-xs font-extrabold text-yellow-900 bg-yellow-300 px-2 py-0.5 rounded-md tabular-nums">
                        ค้าง {person.unpaidNums.length} เลข = {person.unpaidAmount.toLocaleString()} บาท
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-xs text-slate-600">หมายเลขที่รอโอน:</span>
                      {person.unpaidNums.map((num) => (
                        <button
                          key={num}
                          type="button"
                          onClick={() => onToggleBookingStatus(num)}
                          className="px-2.5 py-1 rounded-lg pending-card-gradient text-slate-950 font-black text-xs border border-yellow-600 shadow-2xs hover:brightness-95 cursor-pointer tabular-nums flex items-center gap-1"
                          title="คลิกเพื่อเปลี่ยนเลขนี้เป็น โอนแล้ว (สีฟ้า)"
                        >
                          <span>{num}</span>
                          <i className="fa-solid fa-check text-[10px] opacity-75"></i>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => onMarkAllPersonPaid(person.name)}
                      className="bg-sky-600 hover:bg-sky-700 text-white font-bold py-2 px-3.5 rounded-xl text-xs shadow-xs transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                    >
                      <i className="fa-solid fa-check-double"></i>
                      <span>รับโอนครบทุกเลข ({person.unpaidAmount.toLocaleString()} บ.)</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
