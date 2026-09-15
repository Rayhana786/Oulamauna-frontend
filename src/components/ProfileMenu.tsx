// src/components/ProfileMenu.tsx
import React, { useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { LayoutDashboard, Edit, Settings, LogOut } from "lucide-react";
import { useLang } from "../context/LanguageContext";
import { useAuth } from "../context/AuthContext"; // ✅ Imported useAuth

interface ProfileMenuProps {
  onClose: () => void;
  isOpen: boolean;
  onToggle: () => void;
  userImage?: string;
  userName?: string;
  userEmail?: string;
}

const ProfileMenu: React.FC<ProfileMenuProps> = ({
  onClose,
  isOpen,
  onToggle,
  userImage,
  userName = "User Name",
  userEmail = "user@oulamauna.org",
}) => {
  const { lang, t } = useLang();
  const { logout } = useAuth(); // ✅ Get the real logout function
  const isRTL = lang === "AR";
  const wrapperRef = useRef<HTMLDivElement>(null);

  const initials = userName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  const menuItems = [
    { to: "/dashboard",    icon: LayoutDashboard, label: t("profileMenu.dashboard") },
    { to: "/edit-profile", icon: Edit,            label: t("profileMenu.editProfile") },
    { to: "/settings",     icon: Settings,        label: t("profileMenu.settings") },
  ];

  const Avatar = ({ size = 36 }: { size?: number }) => (
    <div
      className="rounded-full overflow-hidden flex items-center justify-center flex-shrink-0"
      style={{
        width: size,
        height: size,
        background: userImage
          ? undefined
          : "linear-gradient(135deg, var(--color-jade-medium), var(--color-jade-dark))",
      }}
    >
      {userImage ? (
        <img src={userImage} alt={userName} className="w-full h-full object-cover rounded-full" />
      ) : (
        <span
          className="font-bold select-none"
          style={{ fontSize: size * 0.3, color: "var(--color-gold-rich)", letterSpacing: "0.05em" }}
        >
          {initials}
        </span>
      )}
    </div>
  );

  return (
    <div className="relative" ref={wrapperRef} dir={isRTL ? "rtl" : "ltr"}>
      {/* ── TRIGGER ── */}
      <button
        onClick={onToggle}
        aria-expanded={isOpen}
        aria-label={t("profileMenu.ariaLabel")}
        className="flex items-center gap-2 focus:outline-none group"
      >
        <div
          className="rounded-full transition-all duration-200"
          style={{
            padding: "2px",
            border: `2px solid ${
              isOpen
                ? "var(--color-gold-rich)"
                : "color-mix(in srgb, var(--color-gold-beige) 35%, transparent)"
            }`,
          }}
        >
          <Avatar size={32} />
        </div>

        <svg
          width="10" height="10" viewBox="0 0 24 24"
          fill="none" stroke="currentColor" strokeWidth="2"
          className={`transition-all duration-200 ${isOpen ? "rotate-180" : ""}`}
          style={{ color: isOpen ? "var(--color-gold-rich)" : "var(--color-gold-light)" }}
        >
          <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {/* ── DROPDOWN ── */}
      {isOpen && (
        <div className="absolute top-full end-0 mt-2 w-52 z-[120]">
          <div
            className="rounded-xl overflow-hidden"
            style={{
              background: "var(--color-jade-dark)",
              border: `1px solid color-mix(in srgb, var(--color-gold-beige) 30%, transparent)`,
              boxShadow: "0 12px 40px rgba(40, 91, 75, 0.5)",
            }}
          >
            <div className="h-px w-full" style={{ background: "var(--color-gold-rich)", opacity: 0.6 }} />

            {/* ── Header ─ */}
            <div 
              className="flex items-center gap-3 px-5 py-4"
              style={{ borderBottom: `1px solid color-mix(in srgb, var(--color-gold-light) 15%, transparent)` }}
            >
              <div className="rounded-full p-[3px] flex-shrink-0" style={{ border: `1.5px solid color-mix(in srgb, var(--color-gold-rich) 50%, transparent)` }}>
                <Avatar size={36} />
              </div>
              <div className="min-w-0">
                <p className="text-[12px] font-semibold truncate" style={{ color: "var(--color-gold-beige)" }}>
                  {userName}
                </p>
                <p className="text-[10px] mt-0.5 truncate" style={{ color: "var(--color-jade-medium)" }}>
                  {userEmail}
                </p>
              </div>
            </div>

            {/* ── Menu Items ─ */}
            <div className="py-1">
              {menuItems.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={onClose}
                  className={`flex items-center gap-3 px-5 py-2.5 w-full transition-all duration-150 ${isRTL ? "text-[13px]" : "text-[11.5px]"}`}
                  style={{ color: "var(--color-gold-light)" }}
                  onMouseEnter={e => {
                    const el = e.currentTarget as HTMLElement;
                    el.style.color = "var(--color-gold-rich)";
                    el.style.background = "color-mix(in srgb, var(--color-gold-beige) 6%, transparent)";
                    el.style.paddingLeft = isRTL ? "14px" : "18px";
                  }}
                  onMouseLeave={e => {
                    const el = e.currentTarget as HTMLElement;
                    el.style.color = "var(--color-gold-light)";
                    el.style.background = "transparent";
                    el.style.paddingLeft = isRTL ? "20px" : "20px";
                  }}
                >
                  <item.icon size={15} strokeWidth={1.5} />
                  {item.label}
                </Link>
              ))}
            </div>

            <div className="mx-5 my-1 h-px" style={{ background: "color-mix(in srgb, var(--color-gold-light) 15%, transparent)" }} />

            {/* ── Logout ─ */}
            <div className="p-1">
              <button
                // ✅ Calls the real logout function, then closes the menu
                onClick={() => { logout(); onClose(); }}
                className={`flex items-center gap-3 px-5 py-2.5 w-full rounded-lg transition-all duration-150 ${isRTL ? "text-[13px]" : "text-[11.5px]"}`}
                style={{ color: "var(--color-gold-light)" }}
                onMouseEnter={e => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.color = "var(--color-gold-rich)";
                  el.style.background = "color-mix(in srgb, var(--color-gold-beige) 6%, transparent)";
                  el.style.paddingLeft = isRTL ? "14px" : "18px";
                }}
                onMouseLeave={e => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.color = "var(--color-gold-light)";
                  el.style.background = "transparent";
                  el.style.paddingLeft = isRTL ? "20px" : "20px";
                }}
              >
                <LogOut size={15} strokeWidth={1.5} />
                {t("profileMenu.logout")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileMenu;