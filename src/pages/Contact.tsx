import React, { useState } from "react";
import { useLang } from "../context/LanguageContext";
type Language = "EN" | "AR" | "FR";

interface ContactProps {
  lang?: Language;
}

const ContactPage: React.FC<ContactProps> = () => {
  const { lang } = useLang();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<{ name?: string; email?: string; message?: string }>({});
  const [submitted, setSubmitted] = useState(false);
  const [sent, setSent] = useState(false);

  const content: Record<Language, any> = {
    EN: {
      title: "Contact Us",
      subtitle: "تواصل معنا",
      description: "Have questions, suggestions, or want to contribute? We'd love to hear from you.",
      info: [
        { label: "EMAIL", val: "contact@oulamauna.org" },
        { label: "LOCATION", val: "Algeria" },
        { label: "PHONE", val: "+213 (0) 000 000 000" }
      ],
      formTitle: "Send a Message",
      labels: { name: "NAME", email: "EMAIL", message: "MESSAGE", btn: "SEND MESSAGE" },
      placeholders: { name: "Full name", email: "example@mail.com", message: "How can we help?" },
      errors: {
        nameEmpty: "Please enter your name.",
        emailEmpty: "Please enter your email address.",
        emailInvalid: "Please enter a valid email address.",
        messageEmpty: "Please write your message.",
        messageshort: "Message must be at least 10 characters.",
      },
      sentTitle: "Message Sent!",
      sentSubtitle: "Thank you for reaching out. We'll get back to you as soon as possible.",
      sentBack: "SEND ANOTHER MESSAGE",
    },
    AR: {
      title: "تواصل معنا",
      subtitle: "Contact Us",
      description: "هل لديك أسئلة أو اقتراحات أو ترغب في المساهمة؟ يسعدنا التواصل معك.",
      info: [
        { label: "البريد الإلكتروني", val: "contact@oulamauna.org" },
        { label: "الموقع", val: "الجزائر" },
        { label: "الهاتف", val: "000 000 000 (0) 213+" }
      ],
      formTitle: "أرسل رسالة",
      labels: { name: "الاسم", email: "البريد الإلكتروني", message: "الرسالة", btn: "إرسال الرسالة" },
      placeholders: { name: "الاسم الكامل", email: "example@mail.com", message: "كيف يمكننا مساعدتك؟" },
      errors: {
        nameEmpty: "الرجاء إدخال اسمك.",
        emailEmpty: "الرجاء إدخال عنوان بريدك الإلكتروني.",
        emailInvalid: "الرجاء إدخال عنوان بريد صحيح.",
        messageEmpty: "الرجاء كتابة رسالتك.",
        messageshort: "يجب أن تحتوي الرسالة على 10 أحرف على الأقل.",
      },
      sentTitle: "تم إرسال رسالتك!",
      sentSubtitle: "شكراً للتواصل معنا. سنرد عليك في أقرب وقت ممكن.",
      sentBack: "إرسال رسالة أخرى",
    },
    FR: {
      title: "Contactez-nous",
      subtitle: "تواصل معنا",
      description: "Des questions, des suggestions ou vous souhaitez contribuer ? Nous serions ravis de vous entendre.",
      info: [
        { label: "E-MAIL", val: "contact@oulamauna.org" },
        { label: "LIEU", val: "Algérie" },
        { label: "TÉLÉPHONE", val: "+213 (0) 000 000 000" }
      ],
      formTitle: "Envoyer un message",
      labels: { name: "NOM", email: "E-MAIL", message: "MESSAGE", btn: "ENVOYER" },
      placeholders: { name: "Nom complet", email: "exemple@mail.com", message: "Comment pouvons-nous vous aider ?" },
      errors: {
        nameEmpty: "Veuillez entrer votre nom.",
        emailEmpty: "Veuillez entrer votre adresse e-mail.",
        emailInvalid: "Veuillez entrer une adresse e-mail valide.",
        messageEmpty: "Veuillez écrire votre message.",
        messageshort: "Le message doit contenir au moins 10 caractères.",
      },
      sentTitle: "Message envoyé !",
      sentSubtitle: "Merci de nous avoir contactés. Nous vous répondrons dans les plus brefs délais.",
      sentBack: "ENVOYER UN AUTRE MESSAGE",
    }
  };

  const t = content[lang];
  const isRTL = lang === "AR";

  const validate = () => {
    const newErrors: { name?: string; email?: string; message?: string } = {};
    if (!name.trim()) newErrors.name = t.errors.nameEmpty;
    if (!email.trim()) newErrors.email = t.errors.emailEmpty;
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) newErrors.email = t.errors.emailInvalid;
    if (!message.trim()) newErrors.message = t.errors.messageEmpty;
    else if (message.trim().length < 10) newErrors.message = t.errors.messageshort;
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    if (validate()) {
      setSent(true);
      // TODO: call your API here
    }
  };

  const handleReset = () => {
    setName(""); setEmail(""); setMessage("");
    setErrors({}); setSubmitted(false); setSent(false);
  };

  const ErrorMsg = ({ msg }: { msg: string }) => (
    <p className="text-red-500 text-[11px] mt-1 flex items-center gap-1">
      <svg className="w-3 h-3 shrink-0" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
      </svg>
      {msg}
    </p>
  );

  const Icons = {
    Email: () => (
      <svg className="w-6 h-6 text-[#7DA89B] transition-colors duration-200 group-hover:text-[#C9A84C]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
    Location: () => (
      <svg className="w-6 h-6 text-[#7DA89B] transition-colors duration-200 group-hover:text-[#C9A84C]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    Phone: () => (
      <svg className="w-6 h-6 text-[#7DA89B] transition-colors duration-200 group-hover:text-[#C9A84C]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
      </svg>
    ),
    Send: () => (
      <svg className={`w-4 h-4 ${isRTL ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
      </svg>
    )
  };

  const inputClass = (hasError: boolean) =>
    `w-full bg-gray-50 border rounded-xl px-4 py-3.5 text-sm outline-none transition-all duration-200 hover:border-[#C9A84C]/50 focus:border-[#C9A84C] ${hasError ? "border-red-300 bg-red-50/30" : "border-transparent"}`;

  return (
    <div className={`w-full min-h-screen bg-white ${isRTL ? 'text-right' : 'text-left'}`} dir={isRTL ? 'rtl' : 'ltr'}>

      
     

      {/* --- SECTION 2: WHITE CONTENT AREA --- */}
      <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-24 pt-12 pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">

          {/* Info Cards */}
          <div className="flex flex-col gap-5">
            {t.info.map((item: any, i: number) => (
              <div key={i} className="flex items-center gap-5 p-6 bg-white border border-gray-100 rounded-2xl shadow-lg shadow-gray-100/60 hover:shadow-xl hover:border-[#C9A84C]/30 transition-all duration-300 group">
                <div className="w-12 h-12 bg-[#7DA89B]/10 rounded-xl flex items-center justify-center group-hover:bg-[#C9A84C]/10 transition-colors duration-200">
                  {i === 0 ? <Icons.Email /> : i === 1 ? <Icons.Location /> : <Icons.Phone />}
                </div>
                <div>
                  <p className="text-[9px] tracking-[0.2em] text-[#B8B09A] font-black uppercase mb-0.5">{item.label}</p>
                  <p className="text-[#285B4B] text-sm font-bold">{item.val}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Message Form */}
          <div className="lg:col-span-2 bg-white border border-gray-100 rounded-[32px] p-8 md:p-12 shadow-xl shadow-gray-100/80">

            {sent ? (
              /* ── SUCCESS STATE ── */
              <div className="flex flex-col items-center justify-center text-center h-full py-8">
                <div className="w-16 h-16 rounded-2xl bg-[#285B4B]/8 flex items-center justify-center mb-5">
                  <svg className="w-8 h-8 text-[#285B4B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-2xl font-serif italic text-[#285B4B] mb-2">{t.sentTitle}</h3>
                <p className="text-[#B8B09A] text-sm leading-relaxed max-w-sm mb-8">{t.sentSubtitle}</p>
                <button
                  onClick={handleReset}
                  className="bg-[#285B4B] text-white px-10 py-4 rounded-full text-[10px] font-black tracking-[0.3em] uppercase hover:bg-[#C9A84C] transition-all shadow-lg active:scale-95"
                >
                  {t.sentBack}
                </button>
              </div>

            ) : (
              /* ── FORM STATE ── */
              <>
                <h3 className="text-2xl font-serif italic text-[#285B4B] mb-8">{t.formTitle}</h3>

                <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                    {/* Name */}
                    <div className="space-y-1">
                      <label className="text-[10px] tracking-widest text-[#B8B09A] font-bold uppercase">{t.labels.name}</label>
                      <input
                        type="text"
                        value={name}
                        onChange={e => { setName(e.target.value); if (submitted) setErrors(prev => ({ ...prev, name: undefined })); }}
                        placeholder={t.placeholders.name}
                        className={inputClass(!!errors.name)}
                      />
                      {errors.name && <ErrorMsg msg={errors.name} />}
                    </div>

                    {/* Email */}
                    <div className="space-y-1">
                      <label className="text-[10px] tracking-widest text-[#B8B09A] font-bold uppercase">{t.labels.email}</label>
                      <input
                        type="email"
                        value={email}
                        onChange={e => { setEmail(e.target.value); if (submitted) setErrors(prev => ({ ...prev, email: undefined })); }}
                        placeholder={t.placeholders.email}
                        className={inputClass(!!errors.email)}
                      />
                      {errors.email && <ErrorMsg msg={errors.email} />}
                    </div>
                  </div>

                  {/* Message */}
                  <div className="space-y-1">
                    <label className="text-[10px] tracking-widest text-[#B8B09A] font-bold uppercase">{t.labels.message}</label>
                    <textarea
                      rows={4}
                      value={message}
                      onChange={e => { setMessage(e.target.value); if (submitted) setErrors(prev => ({ ...prev, message: undefined })); }}
                      placeholder={t.placeholders.message}
                      className={`${inputClass(!!errors.message)} resize-none`}
                    />
                    {errors.message && <ErrorMsg msg={errors.message} />}
                  </div>

                  <button
                    type="submit"
                    className="bg-[#285B4B] text-white px-10 py-4 rounded-full text-[10px] font-black tracking-[0.3em] uppercase hover:bg-[#C9A84C] transition-all flex items-center gap-3 shadow-lg active:scale-95"
                  >
                    <Icons.Send />
                    {t.labels.btn}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactPage;