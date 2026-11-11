import React, { useState } from 'react';
import { usePWAInstall, useOnlineStatus } from './usePWAInstall';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, isInIframe, install } = usePWAInstall();
  const [showGuideModal, setShowGuideModal] = useState(false);

  // If already running as an installed standalone PWA, hide the button
  if (isInstalled) {
    return null;
  }

  const handleInstallClick = async () => {
    if (isInstallable) {
      await install();
    } else {
      setShowGuideModal(true);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={handleInstallClick}
        className="bg-amber-400 hover:bg-amber-300 active:scale-95 text-slate-900 px-3 py-2 rounded-xl text-xs font-extrabold shadow-md border border-yellow-200 transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
        title="ติดตั้งแอปลงบน Google Chrome / หน้าจอมือถือ"
      >
        <i className="fa-solid fa-download text-xs"></i>
        <span>ติดตั้งแอป</span>
      </button>

      {showGuideModal && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowGuideModal(false);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-4"
        >
          <div className="w-full max-w-md rounded-3xl bg-white p-5 text-slate-800 shadow-2xl border-t-4 border-amber-400">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-huay-navy text-amber-300 flex items-center justify-center text-lg shadow-sm">
                  <i className="fa-brands fa-chrome"></i>
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    ติดตั้งแอปบน Google Chrome
                  </h3>
                  <p className="text-xs text-slate-500">
                    ใช้งานได้เหมือนแอปจริง เปิดได้ทันทีจากหน้าจอหลัก
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowGuideModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center cursor-pointer"
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <div className="space-y-3 text-xs sm:text-sm text-slate-700 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
              {isInIframe && (
                <div className="bg-amber-50 border border-amber-300 rounded-xl p-3 text-amber-900">
                  <p className="font-bold mb-1.5">
                    <i className="fa-solid fa-arrow-up-right-from-square mr-1.5"></i>
                    ขั้นตอนที่ 1: เปิดเว็บในแท็บใหม่ของ Google Chrome
                  </p>
                  <p className="text-xs text-amber-800 mb-2">
                    เนื่องจากตอนนี้เปิดอยู่ในหน้าต่างตัวอย่าง ให้กดปุ่มด้านล่างเพื่อเปิดในแท็บ Chrome เต็มหน้าจอก่อนติดตั้ง
                  </p>
                  <a
                    href={window.location.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-1.5 w-full py-2 px-3 rounded-lg bg-huay-navy text-amber-300 font-bold text-xs shadow-xs hover:bg-huay-blue transition"
                  >
                    <i className="fa-brands fa-chrome"></i>
                    <span>เปิดในแท็บใหม่ของ Chrome</span>
                  </a>
                </div>
              )}

              {!isIOS ? (
                <div className="space-y-2">
                  <p className="font-bold text-slate-900">
                    วิธีติดตั้งบน Google Chrome (คอมพิวเตอร์ / มือถือ Android):
                  </p>
                  <ol className="list-decimal list-inside space-y-1.5 text-xs sm:text-sm text-slate-600">
                    <li>
                      กดปุ่ม <strong className="text-slate-900">"ติดตั้งแอป"</strong> ด้านบน หรือคลิกไอคอน{' '}
                      <strong className="text-slate-900">ติดตั้ง (รูปหน้าจอมีลูกศรลง)</strong> ที่แถบ URL ด้านขวาบนของ Chrome
                    </li>
                    <li>
                      หากใช้มือถือ Android ให้แตะเมนู <strong className="text-slate-900">⋮ (จุด 3 จุดมุมขวาบน)</strong> แล้วเลือก{' '}
                      <strong className="text-slate-900">"ติดตั้งแอป" (Install app)</strong> หรือ{' '}
                      <strong className="text-slate-900">"เพิ่มลงในหน้าจอหลัก"</strong>
                    </li>
                    <li>
                      กดยืนยัน <strong className="text-slate-900">"ติดตั้ง" (Install)</strong> เพื่อสร้างไอคอนแอปหวยพลัส+ บนเครื่อง
                    </li>
                  </ol>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="font-bold text-slate-900">วิธีติดตั้งบน iPhone / iPad:</p>
                  <ol className="list-decimal list-inside space-y-1.5 text-xs sm:text-sm text-slate-600">
                    <li>
                      แตะปุ่ม <strong className="text-slate-900">แชร์ (Share)</strong> ที่แถบด้านล่างหรือมุมขวาบนของเบราว์เซอร์
                    </li>
                    <li>
                      เลื่อนลงมาแล้วแตะ <strong className="text-slate-900">"เพิ่มไปยังหน้าจอโฮม" (Add to Home Screen)</strong>
                    </li>
                    <li>
                      แตะ <strong className="text-slate-900">"เพิ่ม" (Add)</strong> ที่มุมขวาบน
                    </li>
                  </ol>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => setShowGuideModal(false)}
              className="mt-4 w-full rounded-xl bg-slate-900 py-2.5 text-xs sm:text-sm font-bold text-white hover:bg-slate-800 transition cursor-pointer"
            >
              เข้าใจแล้ว
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed bottom-16 left-4 z-50 flex items-center gap-2 rounded-xl bg-amber-500 px-3.5 py-2 text-xs font-bold text-slate-950 shadow-lg border border-amber-300">
      <i className="fa-solid fa-wifi-slash"></i>
      <span>โหมดออฟไลน์ — ใช้งานข้อมูลที่บันทึกไว้ในเครื่องได้ตามปกติ</span>
    </div>
  );
};
