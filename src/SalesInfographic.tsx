import React, { useEffect, useRef, useState, useCallback } from 'react';
import type { BookingItem } from './App';

export type InfographicStyleId = 'style1_reward' | 'style2_official' | 'style3_available';

interface SalesInfographicProps {
  bookings: Record<string, BookingItem>;
  boardTitle: string;
  logoImg: HTMLImageElement | null;
  logoSrc: string;
  onShowToast: (msg: string, isError?: boolean) => void;
}

const STORAGE_KEY_PROMO_CONTACT = 'huayplus_infographic_contact_v1';

const STYLE_OPTIONS: {
  id: InfographicStyleId;
  badge: string;
  title: string;
  subtitle: string;
  icon: string;
}[] = [
  {
    id: 'style1_reward',
    badge: 'สไตล์ที่ 1',
    title: 'เน้นรางวัล 3,000 บาท',
    subtitle: 'ดึงดูดสายตา ชูความคุ้มค่า เบอร์ละ 100 ลุ้น 3,000.-',
    icon: 'fa-solid fa-trophy',
  },
  {
    id: 'style2_official',
    badge: 'สไตล์ที่ 2',
    title: 'ทางการ นนส.ขส. 2131',
    subtitle: 'แจ้งรายละเอียดโครงการ กติกา และเงื่อนไขชัดเจน',
    icon: 'fa-solid fa-shield-halved',
  },
  {
    id: 'style3_available',
    badge: 'สไตล์ที่ 3',
    title: 'สรุปเลขว่าง เร่งตัดสินใจ',
    subtitle: 'โชว์เฉพาะเลขว่างแยกหมวด 00-99 ให้ลูกค้าจิ้มจองไวขึ้น',
    icon: 'fa-solid fa-bolt',
  },
];

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

function drawNavyGoldFrame(ctx: CanvasRenderingContext2D, W: number, H: number) {
  // Deep Royal Navy-Blue Background
  const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
  bgGrad.addColorStop(0, '#030d24');
  bgGrad.addColorStop(0.45, '#0a2463');
  bgGrad.addColorStop(1, '#041230');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, W, H);

  // Decorative Gold Spotlight
  const radialGlow = ctx.createRadialGradient(W / 2, 320, 30, W / 2, 320, 560);
  radialGlow.addColorStop(0, 'rgba(250, 204, 21, 0.22)');
  radialGlow.addColorStop(1, 'rgba(250, 204, 21, 0)');
  ctx.fillStyle = radialGlow;
  ctx.fillRect(0, 0, W, H);

  // Outer Gold Border
  ctx.strokeStyle = '#facc15';
  ctx.lineWidth = 10;
  roundRect(ctx, 18, 18, W - 36, H - 36, 32);
  ctx.stroke();

  // Inner Fine Gold Hairline
  ctx.strokeStyle = 'rgba(253, 224, 71, 0.35)';
  ctx.lineWidth = 2.5;
  roundRect(ctx, 32, 32, W - 64, H - 64, 24);
  ctx.stroke();
}

function drawHeaderWithLogo(
  ctx: CanvasRenderingContext2D,
  W: number,
  logoImg: HTMLImageElement | null,
  kickerText: string,
  mainTitle: string,
  subTitle: string
) {
  if (logoImg && logoImg.complete && logoImg.naturalWidth > 0) {
    ctx.save();
    roundRect(ctx, 56, 52, 148, 148, 30);
    ctx.clip();
    ctx.drawImage(logoImg, 56, 52, 148, 148);
    ctx.restore();

    ctx.strokeStyle = '#fde047';
    ctx.lineWidth = 4;
    roundRect(ctx, 56, 52, 148, 148, 30);
    ctx.stroke();
  }

  // Gold Kicker Pill
  const kickerGrad = ctx.createLinearGradient(226, 54, 640, 54);
  kickerGrad.addColorStop(0, '#f59e0b');
  kickerGrad.addColorStop(1, '#facc15');
  ctx.fillStyle = kickerGrad;
  roundRect(ctx, 226, 54, 430, 40, 20);
  ctx.fill();

  ctx.textAlign = 'center';
  ctx.fillStyle = '#041230';
  ctx.font = '900 21px Kanit, sans-serif';
  ctx.fillText(kickerText, 226 + 215, 81);

  // Main Headline
  ctx.textAlign = 'left';
  ctx.fillStyle = '#fde047';
  ctx.font = '900 45px Kanit, sans-serif';
  ctx.fillText(mainTitle, 226, 142);

  ctx.fillStyle = '#ffffff';
  ctx.font = '600 27px Kanit, sans-serif';
  ctx.fillText(subTitle, 226, 184);

  // Divider line
  const lineGrad = ctx.createLinearGradient(56, 216, W - 56, 216);
  lineGrad.addColorStop(0, 'rgba(250, 204, 21, 0.1)');
  lineGrad.addColorStop(0.5, 'rgba(250, 204, 21, 0.85)');
  lineGrad.addColorStop(1, 'rgba(250, 204, 21, 0.1)');
  ctx.strokeStyle = lineGrad;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(56, 216);
  ctx.lineTo(W - 56, 216);
  ctx.stroke();
}

function drawFooterAndNote(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  contactText: string
) {
  // Call to Action Bar (Gold-Yellow Gradient)
  const ctaY = 1135;
  const ctaH = 112;
  const ctaGrad = ctx.createLinearGradient(54, ctaY, W - 54, ctaY);
  ctaGrad.addColorStop(0, '#f59e0b');
  ctaGrad.addColorStop(0.5, '#facc15');
  ctaGrad.addColorStop(1, '#fde047');
  ctx.fillStyle = ctaGrad;
  roundRect(ctx, 54, ctaY, W - 108, ctaH, 22);
  ctx.fill();
  ctx.strokeStyle = '#fefce8';
  ctx.lineWidth = 3;
  ctx.stroke();

  ctx.textAlign = 'center';
  ctx.fillStyle = '#041230';
  ctx.font = '900 26px Kanit, sans-serif';
  ctx.fillText(
    contactText.trim() || 'ทักแชทแจ้งหมายเลขที่ต้องการจองได้เลยครับ (ขออนุญาตจ่ายสด งดเชื่อนะครับ)',
    W / 2,
    ctaY + 46
  );

  ctx.fillStyle = '#7c2d12';
  ctx.font = '800 24px Kanit, sans-serif';
  ctx.fillText('⏰ ปิดการขายเวลา 14.00 น. ของวันออกสลาก', W / 2, ctaY + 88);

  // Proportional Prize Note Box
  const noteY = 1264;
  const noteH = 98;
  ctx.fillStyle = 'rgba(4, 18, 48, 0.9)';
  roundRect(ctx, 54, noteY, W - 108, noteH, 18);
  ctx.fill();
  ctx.strokeStyle = 'rgba(250, 204, 21, 0.55)';
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.textAlign = 'center';
  ctx.fillStyle = '#fde047';
  ctx.font = '700 23px Kanit, sans-serif';
  ctx.fillText(
    'หมายเหตุ _ ขายสลากไม่ถึงจำนวน 60 ตัวเลข เงินรางวัลลดลงตามสัดส่วน',
    W / 2,
    noteY + 40
  );

  ctx.fillStyle = '#f8fafc';
  ctx.font = '500 21px Kanit, sans-serif';
  ctx.fillText(
    'ตัวอย่าง ขายสลากได้ 50 ตัวเลข ๆ ละ 100 บาท ได้เงิน 5,000 บาท เงินรางวัลเหลือ 2,500 บาท',
    W / 2,
    noteY + 76
  );

  // Timestamp Footer
  const nowStr = new Date().toLocaleString('th-TH', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
  ctx.fillStyle = '#94a3b8';
  ctx.font = '500 20px Kanit, sans-serif';
  ctx.fillText(
    `อัปเดตข้อมูลล่าสุด: ${nowStr} น. | หวยพลัส+ สลากการกุศล รุ่น นนส.ขส. 2131`,
    W / 2,
    H - 40
  );
}

export const SalesInfographic: React.FC<SalesInfographicProps> = ({
  bookings,
  boardTitle,
  logoImg,
  logoSrc,
  onShowToast,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [activeStyle, setActiveStyle] = useState<InfographicStyleId>('style1_reward');
  const [contactText, setContactText] = useState<string>(() => {
    try {
      return (
        localStorage.getItem(STORAGE_KEY_PROMO_CONTACT) ||
        'ทักแชทแจ้งหมายเลขที่ต้องการจองได้เลยครับ (ขออนุญาตจ่ายสด งดเชื่อนะครับ)'
      );
    } catch {
      return 'ทักแชทแจ้งหมายเลขที่ต้องการจองได้เลยครับ (ขออนุญาตจ่ายสด งดเชื่อนะครับ)';
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_PROMO_CONTACT, contactText);
    } catch {
      // ignore
    }
  }, [contactText]);

  const allNumbers = Array.from({ length: 100 }, (_, i) => String(i).padStart(2, '0'));
  const bookedKeys = Object.keys(bookings);
  const bookedCount = bookedKeys.length;
  const availableKeys = allNumbers.filter((n) => !bookings[n]);
  const availableCount = availableKeys.length;

  let paidCount = 0;
  let pendingCount = 0;
  bookedKeys.forEach((k) => {
    if (bookings[k]?.status === 'paid') paidCount++;
    else pendingCount++;
  });

  // ============================================================================
  // RENDER ANY OF THE 3 STYLES ONTO A GIVEN CANVAS
  // ============================================================================
  const renderStyleToCanvas = useCallback(
    (canvas: HTMLCanvasElement | null, styleId: InfographicStyleId) => {
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const W = canvas.width; // 1080
      const H = canvas.height; // 1440

      drawNavyGoldFrame(ctx, W, H);

      if (styleId === 'style1_reward') {
        // ======================================================================
        // STYLE 1: สไตล์ดึงดูดใจ เน้นรางวัล 3,000 บาท (Navy-Blue-Gold-Yellow)
        // ======================================================================
        drawHeaderWithLogo(
          ctx,
          W,
          logoImg,
          'ลุ้นโชคใหญ่ 2 เด้ง! สลากการกุศล 00 - 99',
          'หวยพลัส+ สลากการกุศล นนส.ขส. 2131',
          boardTitle
        );

        // Giant Centerpiece Reward Card (Gold & Royal Blue)
        const heroX = 54;
        const heroY = 238;
        const heroW = W - 108;
        const heroH = 355;

        const heroGrad = ctx.createLinearGradient(heroX, heroY, heroX, heroY + heroH);
        heroGrad.addColorStop(0, '#0f2e78');
        heroGrad.addColorStop(0.5, '#071a47');
        heroGrad.addColorStop(1, '#04102e');
        ctx.fillStyle = heroGrad;
        roundRect(ctx, heroX, heroY, heroW, heroH, 30);
        ctx.fill();
        ctx.strokeStyle = '#facc15';
        ctx.lineWidth = 5;
        ctx.stroke();

        // Top Ribbon inside Hero
        const ribGrad = ctx.createLinearGradient(W / 2 - 280, heroY, W / 2 + 280, heroY);
        ribGrad.addColorStop(0, '#ca8a04');
        ribGrad.addColorStop(0.5, '#fde047');
        ribGrad.addColorStop(1, '#ca8a04');
        ctx.fillStyle = ribGrad;
        roundRect(ctx, W / 2 - 310, heroY + 22, 620, 48, 24);
        ctx.fill();

        ctx.textAlign = 'center';
        ctx.fillStyle = '#041230';
        ctx.font = '900 25px Kanit, sans-serif';
        ctx.fillText('ผลตอบแทนสุดคุ้ม! ถูกรางวัล "บน" หรือ "ล่าง"', W / 2, heroY + 55);

        // Giant 3,000 บาท Typography
        ctx.fillStyle = '#fde047';
        ctx.font = '900 112px Kanit, sans-serif';
        ctx.fillText('รับรางวัลละ 3,000.-', W / 2, heroY + 188);

        // Price & Condition Pill Row inside Hero
        ctx.fillStyle = '#facc15';
        roundRect(ctx, heroX + 45, heroY + 228, 410, 96, 20);
        ctx.fill();
        ctx.fillStyle = '#041230';
        ctx.font = '900 40px Kanit, sans-serif';
        ctx.fillText('เพียงเบอร์ละ 100 บาท', heroX + 45 + 205, heroY + 278);
        ctx.font = '700 20px Kanit, sans-serif';
        ctx.fillText('เลือกเลขที่ชอบได้ตั้งแต่ 00 - 99', heroX + 45 + 205, heroY + 309);

        ctx.fillStyle = '#1e3a8a';
        roundRect(ctx, heroX + 480, heroY + 228, 445, 96, 20);
        ctx.fill();
        ctx.strokeStyle = '#fde047';
        ctx.lineWidth = 2.5;
        ctx.stroke();
        ctx.fillStyle = '#fde047';
        ctx.font = '800 30px Kanit, sans-serif';
        ctx.fillText('ลุ้นได้ทั้ง 2 ตัวบน และ 2 ตัวล่าง', heroX + 480 + 222, heroY + 274);
        ctx.fillStyle = '#ffffff';
        ctx.font = '600 21px Kanit, sans-serif';
        ctx.fillText('(ขออนุญาตจ่ายสด งดเชื่อนะครับ)', heroX + 480 + 222, heroY + 308);

        // 3 Selling Point Cards (Navy-Gold-Yellow)
        const featY = 616;
        const featH = 230;
        const featW = (W - 108 - 32) / 3;
        const features = [
          {
            badge: 'คุ้มที่ 1',
            title: 'ลงทุนหลักร้อย',
            highlight: '100 บ. / เลข',
            desc: 'ได้ร่วมทำบุญสวัสดิการ รุ่น 2131',
          },
          {
            badge: 'คุ้มที่ 2',
            title: 'ลุ้นรับโชค 30 เท่า',
            highlight: '3,000 บาท',
            desc: 'ถูกบนรับ 3,000 / ถูกล่างรับ 3,000',
          },
          {
            badge: 'คุ้มที่ 3',
            title: 'แผงออนไลน์โปร่งใส',
            highlight: 'เช็คเลขสด 24 ชม.',
            desc: 'สีเหลือง = รอโอน · สีฟ้า = โอนแล้ว',
          },
        ];

        features.forEach((f, idx) => {
          const fx = 54 + idx * (featW + 16);
          ctx.fillStyle = 'rgba(15, 35, 86, 0.92)';
          roundRect(ctx, fx, featY, featW, featH, 22);
          ctx.fill();
          ctx.strokeStyle = '#eab308';
          ctx.lineWidth = 2.5;
          ctx.stroke();

          ctx.fillStyle = '#fde047';
          roundRect(ctx, fx + featW / 2 - 65, featY + 18, 130, 34, 17);
          ctx.fill();
          ctx.textAlign = 'center';
          ctx.fillStyle = '#041230';
          ctx.font = '800 19px Kanit, sans-serif';
          ctx.fillText(f.badge, fx + featW / 2, featY + 41);

          ctx.fillStyle = '#ffffff';
          ctx.font = '700 24px Kanit, sans-serif';
          ctx.fillText(f.title, fx + featW / 2, featY + 92);

          ctx.fillStyle = '#facc15';
          ctx.font = '900 36px Kanit, sans-serif';
          ctx.fillText(f.highlight, fx + featW / 2, featY + 145);

          ctx.fillStyle = '#cbd5e1';
          ctx.font = '500 18px Kanit, sans-serif';
          ctx.fillText(f.desc, fx + featW / 2, featY + 192);
        });

        // 3-Step Horizontal Flow Strip
        const flowY = 868;
        const flowH = 244;
        const flowGrad = ctx.createLinearGradient(54, flowY, 54, flowY + flowH);
        flowGrad.addColorStop(0, '#fefce8');
        flowGrad.addColorStop(1, '#fef08a');
        ctx.fillStyle = flowGrad;
        roundRect(ctx, 54, flowY, W - 108, flowH, 24);
        ctx.fill();
        ctx.strokeStyle = '#ca8a04';
        ctx.lineWidth = 3;
        ctx.stroke();

        ctx.textAlign = 'center';
        ctx.fillStyle = '#041230';
        ctx.font = '900 28px Kanit, sans-serif';
        ctx.fillText(
          `วิธีร่วมลุ้นรางวัล 3,000 บาทง่ายๆ (ตอนนี้เหลือเลขว่าง ${availableCount} เลข!)`,
          W / 2,
          flowY + 46
        );

        const steps = [
          { step: '1. เลือกเลขว่าง 00-99', sub: 'ดูเลขช่องสีขาวที่ยังว่างอยู่' },
          { step: '2. ทักจองในห้อง LINE', sub: 'ระบบขึ้นชื่อจอง "สีเหลือง" (รอโอน)' },
          { step: '3. โอนเงิน 100 บาท/เลข', sub: 'เปลี่ยนเป็น "สีฟ้า" (โอนแล้ว) รอรับโชค!' },
        ];
        const sw = (W - 108 - 56) / 3;
        steps.forEach((s, i) => {
          const sx = 54 + 16 + i * (sw + 12);
          const sy = flowY + 68;
          ctx.fillStyle = '#061a40';
          roundRect(ctx, sx, sy, sw, 152, 18);
          ctx.fill();
          ctx.strokeStyle = '#f59e0b';
          ctx.lineWidth = 2;
          ctx.stroke();

          ctx.fillStyle = '#fde047';
          ctx.font = '800 23px Kanit, sans-serif';
          ctx.fillText(s.step, sx + sw / 2, sy + 64);

          ctx.fillStyle = '#e2e8f0';
          ctx.font = '500 18px Kanit, sans-serif';
          ctx.fillText(s.sub, sx + sw / 2, sy + 108);
        });

        drawFooterAndNote(ctx, W, H, contactText);
      } else if (styleId === 'style2_official') {
        // ======================================================================
        // STYLE 2: สไตล์ทางการ แจ้งงวด นนส.ขส. 2131 (Official Welfare & Rules)
        // ======================================================================
        drawHeaderWithLogo(
          ctx,
          W,
          logoImg,
          'ประกาศสลากการกุศลเพื่อสวัสดิการ (เฉพาะกิจ)',
          'หวยพลัส+ สลากการกุศล นนส.ขส. 2131',
          boardTitle
        );

        // Official Announcement Banner
        const bannerX = 54;
        const bannerY = 238;
        const bannerW = W - 108;
        const bannerH = 126;

        const bannerGrad = ctx.createLinearGradient(bannerX, bannerY, bannerX, bannerY + bannerH);
        bannerGrad.addColorStop(0, '#fefce8');
        bannerGrad.addColorStop(1, '#fef08a');
        ctx.fillStyle = bannerGrad;
        roundRect(ctx, bannerX, bannerY, bannerW, bannerH, 22);
        ctx.fill();
        ctx.strokeStyle = '#eab308';
        ctx.lineWidth = 4;
        ctx.stroke();

        ctx.textAlign = 'center';
        ctx.fillStyle = '#041230';
        ctx.font = '900 26px Kanit, sans-serif';
        ctx.fillText(
          'ขอเชิญเพื่อนๆ ร่วมสนับสนุนสลากการกุศลเพื่อสวัสดิการ รุ่น นนส.ขส. 2131 (เฉพาะกิจ)',
          W / 2,
          bannerY + 50
        );
        ctx.fillStyle = '#b45309';
        ctx.font = '800 23px Kanit, sans-serif';
        ctx.fillText(
          'รายได้เพื่อสมทบทุนสวัสดิการสมาชิก รุ่น นนส.ขส. 2131 · โปร่งใส ตรวจสอบได้ทุกหมายเลข',
          W / 2,
          bannerY + 92
        );

        // Official Specification Table Box
        const specX = 54;
        const specY = 386;
        const specW = W - 108;
        const specH = 440;

        ctx.fillStyle = 'rgba(7, 25, 63, 0.95)';
        roundRect(ctx, specX, specY, specW, specH, 26);
        ctx.fill();
        ctx.strokeStyle = '#facc15';
        ctx.lineWidth = 3;
        ctx.stroke();

        // Table Header Bar
        ctx.fillStyle = '#eab308';
        roundRect(ctx, specX + 20, specY + 20, specW - 40, 54, 14);
        ctx.fill();
        ctx.textAlign = 'center';
        ctx.fillStyle = '#041230';
        ctx.font = '900 26px Kanit, sans-serif';
        ctx.fillText('รายละเอียดและกติกาการจำหน่ายสลากการกุศล รุ่น นนส.ขส. 2131', W / 2, specY + 56);

        const specs = [
          {
            label: '1. หมวดหมายเลขที่เปิดจำหน่าย',
            value: 'หมายเลข 00 ถึง 99 (จำนวนรวมทั้งสิ้น 100 หมายเลข)',
          },
          {
            label: '2. ราคาจำหน่ายสลาก',
            value: 'เบอร์ละ 100 บาท (ขออนุญาตจ่ายสด งดเชื่อนะครับ)',
          },
          {
            label: '3. ผลตอบแทน / เงินรางวัล',
            value: 'เลขท้าย 2 ตัว "บน" หรือ "ล่าง" รับรางวัล ๆ ละ 3,000 บาท',
          },
          {
            label: '4. กำหนดเวลาปิดการขาย',
            value: 'ปิดการขายเวลา 14.00 น. ของวันออกสลาก',
          },
          {
            label: '5. เงื่อนไขสัดส่วนเงินรางวัล',
            value: 'หากขายไม่ถึง 60 ตัวเลข เงินรางวัลจะปรับลดลงตามสัดส่วนจริง',
          },
        ];

        specs.forEach((row, idx) => {
          const ry = specY + 92 + idx * 66;
          ctx.fillStyle = idx % 2 === 0 ? 'rgba(30, 58, 138, 0.55)' : 'rgba(15, 23, 42, 0.65)';
          roundRect(ctx, specX + 24, ry, specW - 48, 56, 12);
          ctx.fill();

          ctx.textAlign = 'left';
          ctx.fillStyle = '#fde047';
          ctx.font = '800 22px Kanit, sans-serif';
          ctx.fillText(row.label, specX + 44, ry + 36);

          ctx.textAlign = 'right';
          ctx.fillStyle = '#ffffff';
          ctx.font = '700 22px Kanit, sans-serif';
          ctx.fillText(row.value, specX + specW - 44, ry + 36);
        });

        // Color Legend & Live Board Status Card
        const legX = 54;
        const legY = 848;
        const legW = W - 108;
        const legH = 264;

        ctx.fillStyle = 'rgba(15, 35, 86, 0.92)';
        roundRect(ctx, legX, legY, legW, legH, 24);
        ctx.fill();
        ctx.strokeStyle = '#fde047';
        ctx.lineWidth = 2.5;
        ctx.stroke();

        ctx.textAlign = 'center';
        ctx.fillStyle = '#fde047';
        ctx.font = '800 26px Kanit, sans-serif';
        ctx.fillText('สัญลักษณ์สีสถานะบนตารางแผง 00 - 99 และสรุปยอดปัจจุบัน', W / 2, legY + 46);

        const statusCards = [
          {
            title: 'ช่องสีขาว = เลขว่าง',
            count: `คงเหลือ ${availableCount} เลข`,
            desc: 'สามารถเลือกจองได้ทันที',
            bg: '#ffffff',
            fg: '#041230',
            border: '#cbd5e1',
          },
          {
            title: 'ช่องสีเหลือง = รอโอน',
            count: `จองรอโอน ${pendingCount} เลข`,
            desc: 'บันทึกชื่อผู้จองแล้ว รอชำระเงิน',
            bg: '#facc15',
            fg: '#041230',
            border: '#ca8a04',
          },
          {
            title: 'ช่องสีฟ้า = โอนแล้ว',
            count: `ชำระแล้ว ${paidCount} เลข`,
            desc: 'โอนเงินสมบูรณ์ ล็อกเลข 100%',
            bg: '#0ea5e9',
            fg: '#ffffff',
            border: '#7dd3fc',
          },
        ];

        const scW = (legW - 64) / 3;
        statusCards.forEach((sc, i) => {
          const sx = legX + 20 + i * (scW + 12);
          const sy = legY + 68;
          ctx.fillStyle = sc.bg;
          roundRect(ctx, sx, sy, scW, 170, 18);
          ctx.fill();
          ctx.strokeStyle = sc.border;
          ctx.lineWidth = 3;
          ctx.stroke();

          ctx.textAlign = 'center';
          ctx.fillStyle = sc.fg;
          ctx.font = '900 24px Kanit, sans-serif';
          ctx.fillText(sc.title, sx + scW / 2, sy + 50);

          ctx.font = '900 34px Kanit, sans-serif';
          ctx.fillText(sc.count, sx + scW / 2, sy + 104);

          ctx.font = '600 18px Kanit, sans-serif';
          ctx.fillText(sc.desc, sx + scW / 2, sy + 144);
        });

        drawFooterAndNote(ctx, W, H, contactText);
      } else {
        // ======================================================================
        // STYLE 3: สไตล์สรุปเลขว่าง เร่งการตัดสินใจ (Available Numbers Matrix)
        // ======================================================================
        drawHeaderWithLogo(
          ctx,
          W,
          logoImg,
          `ด่วน! เหลือเลขว่างเพียง ${availableCount} หมายเลขสุดท้าย`,
          'สรุปหมายเลขว่างพร้อมจอง (00 - 99)',
          `หวยพลัส+ ${boardTitle}`
        );

        // Urgency Summary Bar (Navy-Gold-Yellow)
        const urgX = 54;
        const urgY = 234;
        const urgW = W - 108;
        const urgH = 120;

        const urgGrad = ctx.createLinearGradient(urgX, urgY, urgX + urgW, urgY);
        urgGrad.addColorStop(0, '#0f2963');
        urgGrad.addColorStop(0.5, '#1e3a8a');
        urgGrad.addColorStop(1, '#0f2963');
        ctx.fillStyle = urgGrad;
        roundRect(ctx, urgX, urgY, urgW, urgH, 22);
        ctx.fill();
        ctx.strokeStyle = '#facc15';
        ctx.lineWidth = 3.5;
        ctx.stroke();

        // 3 Stat blocks inside Urgency Bar
        ctx.textAlign = 'center';
        ctx.fillStyle = '#fde047';
        ctx.font = '900 32px Kanit, sans-serif';
        ctx.fillText(
          `เลขว่างพร้อมจอง: ${availableCount} เลข  |  จองแล้ว: ${bookedCount} เลข`,
          W / 2,
          urgY + 50
        );

        ctx.fillStyle = '#ffffff';
        ctx.font = '700 24px Kanit, sans-serif';
        ctx.fillText(
          'เบอร์ละ 100 บาท · ถูกรางวัล บน หรือ ล่าง รับรางวัล ๆ ละ 3,000 บาท!',
          W / 2,
          urgY + 94
        );

        // Categorized Available Numbers Table (10 Rows: หมวด 00-09 to หมวด 90-99)
        const matX = 54;
        const matY = 372;
        const matW = W - 108;
        const matH = 742;

        ctx.fillStyle = 'rgba(4, 18, 48, 0.85)';
        roundRect(ctx, matX, matY, matW, matH, 24);
        ctx.fill();
        ctx.strokeStyle = '#eab308';
        ctx.lineWidth = 3;
        ctx.stroke();

        // Title inside Matrix
        ctx.fillStyle = '#facc15';
        roundRect(ctx, matX + 18, matY + 16, matW - 36, 48, 14);
        ctx.fill();
        ctx.textAlign = 'center';
        ctx.fillStyle = '#041230';
        ctx.font = '900 24px Kanit, sans-serif';
        ctx.fillText(
          'หมายเลขสีทองสว่าง = เลขว่างกดจองได้ทันที  |  ช่องมืด = มีผู้จองแล้ว',
          W / 2,
          matY + 48
        );

        const rowStartY = matY + 78;
        const rowH = 64;
        const colW = (matW - 190) / 10;

        for (let r = 0; r < 10; r++) {
          const ry = rowStartY + r * rowH;

          // Row Label Badge (e.g. หมวด 00-09)
          ctx.fillStyle = '#1e3a8a';
          roundRect(ctx, matX + 18, ry + 4, 142, rowH - 10, 12);
          ctx.fill();
          ctx.strokeStyle = '#facc15';
          ctx.lineWidth = 1.5;
          ctx.stroke();

          ctx.textAlign = 'center';
          ctx.fillStyle = '#fde047';
          ctx.font = '800 20px Kanit, sans-serif';
          ctx.fillText(`หมวด ${r}0-${r}9`, matX + 18 + 71, ry + 38);

          // 10 Number Pills in the row
          for (let c = 0; c < 10; c++) {
            const num = `${r}${c}`;
            const isBooked = Boolean(bookings[num]);
            const nx = matX + 172 + c * colW;
            const ny = ry + 4;
            const nw = colW - 8;
            const nh = rowH - 10;

            if (!isBooked) {
              // AVAILABLE -> Bright Gold-Yellow Highlight Card so buyers spot it immediately!
              const availGrad = ctx.createLinearGradient(nx, ny, nx, ny + nh);
              availGrad.addColorStop(0, '#fef9c3');
              availGrad.addColorStop(0.5, '#fde047');
              availGrad.addColorStop(1, '#facc15');
              ctx.fillStyle = availGrad;
              roundRect(ctx, nx, ny, nw, nh, 12);
              ctx.fill();
              ctx.strokeStyle = '#ffffff';
              ctx.lineWidth = 2;
              ctx.stroke();

              ctx.fillStyle = '#041230';
              ctx.font = '900 28px Kanit, sans-serif';
              ctx.fillText(num, nx + nw / 2, ny + 37);
            } else {
              // BOOKED -> Dimmed Navy Slot with "เต็ม"
              ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
              roundRect(ctx, nx, ny, nw, nh, 12);
              ctx.fill();
              ctx.strokeStyle = 'rgba(148, 163, 184, 0.22)';
              ctx.lineWidth = 1;
              ctx.stroke();

              ctx.fillStyle = 'rgba(148, 163, 184, 0.45)';
              ctx.font = '700 18px Kanit, sans-serif';
              ctx.fillText('จองแล้ว', nx + nw / 2, ny + 34);
            }
          }
        }

        drawFooterAndNote(ctx, W, H, contactText);
      }
    },
    [bookings, boardTitle, logoImg, availableCount, bookedCount, pendingCount, paidCount, contactText]
  );

  useEffect(() => {
    renderStyleToCanvas(canvasRef.current, activeStyle);
  }, [renderStyleToCanvas, activeStyle, logoSrc]);

  const getStyleFileName = (styleId: InfographicStyleId) => {
    if (styleId === 'style1_reward') return 'หวยพลัส-สไตล์1-เน้นรางวัล3000.png';
    if (styleId === 'style2_official') return 'หวยพลัส-สไตล์2-ทางการ-นนส-ขส-2131.png';
    return 'หวยพลัส-สไตล์3-สรุปเลขว่างด่วน.png';
  };

  const handleDownloadCurrent = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    renderStyleToCanvas(canvas, activeStyle);
    const link = document.createElement('a');
    link.download = getStyleFileName(activeStyle);
    link.href = canvas.toDataURL('image/png');
    link.click();
    onShowToast(`บันทึกรูป ${ getStyleFileName(activeStyle) } เรียบร้อยแล้ว!`);
  };

  const handleDownloadAllThree = () => {
    const offscreen = document.createElement('canvas');
    offscreen.width = 1080;
    offscreen.height = 1440;

    const styles: InfographicStyleId[] = ['style1_reward', 'style2_official', 'style3_available'];
    styles.forEach((st, idx) => {
      window.setTimeout(() => {
        renderStyleToCanvas(offscreen, st);
        const link = document.createElement('a');
        link.download = getStyleFileName(st);
        link.href = offscreen.toDataURL('image/png');
        link.click();
        if (idx === styles.length - 1) {
          onShowToast('ดาวน์โหลดชุดภาพ Infographic ครบทั้ง 3 สไตล์เรียบร้อยแล้ว!');
        }
      }, idx * 350);
    });
  };

  const handleShareCurrent = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    renderStyleToCanvas(canvas, activeStyle);
    canvas.toBlob(async (blob) => {
      if (!blob) return;
      const file = new File([blob], getStyleFileName(activeStyle), { type: 'image/png' });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({
            title: 'หวยพลัส+ สลากการกุศล นนส.ขส. 2131',
            text: 'ขอเชิญเพื่อนๆ ร่วมสนับสนุนสลากการกุศล รุ่น นนส.ขส. 2131 เบอร์ละ 100 บาท ลุ้นรางวัลบน-ล่าง รางวัลละ 3,000 บาท',
            files: [file],
          });
          onShowToast('เปิดเมนูแชร์รูป Infographic เข้า LINE สำเร็จ!');
          return;
        } catch (err: unknown) {
          if (err instanceof Error && err.name !== 'AbortError') {
            handleDownloadCurrent();
          }
        }
      } else {
        handleDownloadCurrent();
      }
    }, 'image/png');
  };

  const handleCopyCaptionByStyle = async () => {
    let caption = '';
    if (activeStyle === 'style1_reward') {
      caption = [
        `🏆 ลุ้นโชคใหญ่ 2 เด้ง! รับรางวัลละ 3,000 บาท!`,
        `🎰 หวยพลัส+ สลากการกุศล นนส.ขส. 2131 (เฉพาะกิจ)`,
        ``,
        `✨ เพียงเบอร์ละ 100 บาท เลือกเลขที่ชอบได้ตั้งแต่ 00 - 99`,
        `💰 ถูกรางวัลเลขท้าย 2 ตัว "บน" หรือ "ล่าง" รับรางวัล ๆ ละ 3,000 บาท!`,
        `📌 ขออนุญาตจ่ายสด งดเชื่อนะครับ`,
        `⏰ ปิดการขายเวลา 14.00 น. ของวันออกสลาก`,
        ``,
        `💬 ${contactText}`,
        `⚠️ หมายเหตุ: ขายสลากไม่ถึงจำนวน 60 ตัวเลข เงินรางวัลลดลงตามสัดส่วน`,
      ].join('\n');
    } else if (activeStyle === 'style2_official') {
      caption = [
        `📣 ประกาศเปิดรับจองสลากการกุศลเพื่อสวัสดิการ รุ่น นนส.ขส. 2131 (เฉพาะกิจ)`,
        `ขอเชิญเพื่อนๆ ร่วมสนับสนุนสลากการกุศลเพื่อสวัสดิการ รุ่น นนส.ขส. 2131`,
        ``,
        `📋 รายละเอียดและกติกา:`,
        `1. หมายเลขที่เปิดจำหน่าย: 00 - 99 (รวม 100 หมายเลข)`,
        `2. ราคาจำหน่าย: เบอร์ละ 100 บาท (ขออนุญาตจ่ายสด งดเชื่อนะครับ)`,
        `3. ผลตอบแทน: ถูกรางวัล "บน" หรือ "ล่าง" รับรางวัล ๆ ละ 3,000 บาท`,
        `4. ปิดการขาย: เวลา 14.00 น. ของวันออกสลาก`,
        `5. สถานะปัจจุบัน: โอนแล้ว ${paidCount} เลข | รอโอน ${pendingCount} เลข | ว่าง ${availableCount} เลข`,
        ``,
        `⚠️ หมายเหตุ _ ขายสลากไม่ถึงจำนวน 60 ตัวเลข เงินรางวัลลดลงตามสัดส่วน (ตัวอย่าง ขายสลากได้ 50 ตัวเลข ๆ ละ 100 บาท ได้เงิน 5,000 บาท เงินรางวัลเหลือ 2,500 บาท)`,
      ].join('\n');
    } else {
      caption = [
        `⚡ ด่วน! สรุปหมายเลขที่ยังว่าง เหลือเพียง ${availableCount} เลขสุดท้าย!`,
        `🎰 หวยพลัส+ สลากการกุศล นนส.ขส. 2131`,
        `💵 เบอร์ละ 100 บาท ลุ้นรางวัล "บน" หรือ "ล่าง" รางวัลละ 3,000 บาท`,
        `━━━━━━━━━━━━━━`,
        availableCount > 0
          ? `🟡 หมายเลขที่ยังว่าง (${availableCount} เลข):\n${availableKeys.join(', ')}`
          : `🎉 ขณะนี้จองเต็มครบทุกหมายเลข 00 - 99 แล้ว ขอบคุณครับ!`,
        `━━━━━━━━━━━━━━`,
        `💬 ${contactText}`,
        `⏰ ปิดการขายเวลา 14.00 น. ของวันออกสลาก`,
      ].join('\n');
    }

    try {
      await navigator.clipboard.writeText(caption);
      onShowToast('คัดลอกแคปชั่นตรงตามสไตล์ที่เลือกแล้ว! วางใน LINE ได้เลย');
    } catch {
      onShowToast('คัดลอกแคปชั่นสำเร็จ');
    }
  };

  return (
    <div className="space-y-3">
      {/* 3-Style Selector Cards (Navy-Blue-Gold-Yellow Theme) */}
      <div>
        <p className="text-xs font-extrabold text-slate-700 mb-1.5">
          เลือกสไตล์ภาพ Infographic โปรโมทขาย (โทนน้ำเงิน-ทอง-เหลือง):
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {STYLE_OPTIONS.map((opt) => {
            const isSelected = activeStyle === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => setActiveStyle(opt.id)}
                className={`text-left p-2.5 rounded-2xl border-2 transition cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'bg-huay-navy text-white border-amber-400 shadow-md ring-2 ring-amber-300/60'
                    : 'bg-slate-50 hover:bg-amber-50/50 text-slate-800 border-slate-200'
                }`}
              >
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span
                    className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md ${
                      isSelected ? 'bg-amber-400 text-slate-950' : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {opt.badge}
                  </span>
                  <i
                    className={`${opt.icon} text-xs ${
                      isSelected ? 'text-amber-300' : 'text-slate-400'
                    }`}
                  ></i>
                </div>
                <p
                  className={`font-extrabold text-xs sm:text-sm leading-snug ${
                    isSelected ? 'text-amber-300' : 'text-slate-900'
                  }`}
                >
                  {opt.title}
                </p>
                <p
                  className={`text-[10px] mt-0.5 leading-tight ${
                    isSelected ? 'text-slate-200' : 'text-slate-500'
                  }`}
                >
                  {opt.subtitle}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Editable Call-to-Action / Payment Text on Infographic */}
      <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-2.5">
        <label className="block text-[11px] font-bold text-slate-700 mb-1">
          <i className="fa-solid fa-pen-to-square text-amber-600 mr-1"></i>
          ข้อความเชิญชวน / ช่องทางโอนเงินท้ายโปสเตอร์ (แก้ไขได้):
        </label>
        <input
          type="text"
          maxLength={65}
          value={contactText}
          onChange={(e) => setContactText(e.target.value)}
          placeholder="เช่น ทักแชทจองได้เลย หรือ ใส่เลขบัญชี/พร้อมเพย์..."
          className="w-full px-3 py-1.5 bg-white border border-amber-300 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:border-huay-navy"
        />
      </div>

      {/* Infographic Canvas Preview */}
      <div className="bg-slate-900 rounded-2xl p-2.5 border-2 border-amber-400/70 text-center">
        <div className="flex items-center justify-between px-1 mb-2">
          <span className="text-[11px] font-bold text-amber-300">
            ตัวอย่างภาพ: {STYLE_OPTIONS.find((s) => s.id === activeStyle)?.badge} —{' '}
            {STYLE_OPTIONS.find((s) => s.id === activeStyle)?.title}
          </span>
          <span className="text-[10px] text-slate-300">ความละเอียดสูง 1080×1440 px</span>
        </div>
        <canvas
          ref={canvasRef}
          width={1080}
          height={1440}
          className="w-full h-auto rounded-xl shadow-lg mx-auto max-h-[44vh] object-contain bg-huay-navy"
        />
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <button
          type="button"
          onClick={handleShareCurrent}
          className="bg-line hover:bg-line-dark text-white font-bold py-2.5 px-3 rounded-xl shadow-md transition flex items-center justify-center space-x-1.5 text-xs sm:text-sm cursor-pointer whitespace-nowrap"
        >
          <i className="fa-brands fa-line text-base"></i>
          <span>แชร์รูปสไตล์นี้เข้า LINE</span>
        </button>

        <button
          type="button"
          onClick={handleDownloadCurrent}
          className="bg-huay-navy hover:bg-huay-blue text-amber-300 font-bold py-2.5 px-3 rounded-xl shadow-md border border-amber-400/40 transition flex items-center justify-center space-x-1.5 text-xs sm:text-sm cursor-pointer whitespace-nowrap"
        >
          <i className="fa-solid fa-download"></i>
          <span>บันทึกรูปสไตล์นี้ลงเครื่อง</span>
        </button>

        <button
          type="button"
          onClick={handleDownloadAllThree}
          className="bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-300 hover:brightness-105 text-slate-950 font-extrabold py-2.5 px-3 rounded-xl shadow-md border border-amber-500 transition flex items-center justify-center space-x-1.5 text-xs sm:text-sm cursor-pointer whitespace-nowrap"
        >
          <i className="fa-solid fa-images"></i>
          <span>ดาวน์โหลดครบทั้ง 3 สไตล์ (3 รูป)</span>
        </button>

        <button
          type="button"
          onClick={handleCopyCaptionByStyle}
          className="bg-slate-800 hover:bg-slate-900 text-white font-bold py-2.5 px-3 rounded-xl shadow-md transition flex items-center justify-center space-x-1.5 text-xs sm:text-sm cursor-pointer whitespace-nowrap"
        >
          <i className="fa-regular fa-copy"></i>
          <span>คัดลอกแคปชั่นตามสไตล์นี้</span>
        </button>
      </div>
    </div>
  );
};
