import React, { useState, useEffect, useRef } from "react";
import { useLang } from "../../context/LanguageContext";
import { useAuth } from "../../context/AuthContext";
import { userApi } from "../../api/userApi";

export default function AdminProfilePage() {
  const { lang, t } = useLang();
  const { user } = useAuth();
  const isRTL = lang === "AR";

  // ✅ REAL Data State
  const [profileData, setProfileData] = useState({
    username: "",
    email: "",
    bio: "",
    name: "",
  });

  const [isLoading, setIsLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  
  const [passwordData, setPasswordData] = useState({ current: "", newPass: "", confirm: "" });
  const [passwordSaved, setPasswordSaved] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  
  // ✅ Image upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
    setPasswordSaved(false);
    setPasswordError("");
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordSaved(false);
    setPasswordError("");

    // ✅ Frontend Validation
    if (passwordData.current === passwordData.newPass) {
      setPasswordError(t("admin.profile.errors.passwordSame"));
      return;
    }
    if (passwordData.newPass !== passwordData.confirm) {
      setPasswordError(t("admin.profile.errors.passwordMismatch"));
      return;
    }
    if (passwordData.newPass.length < 6) {
      setPasswordError(t("admin.profile.errors.passwordLength"));
      return;
    }

    setIsUpdatingPassword(true);
    try {
      const response = await userApi.profile.updatePassword({
        currentPassword: passwordData.current,
        newPassword: passwordData.newPass,
        confirmNewPassword: passwordData.confirm,
      });

      if (response.data.success) {
        setPasswordSaved(true);
        setPasswordData({ current: "", newPass: "", confirm: "" });
        setTimeout(() => setPasswordSaved(false), 3000);
      } else {
        setPasswordError(response.data.message || t("admin.profile.errors.passwordUpdateFailed"));
      }
    } catch (err: any) {
      console.error("Password update error:", err);
      setPasswordError(err.response?.data?.message || t("admin.profile.errors.passwordUpdateError"));
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const handleAvatarClick = () => fileInputRef.current?.click();
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await userApi.profile.getMyProfile();
        if (response.data.success && response.data.data) {
          const data = response.data.data;
          setProfileData({
            username: data.username || "",
            email: data.email || "",
            bio: data.bio || "",
            name: data.name || "",
          });
        }
      } catch (err) {
        console.error("Failed to fetch admin profile:", err);
        setErrorMsg(t("admin.profile.errors.loadFailed"));
      } finally {
        setIsLoading(false);
      }
    };
    fetchProfile();
  }, [t]);

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setProfileData({ ...profileData, [e.target.name]: e.target.value });
    setSaved(false);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(false);
    setErrorMsg("");

    try {
      const formData = new FormData();
      if (profileData.name) formData.append("name", profileData.name);
      if (profileData.bio) formData.append("bio", profileData.bio);
      if (selectedFile) formData.append("profile_picture", selectedFile);
      
      const response = await userApi.profile.updateMyProfile(formData);
      
      if (response.data.success) {
        setSaved(true);
        setSelectedFile(null);
        setTimeout(() => setSaved(false), 3000);
      } else {
        setErrorMsg(response.data.message || t("admin.profile.errors.profileUpdateFailed"));
      }
    } catch (err: any) {
      console.error("Save error:", err);
      setErrorMsg(err.response?.data?.message || t("admin.profile.errors.profileUpdateError"));
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fbf9f4]">
        <span className="material-symbols-outlined text-[40px] text-[#1e4d3a]/40 animate-pulse">hourglass_empty</span>
      </div>
    );
  }

  const userRole = ((user as any)?.role_name || "admin").toUpperCase();

  return (
    <div className="oulamauna-dashboard min-h-screen text-[#1e4d3a] antialiased font-['Inter']" dir={isRTL ? "rtl" : "ltr"}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&family=Source+Serif+4:wght@400;500;600;700&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap');
        .oulamauna-dashboard { background: radial-gradient(circle at 8% 10%, rgba(201,168,76,0.055), transparent 24%), radial-gradient(circle at 92% 16%, rgba(79,145,132,0.06), transparent 25%), #fbf9f4; }
        .oulamauna-dashboard * { box-sizing: border-box; }
        .oulamauna-dashboard .serif-title { font-family: 'Source Serif 4', Georgia, serif; letter-spacing: -0.025em; }
        .oulamauna-dashboard .mono-label { font-family: 'JetBrains Mono', monospace; letter-spacing: 0.06em; }
        .oulamauna-dashboard .dashboard-card { background: rgba(251,249,244,0.96); border: 1px solid rgba(30,77,58,0.10); border-radius: 10px; box-shadow: 0 5px 18px rgba(30,77,58,0.055); transition: box-shadow 180ms ease; }
        .oulamauna-dashboard .dashboard-card:hover { box-shadow: 0 9px 26px rgba(30,77,58,0.08); }
      `}</style>

      <main className="max-w-[1200px] mx-auto px-3 md:px-5 xl:px-7 py-6 md:py-8">
        
        {/* ── Page Header ── */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <span className="mono-label text-[9px] uppercase font-bold text-[#1e4d3a]/60">{t("admin.profile.breadcrumb")}</span>
          </div>
          <h1 className="serif-title text-[27px] md:text-[32px] leading-tight font-semibold text-[#082f27]">{t("admin.profile.title")}</h1>
          <p className="text-[13px] text-[#1e4d3a]/70 mt-1">{t("admin.profile.subtitle")}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6 items-start">
          
          {/* ── Left Column: Profile Summary Card ── */}
          <div className="dashboard-card p-6 flex flex-col items-center text-center">
            
            {/* ✅ Clean Clickable Avatar with Elegant Hover Overlay */}
            <div 
              onClick={handleAvatarClick}
              className="w-20 h-20 rounded-full bg-[#f6efdc] border-2 border-[#1e4d3a]/20 flex items-center justify-center font-['Source_Serif_4'] font-bold text-3xl text-[#1e4d3a] mb-4 overflow-hidden cursor-pointer relative flex-shrink-0 group"
            >
              {selectedFile ? (
                <img src={URL.createObjectURL(selectedFile)} alt="Preview" className="w-full h-full object-cover" />
              ) : (user as any)?.profile_picture || (user as any)?.avatar ? (
                <img src={(user as any).profile_picture || (user as any).avatar} alt="Avatar" className="w-full h-full object-cover" crossOrigin="anonymous" referrerPolicy="no-referrer" />
              ) : (
                (profileData.name || profileData.username || "U").charAt(0).toUpperCase()
              )}
              
              {/* Elegant Hover Overlay */}
              <div className="absolute inset-0 bg-[#082f27]/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-white">
                <span className="material-symbols-outlined text-[24px]">edit</span>
              </div>
            </div>

            {/* ✅ Hidden File Input */}
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />

            {selectedFile && (
              <p className="text-[11px] text-[#C9A84C] font-bold mb-3 -mt-1">
                {t("admin.profile.avatar.newImageSelected")}
              </p>
            )}

            <h2 className="serif-title text-[18px] font-semibold text-[#082f27] mb-1">{profileData.name || profileData.username}</h2>
            <span className="inline-flex items-center px-3 py-1 rounded-full bg-[#1e4d3a] text-white mono-label text-[10px] font-bold uppercase tracking-wider mb-5">
              {userRole === "ADMIN" ? t("admin.profile.role") : userRole}
            </span>
            
            <div className="w-full border-t border-[#1e4d3a]/10 pt-4 text-left">
              <div className="mb-4">
                <p className="mono-label text-[9px] uppercase font-bold text-[#1e4d3a]/60 mb-1">{t("admin.profile.personalInfo.emailLabel")}</p>
                <p className="text-[12px] font-medium text-[#082f27] break-all">{profileData.email}</p>
              </div>
              <div>
                <p className="mono-label text-[9px] uppercase font-bold text-[#1e4d3a]/60 mb-1">{t("admin.profile.personalInfo.usernameLabel")}</p>
                <p className="text-[12px] font-medium text-[#082f27]">@{profileData.username}</p>
              </div>
            </div>
          </div>

          {/* ── Right Column: Forms ── */}
          <div className="flex flex-col gap-6">
            
            {/* Form 1: Personal Information */}
            <div className="dashboard-card p-6">
              <h3 className="serif-title text-[18px] font-semibold text-[#082f27] mb-5 flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px]">person</span> {t("admin.profile.personalInfo.title")}
              </h3>
              
              {errorMsg && (
                <div className="bg-[#e96d5c]/10 text-[#e96d5c] p-3 rounded-[8px] text-[13px] mb-5 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px]">error</span> {errorMsg}
                </div>
              )}

              <form onSubmit={handleSaveProfile} className="flex flex-col gap-5">
                <div>
                  <label className="mono-label text-[10px] uppercase font-bold text-[#1e4d3a]/60 mb-1.5 block">{t("admin.profile.personalInfo.displayName")}</label>
                  <input 
                    type="text" name="name" value={profileData.name} onChange={handleProfileChange} 
                    className="w-full bg-[#fbf9f4] border border-[#1e4d3a]/15 rounded-[6px] px-3 py-2 text-[13px] font-medium text-[#1e4d3a] focus:outline-none focus:ring-2 focus:ring-[#1e4d3a]/20 transition-all" 
                    placeholder={t("admin.profile.personalInfo.displayNamePlaceholder")}
                  />
                </div>
                <div>
                  <label className="mono-label text-[10px] uppercase font-bold text-[#1e4d3a]/60 mb-1.5 block">{t("admin.profile.personalInfo.username")}</label>
                  <input 
                    type="text" name="username" value={profileData.username} disabled
                    className="w-full bg-[#f9f9f9] border border-[#1e4d3a]/15 rounded-[6px] px-3 py-2 text-[13px] font-medium text-[#1e4d3a] cursor-not-allowed opacity-70" 
                  />
                </div>
                <div>
                  <label className="mono-label text-[10px] uppercase font-bold text-[#1e4d3a]/60 mb-1.5 block">{t("admin.profile.personalInfo.email")}</label>
                  <input 
                    type="email" name="email" value={profileData.email} disabled
                    className="w-full bg-[#f9f9f9] border border-[#1e4d3a]/15 rounded-[6px] px-3 py-2 text-[13px] font-medium text-[#1e4d3a] cursor-not-allowed opacity-70" 
                  />
                </div>
                <div>
                  <label className="mono-label text-[10px] uppercase font-bold text-[#1e4d3a]/60 mb-1.5 block">{t("admin.profile.personalInfo.bio")}</label>
                  <textarea 
                    name="bio" value={profileData.bio} onChange={handleProfileChange} rows={4}
                    className="w-full bg-[#fbf9f4] border border-[#1e4d3a]/15 rounded-[6px] px-3 py-2 text-[13px] font-medium text-[#1e4d3a] focus:outline-none focus:ring-2 focus:ring-[#1e4d3a]/20 transition-all resize-vertical min-h-[80px]" 
                    placeholder={t("admin.profile.personalInfo.bioPlaceholder")}
                  />
                </div>

                <div className="flex justify-end mt-2">
                  <button 
                    type="submit" 
                    className={`inline-flex items-center justify-center gap-2 rounded-[8px] px-5 py-2.5 text-[11px] font-bold uppercase tracking-wide border transition-all duration-300 cursor-pointer ${
                      saved 
                        ? "bg-[#2f7d74] border-[#2f7d74] text-white" 
                        : "bg-[#1e4d3a] border-[#1e4d3a] text-white hover:bg-transparent hover:text-[#1e4d3a]"
                    }`}
                  >
                    <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: saved ? "'FILL' 1" : "'FILL' 0" }}>
                      {saved ? "check_circle" : "save"}
                    </span>
                    {saved ? t("admin.profile.personalInfo.saved") : t("admin.profile.personalInfo.saveChanges")}
                  </button>
                </div>
              </form>
            </div>

            {/* Form 2: Security & Password */}
            <div className="dashboard-card p-6">
              <h3 className="serif-title text-[18px] font-semibold text-[#082f27] mb-5 flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px]">lock</span> {t("admin.profile.security.title")}
              </h3>
              
              <form onSubmit={handleUpdatePassword} className="flex flex-col gap-5">
                {passwordError && (
                  <div className="bg-[#e96d5c]/10 text-[#e96d5c] p-3 rounded-[8px] text-[13px] flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px]">error</span> {passwordError}
                  </div>
                )}

                <div>
                  <label className="mono-label text-[10px] uppercase font-bold text-[#1e4d3a]/60 mb-1.5 block">{t("admin.profile.security.currentPassword")}</label>
                  <input 
                    type="password" name="current" value={passwordData.current} onChange={handlePasswordChange} 
                    className="w-full bg-[#fbf9f4] border border-[#1e4d3a]/15 rounded-[6px] px-3 py-2 text-[13px] font-medium text-[#1e4d3a] focus:outline-none focus:ring-2 focus:ring-[#1e4d3a]/20 transition-all" 
                    placeholder={t("admin.profile.security.currentPasswordPlaceholder")} required
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="mono-label text-[10px] uppercase font-bold text-[#1e4d3a]/60 mb-1.5 block">{t("admin.profile.security.newPassword")}</label>
                    <input 
                      type="password" name="newPass" value={passwordData.newPass} onChange={handlePasswordChange} 
                      className="w-full bg-[#fbf9f4] border border-[#1e4d3a]/15 rounded-[6px] px-3 py-2 text-[13px] font-medium text-[#1e4d3a] focus:outline-none focus:ring-2 focus:ring-[#1e4d3a]/20 transition-all" 
                      placeholder={t("admin.profile.security.currentPasswordPlaceholder")} required
                    />
                  </div>
                  <div>
                    <label className="mono-label text-[10px] uppercase font-bold text-[#1e4d3a]/60 mb-1.5 block">{t("admin.profile.security.confirmNewPassword")}</label>
                    <input 
                      type="password" name="confirm" value={passwordData.confirm} onChange={handlePasswordChange} 
                      className="w-full bg-[#fbf9f4] border border-[#1e4d3a]/15 rounded-[6px] px-3 py-2 text-[13px] font-medium text-[#1e4d3a] focus:outline-none focus:ring-2 focus:ring-[#1e4d3a]/20 transition-all" 
                      placeholder={t("admin.profile.security.currentPasswordPlaceholder")} required
                    />
                  </div>
                </div>

                <div className="flex justify-end mt-2">
                  <button 
                    type="submit"
                    disabled={isUpdatingPassword}
                    className={`inline-flex items-center justify-center gap-2 rounded-[8px] px-5 py-2.5 text-[11px] font-bold uppercase tracking-wide border transition-all duration-300 cursor-pointer ${
                      passwordSaved 
                        ? "bg-[#2f7d74] border-[#2f7d74] text-white" 
                        : "bg-[#1e4d3a] border-[#1e4d3a] text-white hover:bg-transparent hover:text-[#1e4d3a] disabled:bg-[#1e4d3a]/70 disabled:border-[#1e4d3a]/70 disabled:text-white disabled:cursor-wait disabled:hover:bg-[#1e4d3a]/70 disabled:hover:text-white"
                    }`}
                  >
                    <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: passwordSaved ? "'FILL' 1" : "'FILL' 0" }}>
                      {passwordSaved ? "check_circle" : "lock_reset"}
                    </span>
                    {isUpdatingPassword ? t("admin.profile.security.updating") : passwordSaved ? t("admin.profile.security.updated") : t("admin.profile.security.updatePassword")}
                  </button>
                </div>
              </form>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}