/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { PWAInstallButton, OfflineIndicator } from './PWAInstallButton';
import { SalesInfographic } from './SalesInfographic';
import {
  AdminDashboard,
  DEFAULT_DRAW_RECORD,
  THAI_MONTHS,
  formatPeriodLabel,
  type PeriodData,
  type PeriodDrawRecord,
} from './AdminDashboard';

export type PaymentStatus = 'pending' | 'paid';

export interface BookingItem {
  name: string;
  note: string;
  status: PaymentStatus;
  updatedAt: number;
}

type BookingsMap = Record<string, BookingItem>;
type FilterMode = 'all' | 'available' | 'pending' | 'paid';
type LineTextMode = 'grid' | 'list';
type MainViewMode = 'board' | 'admin';

const ALL_NUMBERS = Array.from({ length: 100 }, (_, i) => String(i).padStart(2, '0'));
const STORAGE_KEY_BOOKINGS = 'huayplus_bookings_00_99_v1';
const STORAGE_KEY_PERIODS_MAP = 'huayplus_periods_map_v1';
const STORAGE_KEY_ACTIVE_PERIOD = 'huayplus_active_period_v1';
const STORAGE_KEY_TITLE = 'huayplus_board_title_v1';
const STORAGE_KEY_LOGO = 'huayplus_custom_logo_v1';

const MAIN_HEADER_TITLE = 'หวยพลัส+ สลากการกุศล นนส.ขส. 2131';
const DEFAULT_BOARD_SUBTITLE = 'สลากการกุศล รุ่น นนส.ขส. 2131 (เฉพาะกิจ)';

const PROMO_LINE_1 = 'ขอเชิญเพื่อนๆร่วมสนับสนุนสลากการกุศลเพื่อสวัสดิการ รุ่น นนส.ขส. 2131 (เฉพาะกิจ)';
const PROMO_LINE_2 = 'เบอร์ละ 100 บาท ผลตอบแทน บน หรือ ล่าง รับรางวัล ๆ ละ 3,000 บาท (ขออนุญาตจ่ายสด งดเชื่อนะครับ)';
const PROMO_LINE_3 = '⏰ ปิดการขายเวลา 14.00 น.ของวันออกสลาก';

const NOTE_LINE_1 = 'หมายเหตุ _ ขายสลากไม่ถึงจำนวน 60 ตัวเลข เงินรางวัลลดลงตามสัดส่วน';
const NOTE_LINE_2 = 'ตัวอย่าง ขายสลากได้ 50 ตัวเลข ๆ ละ 100 บาท ได้เงิน 5,000 บาท เงินรางวัลเหลือ 2,500 บาท';

// รายชื่อผู้จองที่แนบมาทั้งหมด
const PRESET_BOOKER_NAMES: string[] = [
  'ปรีชากูล คูณทรัพย์',
  'ภราดร ปองขันธ์',
  'รุ่งเรือง ถ้วยทอง',
  'ชวลิต บุษยมณี',
  'คมกฤช สุขเกิด',
  'เหมราช เนื่องพิมพ์',
  'สมาน ชุมศรี',
  'ประวิทย์ ลือวัฒนะ',
  'บุญเลื่อน ดวงอินทร์',
  'สมภพ กำลังเอก',
  'สิทธิพล ธาตุไชย',
  'มนต์เทียน กาแก้ว',
  'นิยม สมาคม',
  'วิสุทธิ์ จันทร์ตาฝั้น',
  'สามารถ บุญเกิด',
  'วสัน แพงศรี',
  'อรุณ ลอยศักดิ์',
  'ชาลี พุกยม',
  'ทนัน เคยเห็น',
  'ยงยุทธ บุญราศรี',
  'ประสาท ลัทธิวรรณ',
  'ธีระวุธ พรรณลึก',
  'สุรยุทธ นรินทร์',
  'สุนทร สิทธิมงคล',
  'อภิรักษ์ สุขคุ้ม',
  'วรายุทธ เหล็กเพชร',
  'ธวัชชัย ชะนุดรัมย์',
  'ชุมพร สุขกล่อม',
  'สุชาติ พราหมอนงค์',
  'อนันตจักร์ อิ่มโพธิ์',
  'ประวิทย์ ทำทะลุง',
  'อุมารุวัช รัตนโสภา',
  'พรรษา สังข์ป่า',
  'อภิศักดิ์ ศุภคล',
  'ประทวน โนพร',
  'ประชัน บุญสมบัติ',
  'อดิศร เอมโอษฐ์',
  'พรเทพ ทิพย์บำรุง',
  'อาคม สร้อยสิงห์',
  'สุระศักดิ์ มังกร',
  'ยุทธนานนท์ อุตโรกลุ',
  'ไพฑูรย์ ราษฎรดี',
  'เสนีย์ ปลัดภูมิ',
  'วุฒิ ชาญดนตรี',
  'ชูเกียรติ สุขประเสริฐ',
  'ธีระเดช ใจดี',
  'สมภพ ระลึกธรรม',
  'ทฤษฎี ริมผดี',
  'กฤษฎา รุมมูลตรี',
  'สุริยา เบ้าสาทร',
  'ไพรัตน์ พันธุนนท์',
  'เกียรติศักดิ์ พรหมรักษ์',
  'พยุง วังภาษร',
  'พรณรงค์ ประสพสิน',
  'พิชิตศึก ศิริ',
  'พิษณุ สุขศาสตร์',
  'เปรมยงค์ แสนใจวุฒิ',
  'ประภาศ ห่วงแก้ว',
  'สุทธิศักดิ์ บุนนาค',
  'ชัชวาลย์ เจริญสุข',
  'วิทยา รักษ์พงษ์',
  'วิมล อาทร',
  'สุวิทย์ ดอกคำ',
  'ประวัติ อาจสาลี',
  'พิทักษ์พงศ์ พรมมาลุน',
];

function normalizeBookingStatus(item: Partial<BookingItem> | undefined): PaymentStatus {
  if (!item) return 'pending';
  if (item.status === 'paid' || item.status === 'pending') {
    return item.status;
  }
  const note = item.note || '';
  if (note.includes('โอนแล้ว') || note.includes('จ่ายแล้ว') || note.includes('จ่ายสด')) {
    return 'paid';
  }
  return 'pending';
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

export default function App() {
  // --- Main View Mode: 'board' (กระดานจองเลข 00-99) | 'admin' (หน้า Admin บัญชีรายรับ-รายจ่าย) ---
  const [mainView, setMainView] = useState<MainViewMode>('board');

  // --- Active Period State (ใน 1 เดือน มี 2 งวด คืองวดวันที่ 1 และวันที่ 16 ของทุกเดือน) ---
  const [activePeriod, setActivePeriod] = useState<{
    yearBE: string;
    monthVal: string;
    daySlot: '01' | '16';
  }>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_ACTIVE_PERIOD);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (
          parsed &&
          typeof parsed.yearBE === 'string' &&
          typeof parsed.monthVal === 'string' &&
          (parsed.daySlot === '01' || parsed.daySlot === '16')
        ) {
          return parsed;
        }
      }
    } catch {
      // ignore
    }
    return { yearBE: '2569', monthVal: '11', daySlot: '16' };
  });

  // --- Persistent Multi-Period Data Map ---
  const [periodsMap, setPeriodsMap] = useState<Record<string, PeriodData>>(() => {
    let legacyBookings: BookingsMap = {};
    try {
      const savedLegacy = localStorage.getItem(STORAGE_KEY_BOOKINGS);
      if (savedLegacy) {
        const parsed = JSON.parse(savedLegacy) as Record<string, Partial<BookingItem>>;
        Object.keys(parsed).forEach((num) => {
          const entry = parsed[num];
          if (entry && entry.name) {
            legacyBookings[num] = {
              name: entry.name,
              note: entry.note || '',
              status: normalizeBookingStatus(entry),
              updatedAt: entry.updatedAt || Date.now(),
            };
          }
        });
      }
    } catch {
      legacyBookings = {};
    }

    try {
      const savedMap = localStorage.getItem(STORAGE_KEY_PERIODS_MAP);
      if (savedMap) {
        const parsedMap = JSON.parse(savedMap) as Record<string, PeriodData>;
        if (parsedMap && typeof parsedMap === 'object') {
          return parsedMap;
        }
      }
    } catch {
      // ignore
    }

    // Seed initial period with any existing bookings
    return {
      '2569-11-16': {
        bookings: legacyBookings,
        draw: { ...DEFAULT_DRAW_RECORD },
      },
    };
  });

  const periodKey = `${activePeriod.yearBE}-${activePeriod.monthVal}-${activePeriod.daySlot}`;
  const otherSlotKey = `${activePeriod.yearBE}-${activePeriod.monthVal}-${
    activePeriod.daySlot === '01' ? '16' : '01'
  }`;

  const currentPeriodData: PeriodData = useMemo(() => {
    return (
      periodsMap[periodKey] || {
        bookings: {},
        draw: { ...DEFAULT_DRAW_RECORD },
      }
    );
  }, [periodsMap, periodKey]);

  const otherSlotPeriodData: PeriodData = useMemo(() => {
    return (
      periodsMap[otherSlotKey] || {
        bookings: {},
        draw: { ...DEFAULT_DRAW_RECORD },
      }
    );
  }, [periodsMap, otherSlotKey]);

  const bookings = currentPeriodData.bookings;

  const setBookings = useCallback(
    (updater: BookingsMap | ((prev: BookingsMap) => BookingsMap)) => {
      setPeriodsMap((prevMap) => {
        const existingPeriod = prevMap[periodKey] || {
          bookings: {},
          draw: { ...DEFAULT_DRAW_RECORD },
        };
        const nextBookings =
          typeof updater === 'function' ? updater(existingPeriod.bookings) : updater;
        return {
          ...prevMap,
          [periodKey]: {
            ...existingPeriod,
            bookings: nextBookings,
          },
        };
      });
    },
    [periodKey]
  );

  const handleUpdateDrawRecord = useCallback(
    (nextDraw: PeriodDrawRecord) => {
      setPeriodsMap((prevMap) => {
        const existingPeriod = prevMap[periodKey] || {
          bookings: {},
          draw: { ...DEFAULT_DRAW_RECORD },
        };
        return {
          ...prevMap,
          [periodKey]: {
            ...existingPeriod,
            draw: nextDraw,
          },
        };
      });
    },
    [periodKey]
  );

  const handleChangePeriod = useCallback(
    (yearBE: string, monthVal: string, daySlot: '01' | '16') => {
      setActivePeriod({ yearBE, monthVal, daySlot });
    },
    []
  );

  const [boardTitle, setBoardTitle] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_TITLE);
      // แทนที่ข้อความเริ่มต้นเดิม "แผงจองตัวเลขประจำงวด" ด้วยข้อความใหม่ตามรูปที่แนบ
      if (!saved || saved === 'แผงจองตัวเลขประจำงวด') {
        return DEFAULT_BOARD_SUBTITLE;
      }
      return saved;
    } catch {
      return DEFAULT_BOARD_SUBTITLE;
    }
  });

  const [customLogoDataUrl, setCustomLogoDataUrl] = useState<string | null>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY_LOGO) || null;
    } catch {
      return null;
    }
  });

  const [logoSrc, setLogoSrc] = useState<string>('');
  const [filter, setFilter] = useState<FilterMode>('all');
  const [search, setSearch] = useState<string>('');
  const [gridCols, setGridCols] = useState<5 | 10>(5);
  const [lineTextMode, setLineTextMode] = useState<LineTextMode>('grid');

  // --- Modals State ---
  const [selectedNumber, setSelectedNumber] = useState<string | null>(null);
  const [bookerNameInput, setBookerNameInput] = useState<string>('');
  const [bookerNoteInput, setBookerNoteInput] = useState<string>('');
  const [bookerStatusInput, setBookerStatusInput] = useState<PaymentStatus>('pending');
  const [nameFilterQuery, setNameFilterQuery] = useState<string>('');

  const [isLineModalOpen, setIsLineModalOpen] = useState<boolean>(false);
  const [lineModalTab, setLineModalTab] = useState<'image' | 'text' | 'infographic'>('image');

  const [isListModalOpen, setIsListModalOpen] = useState<boolean>(false);
  const [isTitleModalOpen, setIsTitleModalOpen] = useState<boolean>(false);
  const [titleInput, setTitleInput] = useState<string>('');
  const [isConfirmClearOpen, setIsConfirmClearOpen] = useState<boolean>(false);

  // --- Toast State ---
  const [toast, setToast] = useState<{ message: string; isError: boolean; visible: boolean }>({
    message: '',
    isError: false,
    visible: false,
  });

  // --- Refs ---
  const masterSvgRef = useRef<SVGSVGElement | null>(null);
  const logoFileInputRef = useRef<HTMLInputElement | null>(null);
  const bookerNameInputRef = useRef<HTMLInputElement | null>(null);
  const exportCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const desktopCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const clipboardHelperRef = useRef<HTMLTextAreaElement | null>(null);
  const logoImgObjRef = useRef<HTMLImageElement | null>(null);
  const toastTimerRef = useRef<number | null>(null);

  const showToast = useCallback((message: string, isError = false) => {
    setToast({ message, isError, visible: true });
    if (toastTimerRef.current) {
      window.clearTimeout(toastTimerRef.current);
    }
    toastTimerRef.current = window.setTimeout(() => {
      setToast((prev) => ({ ...prev, visible: false }));
    }, 2800);
  }, []);

  // Save to LocalStorage whenever periodsMap, activePeriod, boardTitle, or customLogoDataUrl change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_PERIODS_MAP, JSON.stringify(periodsMap));
      localStorage.setItem(STORAGE_KEY_BOOKINGS, JSON.stringify(bookings));
    } catch (e) {
      console.error('Failed to save periodsMap:', e);
    }
  }, [periodsMap, bookings]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_ACTIVE_PERIOD, JSON.stringify(activePeriod));
    } catch (e) {
      console.error('Failed to save activePeriod:', e);
    }
  }, [activePeriod]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_TITLE, boardTitle);
    } catch (e) {
      console.error('Failed to save board title:', e);
    }
  }, [boardTitle]);

  useEffect(() => {
    try {
      if (customLogoDataUrl) {
        localStorage.setItem(STORAGE_KEY_LOGO, customLogoDataUrl);
      } else {
        localStorage.removeItem(STORAGE_KEY_LOGO);
      }
    } catch (e) {
      console.error('Failed to save custom logo:', e);
    }
  }, [customLogoDataUrl]);

  // --- Computed Values ---
  const bookedKeys = useMemo(() => Object.keys(bookings).sort(), [bookings]);
  const bookedCount = bookedKeys.length;
  const availableCount = 100 - bookedCount;

  const { pendingCount, paidCount } = useMemo(() => {
    let pending = 0;
    let paid = 0;
    bookedKeys.forEach((num) => {
      if (bookings[num]?.status === 'paid') {
        paid += 1;
      } else {
        pending += 1;
      }
    });
    return { pendingCount: pending, paidCount: paid };
  }, [bookings, bookedKeys]);

  // Count how many numbers each person has booked
  const bookerNumberCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    Object.values(bookings).forEach((b) => {
      if (b.name) {
        counts[b.name] = (counts[b.name] || 0) + 1;
      }
    });
    return counts;
  }, [bookings]);

  // Filtered preset names inside Booking Modal
  const filteredPresetNames = useMemo(() => {
    const q = nameFilterQuery.trim().toLowerCase();
    if (!q) return PRESET_BOOKER_NAMES;
    return PRESET_BOOKER_NAMES.filter((name) => name.toLowerCase().includes(q));
  }, [nameFilterQuery]);

  // --- Draw 1080x1580 00-99 Board on Canvas (Matching Image 1 Layout + Yellow/Blue Status) ---
  const drawCanvasBoard = useCallback(
    (canvas: HTMLCanvasElement | null) => {
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const W = canvas.width; // 1080
      const H = canvas.height; // 1580

      // 1. Background Navy-Gold Gradient
      const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
      bgGrad.addColorStop(0, '#041230');
      bgGrad.addColorStop(0.5, '#0a2254');
      bgGrad.addColorStop(1, '#041028');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, W, H);

      // Outer Gold Border
      ctx.strokeStyle = '#facc15';
      ctx.lineWidth = 10;
      ctx.strokeRect(15, 15, W - 30, H - 30);

      // 2. Draw Logo at Top Left
      const logoImg = logoImgObjRef.current;
      if (logoImg && logoImg.complete && logoImg.naturalWidth > 0) {
        ctx.save();
        roundRect(ctx, 42, 36, 142, 142, 28);
        ctx.clip();
        ctx.drawImage(logoImg, 42, 36, 142, 142);
        ctx.restore();

        ctx.strokeStyle = '#fde047';
        ctx.lineWidth = 4;
        roundRect(ctx, 42, 36, 142, 142, 28);
        ctx.stroke();
      }

      // 3. Header Text (Replaced with "หวยพลัส+ สลากการกุศล นนส.ขส. 2131")
      ctx.fillStyle = '#fde047';
      ctx.font = '900 46px Kanit, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(MAIN_HEADER_TITLE, 205, 86);

      ctx.fillStyle = '#ffffff';
      ctx.font = '700 28px Kanit, sans-serif';
      ctx.fillText(boardTitle, 205, 128);

      // Stats Badges on Header (Blue = โอนแล้ว, Yellow = รอโอน, White = ว่าง)
      // Badge 1: โอนแล้ว (สีฟ้า)
      ctx.fillStyle = '#0284c7';
      roundRect(ctx, 205, 144, 260, 42, 11);
      ctx.fill();
      ctx.strokeStyle = '#7dd3fc';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = '#ffffff';
      ctx.font = '700 21px Kanit, sans-serif';
      ctx.fillText(`โอนแล้ว (ฟ้า): ${paidCount} เลข`, 222, 172);

      // Badge 2: รอโอน (สีเหลือง)
      ctx.fillStyle = '#facc15';
      roundRect(ctx, 478, 144, 265, 42, 11);
      ctx.fill();
      ctx.strokeStyle = '#fef08a';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = '#0f172a';
      ctx.font = '700 21px Kanit, sans-serif';
      ctx.fillText(`รอโอน (เหลือง): ${pendingCount} เลข`, 495, 172);

      // Badge 3: ว่าง (สีขาว)
      ctx.fillStyle = '#ffffff';
      roundRect(ctx, 756, 144, 220, 42, 11);
      ctx.fill();
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = '#0f172a';
      ctx.font = '700 21px Kanit, sans-serif';
      ctx.fillText(`ว่าง: ${availableCount} เลข`, 778, 172);

      // 4. Promotional Banner Box (Matching Image 1 Top Box)
      const promoX = 42;
      const promoY = 198;
      const promoW = W - 84;
      const promoH = 114;

      const promoGrad = ctx.createLinearGradient(promoX, promoY, promoX, promoY + promoH);
      promoGrad.addColorStop(0, '#fefce8');
      promoGrad.addColorStop(1, '#fef9c3');
      ctx.fillStyle = promoGrad;
      roundRect(ctx, promoX, promoY, promoW, promoH, 18);
      ctx.fill();
      ctx.strokeStyle = '#eab308';
      ctx.lineWidth = 3;
      ctx.stroke();

      ctx.textAlign = 'center';
      // Line 1: Navy bold
      ctx.fillStyle = '#0f172a';
      ctx.font = '800 23px Kanit, sans-serif';
      ctx.fillText(PROMO_LINE_1, W / 2, promoY + 34);

      // Line 2: Red bold
      ctx.fillStyle = '#dc2626';
      ctx.font = '800 23px Kanit, sans-serif';
      ctx.fillText(PROMO_LINE_2, W / 2, promoY + 68);

      // Line 3: Green bold
      ctx.fillStyle = '#15803d';
      ctx.font = '800 22px Kanit, sans-serif';
      ctx.fillText(PROMO_LINE_3, W / 2, promoY + 100);

      // 5. Draw 10x10 Grid of Numbers 00-99
      const startX = 42;
      const startY = 326;
      const gridW = W - 84;
      const gridH = 1060;
      const cols = 10;
      const rows = 10;
      const gap = 8;
      const cellW = (gridW - gap * (cols - 1)) / cols;
      const cellH = (gridH - gap * (rows - 1)) / rows;

      ALL_NUMBERS.forEach((num, idx) => {
        const col = idx % 10;
        const row = Math.floor(idx / 10);
        const x = startX + col * (cellW + gap);
        const y = startY + row * (cellH + gap);

        const booking = bookings[num];
        const isBooked = Boolean(booking);
        const status = booking?.status || 'pending';

        // Cell Box
        roundRect(ctx, x, y, cellW, cellH, 14);
        if (isBooked && status === 'paid') {
          // โอนแล้ว -> สีฟ้า
          const cellGrad = ctx.createLinearGradient(x, y, x, y + cellH);
          cellGrad.addColorStop(0, '#38bdf8');
          cellGrad.addColorStop(0.5, '#0ea5e9');
          cellGrad.addColorStop(1, '#0284c7');
          ctx.fillStyle = cellGrad;
          ctx.fill();
          ctx.strokeStyle = '#bae6fd';
          ctx.lineWidth = 2.5;
          ctx.stroke();
        } else if (isBooked && status === 'pending') {
          // รอโอน -> สีเหลือง
          const cellGrad = ctx.createLinearGradient(x, y, x, y + cellH);
          cellGrad.addColorStop(0, '#fde047');
          cellGrad.addColorStop(0.55, '#facc15');
          cellGrad.addColorStop(1, '#eab308');
          ctx.fillStyle = cellGrad;
          ctx.fill();
          ctx.strokeStyle = '#ca8a04';
          ctx.lineWidth = 2.5;
          ctx.stroke();
        } else {
          // ว่าง -> สีขาว
          ctx.fillStyle = '#ffffff';
          ctx.fill();
          ctx.strokeStyle = '#cbd5e1';
          ctx.lineWidth = 2;
          ctx.stroke();
        }

        // Number Text
        ctx.textAlign = 'center';
        if (isBooked && status === 'paid') {
          ctx.fillStyle = '#ffffff';
        } else {
          ctx.fillStyle = '#0f172a';
        }
        ctx.font = '900 36px Kanit, sans-serif';
        ctx.fillText(num, x + cellW / 2, y + 46);

        // Booker Name or Available Label
        if (isBooked) {
          if (status === 'paid') {
            ctx.fillStyle = 'rgba(3, 43, 96, 0.45)';
            roundRect(ctx, x + 5, y + 58, cellW - 10, 32, 8);
            ctx.fill();
            ctx.fillStyle = '#ffffff';
          } else {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.72)';
            roundRect(ctx, x + 5, y + 58, cellW - 10, 32, 8);
            ctx.fill();
            ctx.fillStyle = '#0f172a';
          }

          ctx.font = '700 17px Kanit, sans-serif';
          const shortName = booking.name.length > 8 ? booking.name.slice(0, 7) + '…' : booking.name;
          ctx.fillText(shortName, x + cellW / 2, y + 80);
        } else {
          ctx.fillStyle = '#94a3b8';
          ctx.font = '500 17px Kanit, sans-serif';
          ctx.fillText('ว่าง', x + cellW / 2, y + 80);
        }
      });

      // 6. Bottom Note Box (Matching Image 1 Bottom Box)
      const noteX = 42;
      const noteY = 1402;
      const noteW = W - 84;
      const noteH = 98;

      ctx.fillStyle = 'rgba(15, 23, 42, 0.78)';
      roundRect(ctx, noteX, noteY, noteW, noteH, 16);
      ctx.fill();
      ctx.strokeStyle = 'rgba(250, 204, 21, 0.45)';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.textAlign = 'center';
      ctx.fillStyle = '#fde047';
      ctx.font = '700 24px Kanit, sans-serif';
      ctx.fillText(NOTE_LINE_1, W / 2, noteY + 40);

      ctx.fillStyle = '#f8fafc';
      ctx.font = '500 22px Kanit, sans-serif';
      ctx.fillText(NOTE_LINE_2, W / 2, noteY + 76);

      // 7. Footer Timestamp
      const nowStr = new Date().toLocaleString('th-TH', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
      ctx.textAlign = 'center';
      ctx.fillStyle = '#94a3b8';
      ctx.font = '500 21px Kanit, sans-serif';
      ctx.fillText(
        `อัปเดตข้อมูลล่าสุด: ${nowStr} น. | ระบบจองหมายเลข หวยพลัส+ (รุ่น นนส.ขส. 2131)`,
        W / 2,
        H - 34
      );
    },
    [bookings, boardTitle, paidCount, pendingCount, availableCount]
  );

  // --- Build Default SVG Data URL or Custom Logo ---
  const updateLogoImage = useCallback(() => {
    let activeSrc = customLogoDataUrl;
    if (!activeSrc && masterSvgRef.current) {
      const clonedSvg = masterSvgRef.current.cloneNode(true) as SVGSVGElement;
      clonedSvg.classList.remove('hidden');
      clonedSvg.setAttribute('width', '500');
      clonedSvg.setAttribute('height', '500');
      const svgString = new XMLSerializer().serializeToString(clonedSvg);
      activeSrc = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgString);
    }
    if (activeSrc) {
      setLogoSrc(activeSrc);
      const img = new Image();
      img.onload = () => {
        logoImgObjRef.current = img;
        drawCanvasBoard(exportCanvasRef.current);
        drawCanvasBoard(desktopCanvasRef.current);
      };
      img.src = activeSrc;
    }
  }, [customLogoDataUrl, drawCanvasBoard]);

  useEffect(() => {
    updateLogoImage();
  }, [updateLogoImage]);

  // Redraw canvases whenever bookings, boardTitle, or modal opens
  useEffect(() => {
    drawCanvasBoard(desktopCanvasRef.current);
    if (isLineModalOpen) {
      drawCanvasBoard(exportCanvasRef.current);
    }
  }, [bookings, boardTitle, isLineModalOpen, lineModalTab, drawCanvasBoard]);

  const filteredNumbers = useMemo(() => {
    const query = search.trim().toLowerCase();
    return ALL_NUMBERS.filter((num) => {
      const booking = bookings[num];
      const isBooked = Boolean(booking);

      if (filter === 'available' && isBooked) return false;
      if (filter === 'pending' && (!isBooked || booking.status !== 'pending')) return false;
      if (filter === 'paid' && (!isBooked || booking.status !== 'paid')) return false;

      if (query) {
        const matchNum = num.includes(query);
        const matchName = isBooked && booking.name.toLowerCase().includes(query);
        const matchNote = isBooked && booking.note && booking.note.toLowerCase().includes(query);
        return matchNum || matchName || matchNote;
      }
      return true;
    });
  }, [bookings, filter, search]);

  const lineMessageText = useMemo(() => {
    const availKeys = ALL_NUMBERS.filter((n) => !bookings[n]);
    const lines: string[] = [];

    lines.push(`🎰 ${MAIN_HEADER_TITLE}`);
    lines.push(`📌 ${boardTitle}`);
    lines.push(`📣 ${PROMO_LINE_1}`);
    lines.push(`💵 ${PROMO_LINE_2}`);
    lines.push(`${PROMO_LINE_3}`);
    lines.push(`━━━━━━━━━━━━━━`);
    lines.push(`🔵 โอนแล้ว: ${paidCount} | 🟡 รอโอน: ${pendingCount} | ⬜ ว่าง: ${availKeys.length}`);
    lines.push(`━━━━━━━━━━━━━━`);

    if (lineTextMode === 'grid') {
      lines.push(`📌 ตารางตัวเลข 00-99:`);
      lines.push(`(🔵=โอนแล้ว / 🟡=รอโอน / เลข=ว่าง)`);

      for (let row = 0; row < 10; row++) {
        const rowItems: string[] = [];
        for (let col = 0; col < 10; col++) {
          const num = String(row * 10 + col).padStart(2, '0');
          const b = bookings[num];
          if (b) {
            rowItems.push(b.status === 'paid' ? `🔵` : `🟡`);
          } else {
            rowItems.push(num);
          }
        }
        lines.push(rowItems.join(' '));
      }

      if (bookedKeys.length > 0) {
        lines.push(`━━━━━━━━━━━━━━`);
        lines.push(`📝 รายชื่อผู้จอง (${bookedKeys.length} เลข):`);
        bookedKeys.forEach((num) => {
          const b = bookings[num];
          const statusLabel = b.status === 'paid' ? 'โอนแล้ว' : 'รอโอน';
          const statusIcon = b.status === 'paid' ? '🔵' : '🟡';
          const extraNote = b.note ? ` · ${b.note}` : '';
          lines.push(`${statusIcon} ${num} = ${b.name} (${statusLabel}${extraNote})`);
        });
      }
    } else {
      if (bookedKeys.length === 0) {
        lines.push(`ยังไม่มีผู้จองหมายเลข (ว่างครบ 00-99)`);
      } else {
        lines.push(`📝 รายการเลขที่จองแล้ว (${bookedKeys.length} เลข):`);
        bookedKeys.forEach((num) => {
          const b = bookings[num];
          const statusLabel = b.status === 'paid' ? 'โอนแล้ว' : 'รอโอน';
          const statusIcon = b.status === 'paid' ? '🔵' : '🟡';
          const extraNote = b.note ? ` · ${b.note}` : '';
          lines.push(`${statusIcon} ${num} : ${b.name} (${statusLabel}${extraNote})`);
        });
      }
      lines.push(`━━━━━━━━━━━━━━`);
      lines.push(`⬜ เลขที่ยังว่าง (${availKeys.length} เลข):`);
      lines.push(availKeys.join(', '));
    }

    lines.push(`━━━━━━━━━━━━━━`);
    lines.push(`⚠️ ${NOTE_LINE_1}`);
    lines.push(`${NOTE_LINE_2}`);

    return lines.join('\n');
  }, [bookings, boardTitle, bookedKeys, paidCount, pendingCount, lineTextMode]);

  // --- Handlers ---
  const handleLogoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result;
      if (typeof result === 'string') {
        setCustomLogoDataUrl(result);
        showToast('อัปเดตรูปโลโก้เรียบร้อยแล้ว!');
      }
    };
    reader.readAsDataURL(file);
  };

  const openBookingModal = (num: string) => {
    const existing = bookings[num];
    setSelectedNumber(num);
    setBookerNameInput(existing?.name || '');
    setBookerNoteInput(existing?.note || '');
    setBookerStatusInput(existing ? existing.status : 'pending');
    setNameFilterQuery('');
  };

  const closeBookingModal = () => {
    setSelectedNumber(null);
    setBookerNameInput('');
    setBookerNoteInput('');
    setBookerStatusInput('pending');
    setNameFilterQuery('');
  };

  const handleSelectPresetName = (name: string) => {
    setBookerNameInput(name);
  };

  const handleSaveBooking = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedNumber) return;
    const trimmedName = bookerNameInput.trim();
    const trimmedNote = bookerNoteInput.trim();

    if (!trimmedName) {
      showToast('กรุณาเลือกหรือพิมพ์ชื่อผู้จอง', true);
      return;
    }

    setBookings((prev) => ({
      ...prev,
      [selectedNumber]: {
        name: trimmedName,
        note: trimmedNote,
        status: bookerStatusInput,
        updatedAt: Date.now(),
      },
    }));

    const statusText = bookerStatusInput === 'paid' ? 'โอนแล้ว (สีฟ้า)' : 'รอโอน (สีเหลือง)';
    showToast(`บันทึกเลข ${selectedNumber} · ${trimmedName} [${statusText}]`);
    closeBookingModal();
  };

  const handleToggleStatusInList = (num: string) => {
    const existing = bookings[num];
    if (!existing) return;
    const nextStatus: PaymentStatus = existing.status === 'paid' ? 'pending' : 'paid';
    setBookings((prev) => ({
      ...prev,
      [num]: {
        ...existing,
        status: nextStatus,
        updatedAt: Date.now(),
      },
    }));
    showToast(
      `อัปเดตเลข ${num} (${existing.name}) เป็น ${
        nextStatus === 'paid' ? 'โอนแล้ว (สีฟ้า)' : 'รอโอน (สีเหลือง)'
      }`
    );
  };

  const handleMarkAllPersonPaid = (personName: string) => {
    let updatedCount = 0;
    setBookings((prev) => {
      const next = { ...prev };
      Object.keys(next).forEach((num) => {
        if (next[num]?.name === personName && next[num]?.status !== 'paid') {
          next[num] = {
            ...next[num],
            status: 'paid',
            updatedAt: Date.now(),
          };
          updatedCount += 1;
        }
      });
      return next;
    });
    if (updatedCount > 0) {
      showToast(`อัปเดตยอดโอนของ "${personName}" ครบทั้ง ${updatedCount} เลข เป็น โอนแล้ว (สีฟ้า)!`);
    }
  };

  const handleCancelBooking = () => {
    if (!selectedNumber || !bookings[selectedNumber]) return;
    const oldName = bookings[selectedNumber].name;
    setBookings((prev) => {
      const next = { ...prev };
      delete next[selectedNumber];
      return next;
    });
    showToast(`ยกเลิกจองเลข ${selectedNumber} (${oldName}) แล้ว`);
    closeBookingModal();
  };

  const openLineShareModal = (defaultTab: 'image' | 'text' | 'infographic' = 'image') => {
    setLineModalTab(defaultTab);
    setIsLineModalOpen(true);
  };

  const copyTextToClipboard = async (text: string, notify = true) => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
        if (notify) showToast('คัดลอกตารางตัวเลขแล้ว! กดวางในแชท LINE ได้เลย');
        return;
      }
    } catch {
      // Fallback below
    }

    const helper = clipboardHelperRef.current;
    if (helper) {
      helper.value = text;
      helper.select();
      helper.setSelectionRange(0, 99999);
      try {
        document.execCommand('copy');
        if (notify) showToast('คัดลอกตารางตัวเลขแล้ว! กดวางในแชท LINE ได้เลย');
      } catch {
        if (notify) showToast('ไม่สามารถคัดลอกได้ กรุณากดค้างที่กล่องข้อความ', true);
      }
    }
  };

  const downloadCanvasImage = () => {
    const canvas = exportCanvasRef.current || desktopCanvasRef.current;
    if (!canvas) return;
    drawCanvasBoard(canvas);
    const link = document.createElement('a');
    link.download = `หวยพลัส-สลากการกุศล-นนส-ขส-2131.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    showToast('บันทึกรูปแผง 00-99 ลงเครื่องแล้ว ส่งเข้า LINE ได้เลย!');
  };

  const handleShareImageNative = () => {
    const canvas = exportCanvasRef.current || desktopCanvasRef.current;
    if (!canvas) return;
    drawCanvasBoard(canvas);
    canvas.toBlob(async (blob) => {
      if (!blob) return;
      const file = new File([blob], `huayplus-2131-00-99.png`, { type: 'image/png' });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({
            title: MAIN_HEADER_TITLE,
            text: `${MAIN_HEADER_TITLE} (${boardTitle})`,
            files: [file],
          });
          showToast('เปิดเมนูแชร์รูปเข้า LINE สำเร็จ!');
          return;
        } catch (err: unknown) {
          if (err instanceof Error && err.name !== 'AbortError') {
            downloadCanvasImage();
          }
        }
      } else {
        downloadCanvasImage();
      }
    }, 'image/png');
  };

  const handleOpenTitleModal = () => {
    setTitleInput(boardTitle);
    setIsTitleModalOpen(true);
  };

  const handleSaveTitle = () => {
    const trimmed = titleInput.trim();
    if (trimmed) {
      setBoardTitle(trimmed);
      showToast('เปลี่ยนชื่อรุ่น/งวดเรียบร้อย');
    }
    setIsTitleModalOpen(false);
  };

  const handleRequestClearAll = () => {
    if (bookedCount === 0) {
      showToast('กระดานว่างอยู่แล้ว', true);
      return;
    }
    setIsConfirmClearOpen(true);
  };

  const handleConfirmClearAll = () => {
    setBookings({});
    setIsConfirmClearOpen(false);
    showToast('ล้างกระดาน 00-99 เริ่มงวดใหม่เรียบร้อย');
  };

  const currentBooking = selectedNumber ? bookings[selectedNumber] : undefined;

  return (
    <div className="min-h-screen flex flex-col text-slate-800 pb-28">
      {/* Hidden SVG Definition for Reusable High-Res "หวยพลัส+" Logo */}
      <svg
        ref={masterSvgRef}
        id="huayplus-master-svg"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 500 500"
        className="hidden"
      >
        <defs>
          <linearGradient id="goldFrame" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fffbeb" />
            <stop offset="20%" stopColor="#fde047" />
            <stop offset="45%" stopColor="#eab308" />
            <stop offset="70%" stopColor="#ca8a04" />
            <stop offset="90%" stopColor="#fef08a" />
            <stop offset="100%" stopColor="#854d0e" />
          </linearGradient>
          <radialGradient id="navyBg" cx="50%" cy="45%" r="60%">
            <stop offset="0%" stopColor="#1e3a8a" />
            <stop offset="55%" stopColor="#07193f" />
            <stop offset="100%" stopColor="#020817" />
          </radialGradient>
          <linearGradient id="goldText" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="18%" stopColor="#fef08a" />
            <stop offset="50%" stopColor="#facc15" />
            <stop offset="85%" stopColor="#ca8a04" />
            <stop offset="100%" stopColor="#fde047" />
          </linearGradient>
          <linearGradient id="whiteText" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="65%" stopColor="#f1f5f9" />
            <stop offset="100%" stopColor="#cbd5e1" />
          </linearGradient>
          <linearGradient id="redPlus" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ff4d4d" />
            <stop offset="50%" stopColor="#dc2626" />
            <stop offset="100%" stopColor="#991b1b" />
          </linearGradient>
          <radialGradient id="ballRed" cx="35%" cy="30%" r="65%">
            <stop offset="0%" stopColor="#ff8080" />
            <stop offset="45%" stopColor="#dc2626" />
            <stop offset="100%" stopColor="#7f1d1d" />
          </radialGradient>
          <radialGradient id="ballBlue" cx="35%" cy="30%" r="65%">
            <stop offset="0%" stopColor="#93c5fd" />
            <stop offset="45%" stopColor="#2563eb" />
            <stop offset="100%" stopColor="#1e3a8a" />
          </radialGradient>
          <radialGradient id="ballYellow" cx="35%" cy="30%" r="65%">
            <stop offset="0%" stopColor="#fef9c3" />
            <stop offset="45%" stopColor="#eab308" />
            <stop offset="100%" stopColor="#713f12" />
          </radialGradient>
          <radialGradient id="ballGreen" cx="35%" cy="30%" r="65%">
            <stop offset="0%" stopColor="#86efac" />
            <stop offset="45%" stopColor="#16a34a" />
            <stop offset="100%" stopColor="#14532d" />
          </radialGradient>
          <filter id="dropShadow3D" x="-15%" y="-15%" width="130%" height="130%">
            <feDropShadow dx="0" dy="8" stdDeviation="6" floodColor="#000000" floodOpacity="0.65" />
          </filter>
        </defs>

        {/* Outer Gold Rounded Square Frame */}
        <rect x="12" y="12" width="476" height="476" rx="95" fill="url(#goldFrame)" stroke="#713f12" strokeWidth="6" />
        <rect x="34" y="34" width="432" height="432" rx="76" fill="url(#navyBg)" stroke="#fef08a" strokeWidth="3" />

        {/* Halftone / Glowing Arcs */}
        <path
          d="M 55 215 Q 95 65 265 65"
          fill="none"
          stroke="url(#goldFrame)"
          strokeWidth="14"
          strokeLinecap="round"
          opacity="0.9"
        />
        <path
          d="M 190 420 Q 350 430 445 295"
          fill="none"
          stroke="url(#goldFrame)"
          strokeWidth="12"
          strokeLinecap="round"
          opacity="0.85"
        />

        {/* Left Lottery Ticket (80) */}
        <g transform="translate(15, 225) rotate(-28)" filter="url(#dropShadow3D)">
          <rect x="0" y="0" width="90" height="125" rx="6" fill="#ffffff" stroke="#cbd5e1" strokeWidth="2" />
          <rect x="6" y="8" width="78" height="22" fill="#facc15" rx="3" />
          <text x="45" y="68" fontFamily="Kanit, sans-serif" fontWeight="900" fontSize="38" fill="#dc2626" textAnchor="middle">
            80
          </text>
          <text x="45" y="90" fontFamily="monospace" fontWeight="700" fontSize="14" fill="#0f172a" textAnchor="middle">
            123456
          </text>
          <rect x="14" y="98" width="62" height="16" fill="#334155" />
        </g>

        {/* Right Lottery Ticket (24) */}
        <g transform="translate(410, 320) rotate(32)" filter="url(#dropShadow3D)">
          <rect x="0" y="0" width="90" height="125" rx="6" fill="#ffffff" stroke="#cbd5e1" strokeWidth="2" />
          <rect x="6" y="8" width="78" height="22" fill="#f97316" rx="3" />
          <text x="45" y="68" fontFamily="Kanit, sans-serif" fontWeight="900" fontSize="38" fill="#dc2626" textAnchor="middle">
            24
          </text>
          <text x="45" y="90" fontFamily="monospace" fontWeight="700" fontSize="14" fill="#0f172a" textAnchor="middle">
            789012
          </text>
          <rect x="14" y="98" width="62" height="16" fill="#334155" />
        </g>

        {/* Top Right Ball 8 (Red) */}
        <g transform="translate(420, 110)" filter="url(#dropShadow3D)">
          <circle cx="0" cy="0" r="50" fill="url(#ballRed)" />
          <circle cx="8" cy="-4" r="24" fill="#ffffff" />
          <text x="8" y="8" fontFamily="Kanit, sans-serif" fontWeight="900" fontSize="34" fill="#0f172a" textAnchor="middle">
            8
          </text>
        </g>

        {/* Bottom Left Ball 3 (Blue) */}
        <g transform="translate(95, 385)" filter="url(#dropShadow3D)">
          <circle cx="0" cy="0" r="52" fill="url(#ballBlue)" />
          <circle cx="4" cy="4" r="25" fill="#ffffff" />
          <text x="4" y="16" fontFamily="Kanit, sans-serif" fontWeight="900" fontSize="34" fill="#0f172a" textAnchor="middle">
            3
          </text>
        </g>

        {/* Bottom Center-Left Ball 5 (Yellow) */}
        <g transform="translate(185, 435)" filter="url(#dropShadow3D)">
          <circle cx="0" cy="0" r="46" fill="url(#ballYellow)" />
          <circle cx="2" cy="4" r="23" fill="#ffffff" />
          <text x="2" y="15" fontFamily="Kanit, sans-serif" fontWeight="900" fontSize="32" fill="#0f172a" textAnchor="middle">
            5
          </text>
        </g>

        {/* Bottom Center-Right Ball 9 (Green) */}
        <g transform="translate(345, 435)" filter="url(#dropShadow3D)">
          <circle cx="0" cy="0" r="46" fill="url(#ballGreen)" />
          <circle cx="4" cy="4" r="23" fill="#ffffff" />
          <text x="4" y="15" fontFamily="Kanit, sans-serif" fontWeight="900" fontSize="32" fill="#0f172a" textAnchor="middle">
            9
          </text>
        </g>

        {/* 3D Text "หวย" (Gold with deep 3D extrusion effect) */}
        <g transform="rotate(-5, 240, 195)" filter="url(#dropShadow3D)">
          <text
            x="235"
            y="222"
            fontFamily="Kanit, sans-serif"
            fontWeight="900"
            fontSize="155"
            fill="#78350f"
            stroke="#451a03"
            strokeWidth="18"
            strokeLinejoin="round"
            textAnchor="middle"
          >
            หวย
          </text>
          <text
            x="235"
            y="212"
            fontFamily="Kanit, sans-serif"
            fontWeight="900"
            fontSize="155"
            fill="#b45309"
            stroke="#92400e"
            strokeWidth="10"
            strokeLinejoin="round"
            textAnchor="middle"
          >
            หวย
          </text>
          <text
            x="235"
            y="204"
            fontFamily="Kanit, sans-serif"
            fontWeight="900"
            fontSize="155"
            fill="url(#goldText)"
            stroke="#fef08a"
            strokeWidth="3"
            strokeLinejoin="round"
            textAnchor="middle"
          >
            หวย
          </text>
        </g>

        {/* 3D Red Plus "+" Symbol */}
        <g transform="translate(415, 255) rotate(4)" filter="url(#dropShadow3D)">
          <path
            d="M -22 -58 L 22 -58 L 22 -22 L 58 -22 L 58 22 L 22 22 L 22 58 L -22 58 L -22 22 L -58 22 L -58 -22 L -22 -22 Z"
            fill="#78350f"
            transform="translate(0, 8)"
            stroke="#451a03"
            strokeWidth="10"
            strokeLinejoin="round"
          />
          <path
            d="M -22 -58 L 22 -58 L 22 -22 L 58 -22 L 58 22 L 22 22 L 22 58 L -22 58 L -22 22 L -58 22 L -58 -22 L -22 -22 Z"
            fill="url(#redPlus)"
            stroke="url(#goldFrame)"
            strokeWidth="8"
            strokeLinejoin="round"
          />
        </g>

        {/* 3D Text "พลัส" (White with Blue/Navy 3D extrusion) */}
        <g transform="rotate(-4, 240, 330)" filter="url(#dropShadow3D)">
          <text
            x="235"
            y="352"
            fontFamily="Kanit, sans-serif"
            fontWeight="900"
            fontSize="128"
            fill="#0f172a"
            stroke="#09152b"
            strokeWidth="18"
            strokeLinejoin="round"
            textAnchor="middle"
          >
            พลัส
          </text>
          <text
            x="235"
            y="343"
            fontFamily="Kanit, sans-serif"
            fontWeight="900"
            fontSize="128"
            fill="#1d4ed8"
            stroke="#1e3a8a"
            strokeWidth="10"
            strokeLinejoin="round"
            textAnchor="middle"
          >
            พลัส
          </text>
          <text
            x="235"
            y="335"
            fontFamily="Kanit, sans-serif"
            fontWeight="900"
            fontSize="128"
            fill="url(#whiteText)"
            stroke="#ffffff"
            strokeWidth="2"
            strokeLinejoin="round"
            textAnchor="middle"
          >
            พลัส
          </text>
        </g>
      </svg>

      {/* File Input for Optional Custom Logo Image Upload */}
      <input
        ref={logoFileInputRef}
        type="file"
        accept="image/*"
        onChange={handleLogoFileChange}
        className="hidden"
      />

      {/* Header (Updated to "หวยพลัส+ สลากการกุศล นนส.ขส. 2131") */}
      <header className="header-gradient text-white sticky top-0 z-30 shadow-lg">
        <div className="max-w-6xl mx-auto px-3.5 py-2.5 flex items-center justify-between gap-3">
          {/* Brand Logo & Title */}
          <div className="flex items-center space-x-3 min-w-0">
            <button
              type="button"
              onClick={() => logoFileInputRef.current?.click()}
              className="relative group cursor-pointer shrink-0 focus:outline-none"
              title="คลิกเพื่อเปลี่ยนรูปโลโก้ได้"
            >
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl overflow-hidden gold-border-glow bg-huay-navy flex items-center justify-center">
                {logoSrc ? (
                  <img
                    src={logoSrc}
                    alt="หวยพลัส+"
                    referrerPolicy="no-referrer"
                    className="w-12 h-12 sm:w-14 sm:h-14 object-cover"
                  />
                ) : (
                  <span className="text-amber-300 font-black text-sm">หวย+</span>
                )}
              </div>
              <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-amber-400 text-slate-900 text-[10px] flex items-center justify-center shadow border border-white">
                <i className="fa-solid fa-camera"></i>
              </span>
            </button>

            <div className="min-w-0">
              <h1 className="font-extrabold text-sm sm:text-xl tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 via-yellow-400 to-amber-300 drop-shadow truncate">
                {MAIN_HEADER_TITLE}
              </h1>
              <button
                type="button"
                onClick={handleOpenTitleModal}
                className="text-xs text-slate-100 font-semibold truncate max-w-[210px] sm:max-w-md cursor-pointer hover:text-yellow-300 transition flex items-center gap-1 text-left mt-0.5"
                title="แตะเพื่อเปลี่ยนชื่อรุ่น/ข้อความรอง"
              >
                <span className="truncate">{boardTitle}</span>
                <i className="fa-solid fa-pen text-[9px] opacity-75 shrink-0"></i>
              </button>
            </div>
          </div>

          {/* Quick Header Actions */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <PWAInstallButton />
            <button
              type="button"
              onClick={() => setMainView((prev) => (prev === 'admin' ? 'board' : 'admin'))}
              className={`px-3 sm:px-3.5 py-2 rounded-xl text-xs font-extrabold shadow-md border transition flex items-center space-x-1.5 whitespace-nowrap cursor-pointer ${
                mainView === 'admin'
                  ? 'bg-amber-400 text-slate-950 border-amber-200 ring-2 ring-amber-300/60'
                  : 'bg-amber-400/95 hover:bg-amber-300 text-slate-950 border-amber-200'
              }`}
              title="เปิดหน้า Admin ระบบบัญชีรายรับ-รายจ่าย และส่งออก Excel"
            >
              <i
                className={
                  mainView === 'admin' ? 'fa-solid fa-table-cells text-sm' : 'fa-solid fa-user-shield text-sm'
                }
              ></i>
              <span>{mainView === 'admin' ? 'กลับหน้าแผง 00-99' : 'หน้า Admin'}</span>
            </button>
            <button
              type="button"
              onClick={() => openLineShareModal('image')}
              className="bg-line hover:bg-line-dark active:scale-95 text-white px-3 sm:px-3.5 py-2 rounded-xl text-xs font-bold shadow-md border border-green-300/30 transition flex items-center space-x-1.5 whitespace-nowrap cursor-pointer"
            >
              <i className="fa-brands fa-line text-base"></i>
              <span className="hidden sm:inline">ส่งแผงเข้า LINE</span>
            </button>
            <button
              type="button"
              onClick={() => setIsListModalOpen(true)}
              className="bg-white/15 hover:bg-white/25 active:scale-95 text-white px-3 py-2 rounded-xl text-xs font-medium backdrop-blur-xs border border-white/20 transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
              title="ดูรายชื่อผู้จอง"
            >
              <i className="fa-solid fa-list-check text-sm"></i>
              <span className="hidden md:inline">รายชื่อ ({bookedCount})</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl w-full mx-auto px-3 sm:px-4 pt-3 flex-grow">
        {/* Top Switcher Bar: กระดานจองเลข 00-99 vs หน้า Admin + ตัวเลือกงวด (วันที่ 1 / วันที่ 16) */}
        <div className="bg-white rounded-2xl p-2.5 shadow-sm border border-slate-200/90 mb-3 flex flex-col md:flex-row md:items-center justify-between gap-2.5">
          {/* View Mode Tabs */}
          <div className="grid grid-cols-2 gap-1.5 bg-slate-100 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setMainView('board')}
              className={`py-2 px-3 rounded-lg text-xs sm:text-sm font-extrabold transition flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap ${
                mainView === 'board'
                  ? 'bg-huay-navy text-amber-300 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <i className="fa-solid fa-table-cells"></i>
              <span>กระดานจองเลข 00-99</span>
            </button>
            <button
              type="button"
              onClick={() => setMainView('admin')}
              className={`py-2 px-3 rounded-lg text-xs sm:text-sm font-extrabold transition flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap ${
                mainView === 'admin'
                  ? 'bg-huay-navy text-amber-300 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <i className="fa-solid fa-chart-line"></i>
              <span>หน้า Admin (รายรับ-รายจ่าย & Excel)</span>
            </button>
          </div>

          {/* Quick Period Switcher (1 เดือนมี 2 งวด: งวดวันที่ 1 และ งวดวันที่ 16) */}
          <div className="flex flex-wrap items-center justify-between md:justify-end gap-1.5">
            <span className="text-[11px] font-bold text-slate-500 mr-1 hidden sm:inline">
              <i className="fa-regular fa-calendar-days mr-1 text-huay-navy"></i>
              เลือกงวด (2 งวด/เดือน):
            </span>
            <div className="inline-flex bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={() =>
                  handleChangePeriod(activePeriod.yearBE, activePeriod.monthVal, '01')
                }
                className={`px-2.5 py-1 rounded-lg text-xs font-extrabold transition cursor-pointer whitespace-nowrap ${
                  activePeriod.daySlot === '01'
                    ? 'bg-amber-400 text-slate-950 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                งวดวันที่ 1
              </button>
              <button
                type="button"
                onClick={() =>
                  handleChangePeriod(activePeriod.yearBE, activePeriod.monthVal, '16')
                }
                className={`px-2.5 py-1 rounded-lg text-xs font-extrabold transition cursor-pointer whitespace-nowrap ${
                  activePeriod.daySlot === '16'
                    ? 'bg-amber-400 text-slate-950 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                งวดวันที่ 16
              </button>
            </div>

            <select
              value={activePeriod.monthVal}
              onChange={(e) =>
                handleChangePeriod(activePeriod.yearBE, e.target.value, activePeriod.daySlot)
              }
              className="px-2.5 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-xs font-bold text-slate-800 outline-none cursor-pointer"
            >
              {THAI_MONTHS.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.short}
                </option>
              ))}
            </select>

            <select
              value={activePeriod.yearBE}
              onChange={(e) =>
                handleChangePeriod(e.target.value, activePeriod.monthVal, activePeriod.daySlot)
              }
              className="px-2.5 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-xs font-bold text-slate-800 outline-none cursor-pointer"
            >
              {['2568', '2569', '2570', '2571'].map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>

            <span className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-sky-50 text-sky-800 border border-sky-200 hidden xl:inline-block">
              {formatPeriodLabel(
                activePeriod.yearBE,
                activePeriod.monthVal,
                activePeriod.daySlot
              )}
            </span>
          </div>
        </div>

        {mainView === 'admin' ? (
          <AdminDashboard
            yearBE={activePeriod.yearBE}
            monthVal={activePeriod.monthVal}
            daySlot={activePeriod.daySlot}
            onChangePeriod={handleChangePeriod}
            currentPeriodData={currentPeriodData}
            otherSlotPeriodData={otherSlotPeriodData}
            onUpdateDrawRecord={handleUpdateDrawRecord}
            onToggleBookingStatus={handleToggleStatusInList}
            onMarkAllPersonPaid={handleMarkAllPersonPaid}
            onOpenBookingModal={openBookingModal}
            onShowToast={showToast}
          />
        ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Left / Primary Column: Interactive 00-99 Booking Board */}
          <div className="lg:col-span-7 xl:col-span-8">
            {/* Promotional Banner Card (Matching Image 1 Top Box) */}
            <div className="bg-gradient-to-b from-yellow-50 to-amber-50/90 rounded-2xl p-3.5 shadow-sm border-2 border-yellow-400 text-center mb-3 space-y-1">
              <p className="text-xs sm:text-sm font-extrabold text-slate-900 leading-snug">
                {PROMO_LINE_1}
              </p>
              <p className="text-xs sm:text-sm font-extrabold text-red-600 leading-snug">
                {PROMO_LINE_2}
              </p>
              <p className="text-xs sm:text-sm font-extrabold text-green-700 leading-snug pt-0.5">
                {PROMO_LINE_3}
              </p>
            </div>

            {/* Summary Dashboard Card (4 Stats: ทั้งหมด, ว่าง, รอโอน-เหลือง, โอนแล้ว-ฟ้า) */}
            <div className="bg-white rounded-2xl p-3.5 shadow-sm border border-slate-200/80 mb-3">
              <div className="grid grid-cols-4 gap-2 text-center">
                <div className="bg-slate-50 rounded-xl p-2 border border-slate-100">
                  <p className="text-[11px] text-slate-500 font-medium whitespace-nowrap">ทั้งหมด</p>
                  <p className="text-lg sm:text-2xl font-extrabold text-slate-700 leading-tight tabular-nums">
                    100
                  </p>
                </div>
                <div className="bg-slate-50/70 rounded-xl p-2 border border-slate-200/80">
                  <p className="text-[11px] text-slate-600 font-medium whitespace-nowrap">เลขว่าง</p>
                  <p className="text-lg sm:text-2xl font-extrabold text-slate-700 leading-tight tabular-nums">
                    {availableCount}
                  </p>
                </div>
                <div className="bg-yellow-50 rounded-xl p-2 border border-yellow-300">
                  <p className="text-[11px] text-yellow-800 font-bold whitespace-nowrap">รอโอน (เหลือง)</p>
                  <p className="text-lg sm:text-2xl font-extrabold text-yellow-600 leading-tight tabular-nums">
                    {pendingCount}
                  </p>
                </div>
                <div className="bg-sky-50 rounded-xl p-2 border border-sky-200">
                  <p className="text-[11px] text-sky-800 font-bold whitespace-nowrap">โอนแล้ว (ฟ้า)</p>
                  <p className="text-lg sm:text-2xl font-extrabold text-sky-600 leading-tight tabular-nums">
                    {paidCount}
                  </p>
                </div>
              </div>

              {/* Dual-Status Progress Bar (Sky Blue for Paid + Yellow for Pending) */}
              <div className="mt-3 flex items-center gap-2.5">
                <div className="flex-grow bg-slate-100 h-3 rounded-full overflow-hidden p-0.5 flex">
                  {paidCount > 0 && (
                    <div
                      className="bg-sky-500 h-full transition-all duration-300 first:rounded-l-full last:rounded-r-full"
                      style={{ width: `${paidCount}%` }}
                      title={`โอนแล้ว: ${paidCount}%`}
                    />
                  )}
                  {pendingCount > 0 && (
                    <div
                      className="bg-yellow-400 h-full transition-all duration-300 first:rounded-l-full last:rounded-r-full"
                      style={{ width: `${pendingCount}%` }}
                      title={`รอโอน: ${pendingCount}%`}
                    />
                  )}
                </div>
                <span className="text-xs font-bold text-slate-600 shrink-0 tabular-nums">
                  จอง {bookedCount}%
                </span>
              </div>
            </div>

            {/* Search & Filter Bar */}
            <div className="bg-white rounded-2xl p-2.5 shadow-sm border border-slate-200/80 mb-2.5 space-y-2 sticky top-[68px] z-20">
              <div className="flex gap-2">
                <div className="relative flex-grow">
                  <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="ค้นหาเลข 00-99 หรือ ชื่อผู้จอง..."
                    className="w-full pl-8 pr-8 py-2 bg-slate-100 border border-transparent focus:border-sky-500 focus:bg-white rounded-xl text-xs sm:text-sm outline-none transition"
                  />
                  {search && (
                    <button
                      type="button"
                      onClick={() => setSearch('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      <i className="fa-solid fa-circle-xmark"></i>
                    </button>
                  )}
                </div>
                {/* Grid Columns Switcher */}
                <button
                  type="button"
                  onClick={() => setGridCols((prev) => (prev === 5 ? 10 : 5))}
                  className="bg-huay-navy hover:bg-huay-blue text-amber-300 px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 shrink-0 shadow-xs whitespace-nowrap cursor-pointer"
                >
                  <i className="fa-solid fa-border-all"></i>
                  <span>{gridCols === 10 ? '10x10' : '5 แถว'}</span>
                </button>
              </div>

              {/* Filter Tabs */}
              <div className="grid grid-cols-4 bg-slate-100 p-1 rounded-xl gap-1">
                <button
                  type="button"
                  onClick={() => setFilter('all')}
                  className={`py-1.5 text-xs rounded-lg transition whitespace-nowrap cursor-pointer ${
                    filter === 'all'
                      ? 'font-bold bg-white text-slate-800 shadow-xs'
                      : 'font-medium text-slate-600 hover:text-slate-800'
                  }`}
                >
                  ทั้งหมด (100)
                </button>
                <button
                  type="button"
                  onClick={() => setFilter('available')}
                  className={`py-1.5 text-xs rounded-lg transition whitespace-nowrap cursor-pointer ${
                    filter === 'available'
                      ? 'font-bold bg-white text-slate-800 shadow-xs'
                      : 'font-medium text-slate-600 hover:text-slate-800'
                  }`}
                >
                  ว่าง ({availableCount})
                </button>
                <button
                  type="button"
                  onClick={() => setFilter('pending')}
                  className={`py-1.5 text-xs rounded-lg transition whitespace-nowrap cursor-pointer ${
                    filter === 'pending'
                      ? 'font-bold bg-yellow-400 text-slate-900 shadow-xs'
                      : 'font-medium text-slate-600 hover:text-slate-800'
                  }`}
                >
                  รอโอน ({pendingCount})
                </button>
                <button
                  type="button"
                  onClick={() => setFilter('paid')}
                  className={`py-1.5 text-xs rounded-lg transition whitespace-nowrap cursor-pointer ${
                    filter === 'paid'
                      ? 'font-bold bg-sky-500 text-white shadow-xs'
                      : 'font-medium text-slate-600 hover:text-slate-800'
                  }`}
                >
                  โอนแล้ว ({paidCount})
                </button>
              </div>
            </div>

            {/* Helper Legend Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2 px-1 mb-2 text-[11px] text-slate-600">
              <div className="flex items-center space-x-3">
                <span className="flex items-center font-medium">
                  <span className="w-3.5 h-3.5 rounded bg-white border border-slate-300 inline-block mr-1 shadow-2xs"></span>
                  ว่าง
                </span>
                <span className="flex items-center font-semibold text-yellow-800">
                  <span className="w-3.5 h-3.5 rounded bg-yellow-400 border border-yellow-600 inline-block mr-1 shadow-2xs"></span>
                  จอง·รอโอน (สีเหลือง)
                </span>
                <span className="flex items-center font-semibold text-sky-800">
                  <span className="w-3.5 h-3.5 rounded bg-sky-500 border border-sky-700 inline-block mr-1 shadow-2xs"></span>
                  จอง·โอนแล้ว (สีฟ้า)
                </span>
              </div>
              <span className="text-slate-400">
                <i className="fa-regular fa-hand-pointer mr-1"></i>แตะตัวเลขเพื่อเลือกชื่อผู้จอง
              </span>
            </div>

            {/* Numbers 00-99 Grid */}
            {filteredNumbers.length > 0 ? (
              <div
                className={
                  gridCols === 10
                    ? 'grid grid-cols-10 gap-1 sm:gap-1.5 transition-all'
                    : 'grid grid-cols-5 gap-2 transition-all'
                }
              >
                {filteredNumbers.map((num) => {
                  const booking = bookings[num];
                  const isBooked = Boolean(booking);
                  const isPaid = booking?.status === 'paid';

                  if (gridCols === 10) {
                    return (
                      <button
                        key={num}
                        type="button"
                        onClick={() => openBookingModal(num)}
                        className={`number-card aspect-square rounded-lg flex flex-col items-center justify-center p-0.5 border relative overflow-hidden cursor-pointer ${
                          !isBooked
                            ? 'bg-white text-slate-800 border-slate-200 hover:border-amber-400'
                            : isPaid
                            ? 'paid-card-gradient text-white border-sky-600 shadow-xs'
                            : 'pending-card-gradient text-slate-900 border-yellow-500 shadow-xs'
                        }`}
                      >
                        <span className="font-extrabold text-xs sm:text-sm leading-none">{num}</span>
                        {isBooked && (
                          <span
                            className={`text-[8px] font-bold leading-tight truncate max-w-full px-0.5 rounded mt-0.5 ${
                              isPaid
                                ? 'bg-sky-950/35 text-white'
                                : 'bg-white/75 text-slate-900'
                            }`}
                          >
                            {booking.name}
                          </span>
                        )}
                      </button>
                    );
                  }

                  return (
                    <button
                      key={num}
                      type="button"
                      onClick={() => openBookingModal(num)}
                      className={`number-card h-16 rounded-2xl flex flex-col items-center justify-center px-1.5 py-1 border relative overflow-hidden cursor-pointer ${
                        !isBooked
                          ? 'bg-white text-slate-800 border-slate-200/90 hover:border-amber-400 shadow-2xs'
                          : isPaid
                          ? 'paid-card-gradient text-white border-sky-600 shadow-md shadow-sky-500/20'
                          : 'pending-card-gradient text-slate-900 border-yellow-500 shadow-md shadow-yellow-500/20'
                      }`}
                    >
                      <span className="font-black text-xl leading-none tracking-tight">{num}</span>
                      {isBooked ? (
                        <div
                          className={`flex items-center max-w-full mt-1 px-2 py-0.5 rounded-full ${
                            isPaid ? 'bg-sky-950/35 text-white' : 'bg-white/80 text-slate-900'
                          }`}
                        >
                          <span className="text-[10px] font-bold truncate leading-none">
                            {booking.name}
                          </span>
                        </div>
                      ) : (
                        <span className="text-[10px] text-slate-400 font-medium mt-1">ว่าง</span>
                      )}
                    </button>
                  );
                })}
              </div>
            ) : (
              /* Empty Search State */
              <div className="bg-white rounded-2xl p-8 text-center my-4 shadow-sm border border-slate-100">
                <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3 text-xl">
                  <i className="fa-solid fa-magnifying-glass"></i>
                </div>
                <p className="text-slate-600 font-semibold text-sm">ไม่พบหมายเลขหรือชื่อที่ค้นหา</p>
                <p className="text-xs text-slate-400 mt-1">ลองเปลี่ยนคำค้นหาหรือสลับตัวกรองด้านบน</p>
              </div>
            )}

            {/* Bottom Note Box (Matching Image 1 Bottom Box) */}
            <div className="mt-4 bg-huay-navy text-center rounded-2xl p-4 shadow-md border-2 border-amber-400/70 space-y-1">
              <p className="text-xs sm:text-sm font-bold text-yellow-300">
                {NOTE_LINE_1}
              </p>
              <p className="text-xs sm:text-sm font-medium text-slate-100">
                {NOTE_LINE_2}
              </p>
            </div>
          </div>

          {/* Right Column (Desktop Live Board Preview & Quick Summary) */}
          <aside className="hidden lg:block lg:col-span-5 xl:col-span-4 sticky top-[80px] space-y-4">
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200/80">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h2 className="font-bold text-sm text-slate-800">ภาพแผง 00-99 พร้อมส่ง LINE</h2>
                  <p className="text-[11px] text-slate-500">สีเหลือง = รอโอน · สีฟ้า = โอนแล้ว</p>
                </div>
                <button
                  type="button"
                  onClick={downloadCanvasImage}
                  className="bg-huay-navy hover:bg-huay-blue text-amber-300 px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                >
                  <i className="fa-solid fa-download"></i>
                  <span>บันทึกรูป</span>
                </button>
              </div>

              <div className="bg-slate-100 rounded-xl p-2 border border-slate-200">
                <canvas
                  ref={desktopCanvasRef}
                  width={1080}
                  height={1580}
                  onClick={() => openLineShareModal('image')}
                  className="w-full h-auto rounded-lg shadow-sm cursor-pointer bg-huay-navy"
                  title="คลิกเพื่อขยายหรือแชร์เข้า LINE"
                />
              </div>

              <div className="grid grid-cols-2 gap-2 mt-3">
                <button
                  type="button"
                  onClick={handleShareImageNative}
                  className="bg-line hover:bg-line-dark text-white font-bold py-2.5 px-3 rounded-xl text-xs transition flex items-center justify-center gap-1.5 shadow-sm cursor-pointer whitespace-nowrap"
                >
                  <i className="fa-brands fa-line text-base"></i>
                  <span>แชร์รูปเข้า LINE</span>
                </button>
                <button
                  type="button"
                  onClick={() => copyTextToClipboard(lineMessageText, true)}
                  className="bg-slate-800 hover:bg-slate-900 text-white font-bold py-2.5 px-3 rounded-xl text-xs transition flex items-center justify-center gap-1.5 shadow-sm cursor-pointer whitespace-nowrap"
                >
                  <i className="fa-regular fa-copy"></i>
                  <span>คัดลอกตารางข้อความ</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => openLineShareModal('infographic')}
                className="w-full mt-2 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-300 hover:brightness-105 text-slate-950 font-extrabold py-2.5 px-3 rounded-xl text-xs transition flex items-center justify-center gap-1.5 shadow-sm border border-amber-500 cursor-pointer whitespace-nowrap"
              >
                <i className="fa-solid fa-bullhorn text-sm"></i>
                <span>สร้าง Infographic โปรโมทขายหวยพลัส+</span>
              </button>
            </div>
          </aside>
        </div>
        )}
      </main>

      {/* Bottom Sticky Action Bar for LINE */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-200 z-30 px-2.5 py-2.5 shadow-2xl">
        <div className="max-w-xl mx-auto flex items-center gap-1.5 sm:gap-2">
          {/* Generate & Share Full Visual 00-99 Board Image to LINE */}
          <button
            type="button"
            onClick={() => openLineShareModal('image')}
            className="flex-1 bg-gradient-to-r from-huay-navy to-huay-blue hover:opacity-95 active:scale-[0.98] text-amber-300 font-bold py-2.5 px-2.5 rounded-xl shadow-md border border-amber-400/40 transition flex items-center justify-center space-x-1.5 text-xs sm:text-sm whitespace-nowrap cursor-pointer"
          >
            <i className="fa-solid fa-image text-sm sm:text-base"></i>
            <span>รูปแผง 00-99</span>
          </button>

          {/* Open Promotional Infographic Poster */}
          <button
            type="button"
            onClick={() => openLineShareModal('infographic')}
            className="flex-1 bg-gradient-to-r from-amber-400 to-yellow-300 hover:brightness-105 active:scale-[0.98] text-slate-950 font-extrabold py-2.5 px-2.5 rounded-xl shadow-md border border-amber-500 transition flex items-center justify-center space-x-1.5 text-xs sm:text-sm whitespace-nowrap cursor-pointer"
          >
            <i className="fa-solid fa-bullhorn text-sm sm:text-base"></i>
            <span>Infographic ขาย</span>
          </button>

          {/* Send Text Number Grid directly to LINE Chat */}
          <button
            type="button"
            onClick={() => openLineShareModal('text')}
            className="flex-1 bg-line hover:bg-line-dark active:scale-[0.98] text-white font-bold py-2.5 px-2.5 rounded-xl shadow-md shadow-line/30 transition flex items-center justify-center space-x-1.5 text-xs sm:text-sm whitespace-nowrap cursor-pointer"
          >
            <i className="fa-brands fa-line text-base sm:text-lg"></i>
            <span>ข้อความ LINE</span>
          </button>

          {/* Clear Board Button */}
          <button
            type="button"
            onClick={handleRequestClearAll}
            className="bg-red-50 hover:bg-red-100 active:scale-95 text-red-600 font-medium py-2.5 px-3 rounded-xl border border-red-200 transition flex items-center justify-center text-sm shrink-0 cursor-pointer"
            title="ล้างกระดานเริ่มงวดใหม่"
          >
            <i className="fa-regular fa-trash-can"></i>
          </button>
        </div>
      </div>

      {/* MODAL 1: Book / Edit Number (with Yellow/Blue Status Toggle & Preset Booker Names) */}
      {selectedNumber !== null && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) closeBookingModal();
          }}
          className="fixed inset-0 bg-slate-900/65 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4"
        >
          <div className="bg-white rounded-3xl max-w-md w-full max-h-[92vh] flex flex-col p-4 sm:p-5 shadow-2xl border-t-4 border-amber-400 animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex justify-between items-start mb-3 shrink-0">
              <div className="flex items-center space-x-3">
                <div
                  className={
                    bookerStatusInput === 'paid'
                      ? 'w-14 h-14 sm:w-16 sm:h-16 rounded-2xl paid-card-gradient text-white flex items-center justify-center text-2xl sm:text-3xl font-black shadow-md tabular-nums border-2 border-sky-300'
                      : 'w-14 h-14 sm:w-16 sm:h-16 rounded-2xl pending-card-gradient text-slate-900 flex items-center justify-center text-2xl sm:text-3xl font-black shadow-md tabular-nums border-2 border-yellow-500'
                  }
                >
                  {selectedNumber}
                </div>
                <div>
                  <div className="flex items-center space-x-1.5 text-xs font-bold mb-0.5">
                    {currentBooking ? (
                      <span
                        className={
                          bookerStatusInput === 'paid' ? 'text-sky-600' : 'text-yellow-700'
                        }
                      >
                        สถานะ: {bookerStatusInput === 'paid' ? 'จองแล้ว · โอนแล้ว (สีฟ้า)' : 'จองแล้ว · รอโอน (สีเหลือง)'}
                      </span>
                    ) : (
                      <span className="text-slate-500">เลือกชื่อผู้จองและสถานะการโอน</span>
                    )}
                  </div>
                  <h3 className="text-base font-bold text-slate-800">บันทึกชื่อผู้จองหมายเลข {selectedNumber}</h3>
                </div>
              </div>
              <button
                type="button"
                onClick={closeBookingModal}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition cursor-pointer shrink-0"
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <form onSubmit={handleSaveBooking} className="flex flex-col flex-grow overflow-hidden space-y-3">
              {/* 1. Payment Status Selector (Yellow = รอโอน, Blue = โอนแล้ว) */}
              <div className="shrink-0">
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  1. เลือกสถานะช่องตัวเลข (เปลี่ยนสีอัตโนมัติ)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setBookerStatusInput('pending')}
                    className={`py-2.5 px-3 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 border-2 transition cursor-pointer ${
                      bookerStatusInput === 'pending'
                        ? 'pending-card-gradient text-slate-900 border-yellow-600 shadow-sm ring-2 ring-yellow-300'
                        : 'bg-yellow-50/70 text-yellow-800 border-yellow-200 hover:bg-yellow-100'
                    }`}
                  >
                    <span className="w-3.5 h-3.5 rounded-full bg-yellow-400 border border-slate-900 shrink-0"></span>
                    <span>รอโอน (สีเหลือง)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setBookerStatusInput('paid')}
                    className={`py-2.5 px-3 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 border-2 transition cursor-pointer ${
                      bookerStatusInput === 'paid'
                        ? 'paid-card-gradient text-white border-sky-700 shadow-sm ring-2 ring-sky-300'
                        : 'bg-sky-50/70 text-sky-800 border-sky-200 hover:bg-sky-100'
                    }`}
                  >
                    <span className="w-3.5 h-3.5 rounded-full bg-sky-400 border border-white shrink-0"></span>
                    <span>โอนแล้ว (สีฟ้า)</span>
                  </button>
                </div>
              </div>

              {/* 2. Booker Name Input */}
              <div className="shrink-0">
                <label htmlFor="input-booker-name" className="block text-xs font-bold text-slate-700 mb-1">
                  2. ชื่อผู้จอง (คลิกเลือกจากรายชื่อด้านล่าง หรือพิมพ์เอง) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <i className="fa-solid fa-user-check absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"></i>
                  <input
                    ref={bookerNameInputRef}
                    type="text"
                    id="input-booker-name"
                    required
                    maxLength={40}
                    value={bookerNameInput}
                    onChange={(e) => {
                      setBookerNameInput(e.target.value);
                      setNameFilterQuery(e.target.value);
                    }}
                    placeholder="เลือกชื่อด้านล่าง หรือพิมพ์ชื่อผู้จอง..."
                    className="w-full pl-10 pr-9 py-2.5 bg-slate-50 border-2 border-slate-200 focus:border-sky-500 focus:bg-white rounded-xl text-sm sm:text-base font-bold text-slate-800 outline-none transition"
                  />
                  {bookerNameInput && (
                    <button
                      type="button"
                      onClick={() => {
                        setBookerNameInput('');
                        setNameFilterQuery('');
                        bookerNameInputRef.current?.focus();
                      }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                      title="ล้างชื่อ"
                    >
                      <i className="fa-solid fa-circle-xmark"></i>
                    </button>
                  )}
                </div>
              </div>

              {/* 3. Scrollable List of Attached Names */}
              <div className="flex flex-col flex-grow min-h-[160px] max-h-[240px] bg-slate-50 rounded-2xl border border-slate-200 p-2 overflow-hidden">
                <div className="flex items-center justify-between px-1 pb-1.5 mb-1 border-b border-slate-200/80 shrink-0">
                  <span className="text-[11px] font-bold text-slate-600">
                    <i className="fa-solid fa-users mr-1 text-sky-600"></i>
                    รายชื่อผู้จอง ({filteredPresetNames.length} ท่าน) — แตะชื่อเพื่อเลือกทันที
                  </span>
                  {nameFilterQuery && (
                    <button
                      type="button"
                      onClick={() => setNameFilterQuery('')}
                      className="text-[11px] text-sky-600 font-semibold hover:underline cursor-pointer"
                    >
                      แสดงทั้งหมด
                    </button>
                  )}
                </div>

                <div className="overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-1.5 pr-1">
                  {filteredPresetNames.length > 0 ? (
                    filteredPresetNames.map((name, index) => {
                      const isSelected = bookerNameInput.trim() === name;
                      const count = bookerNumberCounts[name] || 0;
                      return (
                        <button
                          key={name}
                          type="button"
                          onClick={() => handleSelectPresetName(name)}
                          className={`text-left px-2.5 py-2 rounded-xl text-xs font-semibold transition flex items-center justify-between gap-1.5 border cursor-pointer ${
                            isSelected
                              ? 'bg-huay-navy text-amber-300 border-amber-400 shadow-xs'
                              : 'bg-white hover:bg-amber-50/70 text-slate-700 border-slate-200/80'
                          }`}
                        >
                          <span className="truncate">
                            <span className="opacity-60 mr-1 tabular-nums">{index + 1}.</span>
                            {name}
                          </span>
                          {count > 0 && (
                            <span
                              className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md shrink-0 tabular-nums ${
                                isSelected
                                  ? 'bg-amber-400 text-slate-900'
                                  : 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              {count} เลข
                            </span>
                          )}
                        </button>
                      );
                    })
                  ) : (
                    <div className="col-span-2 py-6 text-center text-xs text-slate-400">
                      ไม่พบในรายชื่อตั้งต้น (สามารถกดบันทึกชื่อ "{bookerNameInput}" ได้เลย)
                    </div>
                  )}
                </div>
              </div>

              {/* 4. Optional Note Input */}
              <div className="shrink-0">
                <label htmlFor="input-booker-note" className="block text-xs font-semibold text-slate-600 mb-1">
                  หมายเหตุเพิ่มเติม (ถ้ามี)
                </label>
                <div className="relative">
                  <i className="fa-regular fa-comment-dots absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"></i>
                  <input
                    type="text"
                    id="input-booker-note"
                    maxLength={40}
                    value={bookerNoteInput}
                    onChange={(e) => setBookerNoteInput(e.target.value)}
                    placeholder="เช่น จ่ายสด, งวดนี้, เบอร์โทร..."
                    className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 focus:border-sky-500 focus:bg-white rounded-xl text-xs sm:text-sm text-slate-700 outline-none transition"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-1 shrink-0">
                {currentBooking && (
                  <button
                    type="button"
                    onClick={handleCancelBooking}
                    className="bg-red-50 hover:bg-red-100 text-red-600 font-bold py-3 px-3.5 rounded-xl border border-red-200 transition text-xs sm:text-sm cursor-pointer whitespace-nowrap"
                  >
                    <i className="fa-regular fa-trash-can mr-1"></i> ยกเลิกเลขนี้
                  </button>
                )}
                <button
                  type="submit"
                  className={`flex-1 font-bold py-3 px-4 rounded-xl shadow-md transition text-xs sm:text-sm cursor-pointer whitespace-nowrap ${
                    bookerStatusInput === 'paid'
                      ? 'paid-card-gradient text-white shadow-sky-500/25'
                      : 'pending-card-gradient text-slate-900 shadow-yellow-500/25 border border-yellow-500'
                  }`}
                >
                  <i className="fa-solid fa-check mr-1.5"></i>
                  บันทึก ({bookerStatusInput === 'paid' ? 'โอนแล้ว · สีฟ้า' : 'รอโอน · สีเหลือง'})
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Send Numbers / Visual Board to LINE Application */}
      {isLineModalOpen && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsLineModalOpen(false);
          }}
          className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
        >
          <div className="bg-white rounded-t-3xl sm:rounded-3xl max-w-lg w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="header-gradient text-white p-4 flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                {logoSrc && (
                  <img
                    src={logoSrc}
                    alt="หวยพลัส+"
                    referrerPolicy="no-referrer"
                    className="w-9 h-9 rounded-xl border border-amber-300 object-cover"
                  />
                )}
                <div>
                  <h3 className="font-bold text-base text-amber-300 leading-tight">
                    {MAIN_HEADER_TITLE}
                  </h3>
                  <p className="text-[11px] text-slate-200">
                    สีเหลือง = รอโอน · สีฟ้า = โอนแล้ว · สีขาว = ว่าง
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsLineModalOpen(false)}
                className="w-8 h-8 rounded-full bg-white/15 text-white flex items-center justify-center cursor-pointer"
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            {/* Tabs: Visual Board Image vs Infographic Poster vs Text Grid for LINE */}
            <div className="grid grid-cols-3 border-b border-slate-200 bg-slate-50 p-1.5 gap-1">
              <button
                type="button"
                onClick={() => setLineModalTab('image')}
                className={`py-2 px-2 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1 whitespace-nowrap cursor-pointer ${
                  lineModalTab === 'image'
                    ? 'bg-huay-navy text-amber-300 shadow-xs'
                    : 'text-slate-600 hover:bg-white'
                }`}
              >
                <i className="fa-solid fa-table-cells"></i>
                <span>1. รูปแผง 00-99</span>
              </button>
              <button
                type="button"
                onClick={() => setLineModalTab('infographic')}
                className={`py-2 px-2 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1 whitespace-nowrap cursor-pointer ${
                  lineModalTab === 'infographic'
                    ? 'bg-amber-400 text-slate-950 shadow-xs'
                    : 'text-slate-600 hover:bg-white'
                }`}
              >
                <i className="fa-solid fa-bullhorn"></i>
                <span>2. Infographic ขาย</span>
              </button>
              <button
                type="button"
                onClick={() => setLineModalTab('text')}
                className={`py-2 px-2 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1 whitespace-nowrap cursor-pointer ${
                  lineModalTab === 'text'
                    ? 'bg-line text-white shadow-xs'
                    : 'text-slate-600 hover:bg-white'
                }`}
              >
                <i className="fa-brands fa-line text-sm"></i>
                <span>3. ข้อความ LINE</span>
              </button>
            </div>

            {/* TAB 1 CONTENT: Visual Board Canvas Preview */}
            {lineModalTab === 'image' && (
              <div className="p-4 overflow-y-auto space-y-3 flex-grow">
                <div className="bg-slate-100 rounded-2xl p-2 border border-slate-200 text-center">
                  <p className="text-[11px] text-slate-500 mb-2">
                    ตัวอย่างรูปภาพแผง 00-99 พร้อมข้อความประชาสัมพันธ์และหมายเหตุครบถ้วน
                  </p>
                  <canvas
                    ref={exportCanvasRef}
                    width={1080}
                    height={1580}
                    className="w-full h-auto rounded-xl shadow-md mx-auto max-h-[48vh] object-contain bg-huay-navy"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleShareImageNative}
                    className="bg-line hover:bg-line-dark text-white font-bold py-3 px-4 rounded-xl shadow-md transition flex items-center justify-center space-x-2 text-sm cursor-pointer whitespace-nowrap"
                  >
                    <i className="fa-brands fa-line text-lg"></i>
                    <span>แชร์รูปแผงเข้าแชท LINE ทันที</span>
                  </button>
                  <button
                    type="button"
                    onClick={downloadCanvasImage}
                    className="bg-huay-navy hover:bg-huay-blue text-amber-300 font-bold py-3 px-4 rounded-xl shadow-md transition flex items-center justify-center space-x-2 text-sm cursor-pointer whitespace-nowrap"
                  >
                    <i className="fa-solid fa-download"></i>
                    <span>บันทึกรูปแผงลงมือถือ</span>
                  </button>
                </div>
              </div>
            )}

            {/* TAB 2 CONTENT: Promotional Infographic Poster */}
            {lineModalTab === 'infographic' && (
              <div className="p-4 overflow-y-auto flex-grow">
                <SalesInfographic
                  bookings={bookings}
                  boardTitle={boardTitle}
                  logoImg={logoImgObjRef.current}
                  logoSrc={logoSrc}
                  onShowToast={showToast}
                />
              </div>
            )}

            {/* TAB 3 CONTENT: Text Grid & Direct LINE Share */}
            {lineModalTab === 'text' && (
              <div className="p-4 overflow-y-auto space-y-3 flex-grow">
                <div className="flex gap-1.5 bg-slate-100 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setLineTextMode('grid')}
                    className={`flex-1 py-1.5 rounded-lg text-xs transition whitespace-nowrap cursor-pointer ${
                      lineTextMode === 'grid'
                        ? 'font-bold bg-white text-slate-800 shadow-2xs'
                        : 'font-medium text-slate-600'
                    }`}
                  >
                    แสดงตารางเลข 00-99 ครบทุกตัว
                  </button>
                  <button
                    type="button"
                    onClick={() => setLineTextMode('list')}
                    className={`flex-1 py-1.5 rounded-lg text-xs transition whitespace-nowrap cursor-pointer ${
                      lineTextMode === 'list'
                        ? 'font-bold bg-white text-slate-800 shadow-2xs'
                        : 'font-medium text-slate-600'
                    }`}
                  >
                    แสดงเฉพาะเลขที่จอง + ชื่อ
                  </button>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">
                    ตัวอย่างข้อความที่จะแสดงบนห้องแชท LINE:
                  </label>
                  <textarea
                    readOnly
                    rows={9}
                    value={lineMessageText}
                    className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 font-mono text-xs text-slate-700 outline-none resize-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <a
                    href={`https://line.me/R/msg/text/?${encodeURIComponent(lineMessageText)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => {
                      copyTextToClipboard(lineMessageText, false);
                      showToast('กำลังเปิดแอป LINE เพื่อส่งตารางตัวเลข...');
                    }}
                    className="bg-line hover:bg-line-dark text-white font-bold py-3 px-4 rounded-xl shadow-md transition flex items-center justify-center space-x-2 text-sm whitespace-nowrap"
                  >
                    <i className="fa-brands fa-line text-lg"></i>
                    <span>เปิดแอป LINE ส่งเข้าแชททันที</span>
                  </a>
                  <button
                    type="button"
                    onClick={() => copyTextToClipboard(lineMessageText, true)}
                    className="bg-slate-800 hover:bg-slate-900 text-white font-bold py-3 px-4 rounded-xl shadow-md transition flex items-center justify-center space-x-2 text-sm cursor-pointer whitespace-nowrap"
                  >
                    <i className="fa-regular fa-copy"></i>
                    <span>คัดลอกข้อความไปวางใน LINE</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL 3: Booked List Modal */}
      {isListModalOpen && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsListModalOpen(false);
          }}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
        >
          <div className="bg-white rounded-t-3xl sm:rounded-3xl max-w-md w-full max-h-[85vh] flex flex-col shadow-2xl">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <div className="flex items-center space-x-2">
                  <i className="fa-solid fa-clipboard-list text-sky-600 text-lg"></i>
                  <h3 className="font-bold text-base text-slate-800">
                    รายชื่อผู้จองทั้งหมด ({bookedCount})
                  </h3>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  โอนแล้ว (ฟ้า): {paidCount} เลข · รอโอน (เหลือง): {pendingCount} เลข
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsListModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center cursor-pointer"
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <div className="p-4 overflow-y-auto space-y-2 flex-grow">
              {bookedKeys.length === 0 ? (
                <div className="text-center py-8 text-slate-400">
                  <i className="fa-regular fa-folder-open text-3xl mb-2"></i>
                  <p className="text-sm">ยังไม่มีรายการจองหมายเลข</p>
                </div>
              ) : (
                bookedKeys.map((num) => {
                  const item = bookings[num];
                  const isPaid = item.status === 'paid';
                  return (
                    <div
                      key={num}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 gap-2"
                    >
                      <div className="flex items-center space-x-3 min-w-0">
                        <span
                          className={`w-10 h-10 rounded-xl font-black text-base flex items-center justify-center shadow-xs tabular-nums shrink-0 ${
                            isPaid
                              ? 'paid-card-gradient text-white'
                              : 'pending-card-gradient text-slate-900 border border-yellow-500'
                          }`}
                        >
                          {num}
                        </span>
                        <div className="min-w-0">
                          <p className="font-bold text-sm text-slate-800 truncate">{item.name}</p>
                          <p className="text-xs text-slate-500 truncate">
                            {isPaid ? 'สถานะ: โอนแล้ว (สีฟ้า)' : 'สถานะ: รอโอน (สีเหลือง)'}
                            {item.note ? ` · ${item.note}` : ''}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleToggleStatusInList(num)}
                          className={`text-xs font-bold px-2.5 py-1.5 rounded-lg border transition cursor-pointer whitespace-nowrap ${
                            isPaid
                              ? 'bg-sky-50 text-sky-700 border-sky-200 hover:bg-sky-100'
                              : 'bg-yellow-100 text-yellow-900 border-yellow-400 hover:bg-yellow-200'
                          }`}
                          title="แตะเพื่อสลับสถานะ รอโอน / โอนแล้ว"
                        >
                          {isPaid ? 'โอนแล้ว' : 'รอโอน'}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setIsListModalOpen(false);
                            openBookingModal(num);
                          }}
                          className="text-xs font-bold text-slate-600 bg-white hover:bg-slate-100 border border-slate-200 px-2.5 py-1.5 rounded-lg transition cursor-pointer whitespace-nowrap"
                        >
                          แก้ไข
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 rounded-b-3xl flex gap-2">
              <button
                type="button"
                onClick={() => {
                  copyTextToClipboard(lineMessageText, true);
                  setIsListModalOpen(false);
                }}
                className="w-full bg-line hover:bg-line-dark text-white font-bold py-2.5 rounded-xl shadow-sm transition text-sm flex items-center justify-center space-x-2 cursor-pointer whitespace-nowrap"
              >
                <i className="fa-brands fa-line text-base"></i>
                <span>คัดลอกสรุปส่งเข้า LINE</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: Edit Board Title Modal */}
      {isTitleModalOpen && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsTitleModalOpen(false);
          }}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4"
        >
          <div className="bg-white rounded-3xl max-w-xs w-full p-5 shadow-2xl">
            <h3 className="font-bold text-base text-slate-800 mb-2">แก้ไขข้อความรอง / ชื่อรุ่น</h3>
            <input
              type="text"
              maxLength={50}
              value={titleInput}
              onChange={(e) => setTitleInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSaveTitle();
              }}
              placeholder={DEFAULT_BOARD_SUBTITLE}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-sky-500 mb-4"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setIsTitleModalOpen(false)}
                className="flex-1 py-2 rounded-xl bg-slate-100 text-slate-600 text-xs font-bold cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleSaveTitle}
                className="flex-1 py-2 rounded-xl bg-line text-white text-xs font-bold cursor-pointer"
              >
                บันทึก
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 5: Confirm Clear All Modal */}
      {isConfirmClearOpen && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsConfirmClearOpen(false);
          }}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4"
        >
          <div className="bg-white rounded-3xl max-w-xs w-full p-5 text-center shadow-2xl">
            <div className="w-14 h-14 rounded-full bg-red-100 text-red-500 flex items-center justify-center mx-auto mb-3 text-2xl">
              <i className="fa-solid fa-triangle-exclamation"></i>
            </div>
            <h3 className="font-bold text-lg text-slate-800">เริ่มงวดใหม่ / ล้างข้อมูล?</h3>
            <p className="text-xs text-slate-500 mt-1 mb-5">
              หมายเลข 00-99 ทั้งหมดจะถูกตั้งค่ากลับเป็น "ว่าง" เพื่อเริ่มเปิดจองรอบใหม่
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setIsConfirmClearOpen(false)}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-sm transition cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleConfirmClearAll}
                className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold text-sm shadow-md shadow-red-500/20 transition cursor-pointer"
              >
                ยืนยันล้างแผง
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      <div
        className={`fixed top-20 left-1/2 -translate-x-1/2 z-50 pointer-events-none transition-all duration-300 transform ${
          toast.visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'
        }`}
      >
        <div className="bg-slate-900/95 text-white px-4 py-2.5 rounded-full shadow-xl text-xs font-medium flex items-center space-x-2 backdrop-blur-xs border border-white/10 whitespace-nowrap">
          <i
            className={
              toast.isError
                ? 'fa-solid fa-circle-exclamation text-amber-400'
                : 'fa-solid fa-circle-check text-line'
            }
          ></i>
          <span>{toast.message}</span>
        </div>
      </div>

      {/* Offline Mode Indicator */}
      <OfflineIndicator />

      {/* Hidden Textarea for Clipboard Copy Fallback */}
      <textarea
        ref={clipboardHelperRef}
        readOnly
        className="fixed -top-96 opacity-0 pointer-events-none"
        aria-hidden="true"
      />
    </div>
  );
}
