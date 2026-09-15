import React, { useState, useRef, useEffect } from "react";
import { scholarsApi } from "../api/scholarsApi";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import TextAlign from "@tiptap/extension-text-align";
import { Color, TextStyle } from "@tiptap/extension-text-style";
import Underline from "@tiptap/extension-underline";
import Superscript from "@tiptap/extension-superscript";
import Highlight from "@tiptap/extension-highlight";
import Placeholder from "@tiptap/extension-placeholder";

const MONO = "'JetBrains Mono', monospace";
const SERIF = "'Source Serif 4', 'Georgia', serif";
const SANS = "'Inter', system-ui, sans-serif";
const HANKEN = "'Hanken Grotesk', sans-serif";
const GREEN = "#1e4d3a";
const GREEN_DARK = "#285b4b";
const GREEN_LIGHT = "rgba(30,77,58,0.08)";
const GREEN_BORDER = "rgba(30,77,58,0.25)";
const BORDER = "rgba(192,201,195,0.5)";
const MUTED = "#707974";
const DANGER = "#b3261e";
const DANGER_BORDER = "rgba(179,38,30,0.35)";
const GOLD = "#C9A84C";
const GOLD_LIGHT = "rgba(201,168,76,0.1)";

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "14px 16px", border: `1.5px solid ${BORDER}`, borderRadius: "10px", fontSize: "14px", color: "#191c1b", backgroundColor: "#fff", fontFamily: SANS, outline: "none", transition: "all 0.2s ease"
};

const labelStyle: React.CSSProperties = { fontFamily: MONO, fontSize: "10px", color: MUTED, letterSpacing: "0.08em", display: "block", marginBottom: "8px", textTransform: "uppercase" as const, fontWeight: 600 };

function Icon({ name, size = 20 }: { name: string; size?: number }) {
  return <span className="material-symbols-outlined" style={{ fontSize: `${size}px`, lineHeight: 1, verticalAlign: "middle", userSelect: "none" }}>{name}</span>;
}

interface ScholarSearchResult {
  id: number;
  name: string;
  discipline: string;
  born: string | number;
}

function EditorLinkMenu({
  lang,
  selectedText,
  existingHref,
  existingTarget,
  onApplyExternal,
  onApplyInternal,
  onRemove,
  onClose,
}: {
  lang: string;
  selectedText: string;
  existingHref?: string;
  existingTarget?: string;
  onApplyExternal: (
    url: string,
    text: string,
    newTab: boolean
  ) => void;
  onApplyInternal: (
    scholarId: number,
    scholarName: string,
    text: string
  ) => void;
  onRemove?: () => void;
  onClose: () => void;
}) {
  const [mode, setMode] = useState<"external" | "internal">(
    existingHref?.startsWith("/scholars/")
      ? "internal"
      : "external"
  );

  const [url, setUrl] = useState(
    existingHref && !existingHref.startsWith("/scholars/")
      ? existingHref
      : ""
  );

  const [linkText, setLinkText] = useState(selectedText);
  const [newTab, setNewTab] = useState(existingTarget === "_blank");

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ScholarSearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  const onSearchInput = async (q: string) => {
    setQuery(q);

    if (q.trim().length < 2) {
      setResults([]);
      return;
    }

    setLoading(true);

    try {
      // SAME endpoint already used by Teacher / Student.
      const res = await scholarsApi.searchByName(q.trim(), lang);

      const mapped: ScholarSearchResult[] =
        (res.data?.scholar_versions?.map((v: any) => ({
          id: v.version_id,
          name: v.canonical_name,
          discipline:
            v.scholar_disciplines?.[0]?.disciplines?.name ||
            "Unknown",
          born:
            v.scholar_dates?.find(
              (d: any) => d.date_type === "birth"
            )?.year || "Unknown",
        })) || []) as ScholarSearchResult[];

      setResults(mapped);
    } catch (error) {
      console.error("Scholar search error:", error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const tabStyle = (
    active: boolean
  ): React.CSSProperties => ({
    flex: 1,
    padding: "9px 0",
    border: "none",
    cursor: "pointer",
    fontFamily: MONO,
    fontSize: "9px",
    fontWeight: 700,
    letterSpacing: "0.05em",
    background: active ? GREEN : "transparent",
    color: active ? "#fff" : MUTED,
  });

  return (
    <div
      ref={ref}
      style={{
        position: "absolute",
        top: "calc(100% + 8px)",
        right: 0,
        left: "auto",
        zIndex: 300,
        width: "340px",
        maxWidth: "min(340px, calc(100vw - 40px))",
        background: "#fff",
        border: `1.5px solid ${GREEN_BORDER}`,
        borderRadius: "12px",
        boxShadow: "0 12px 40px rgba(11,67,53,0.18)",
        padding: "14px",
      }}
    >
      <div
        style={{
          display: "flex",
          border: `1.5px solid ${BORDER}`,
          borderRadius: "8px",
          overflow: "hidden",
          marginBottom: "14px",
        }}
      >
        <button
          type="button"
          onClick={() => setMode("external")}
          style={tabStyle(mode === "external")}
        >
          EXTERNAL LINK
        </button>

        <button
          type="button"
          onClick={() => setMode("internal")}
          style={{
            ...tabStyle(mode === "internal"),
            borderLeft: `1px solid ${BORDER}`,
          }}
        >
          SCHOLAR LINK
        </button>
      </div>

      {mode === "external" && (
        <div>
          <label style={labelStyle}>URL</label>

          <input
            autoFocus
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com"
            style={{
              ...inputStyle,
              padding: "9px 10px",
              fontSize: "13px",
              marginBottom: "10px",
            }}
          />

          <label style={labelStyle}>LINK TEXT</label>

          <input
            type="text"
            value={linkText}
            onChange={(e) => setLinkText(e.target.value)}
            placeholder="Text to display"
            style={{
              ...inputStyle,
              padding: "9px 10px",
              fontSize: "13px",
              marginBottom: "10px",
            }}
          />

          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              fontSize: "12px",
              color: "#404945",
              cursor: "pointer",
              marginBottom: "14px",
            }}
          >
            <input
              type="checkbox"
              checked={newTab}
              onChange={(e) => setNewTab(e.target.checked)}
            />
            Open in new tab
          </label>

          <div style={{ display: "flex", gap: "8px" }}>
            {onRemove && existingHref && (
              <button
                type="button"
                onClick={onRemove}
                style={{
                  padding: "9px 12px",
                  border: `1.5px solid ${DANGER_BORDER}`,
                  borderRadius: "8px",
                  background: "transparent",
                  color: DANGER,
                  fontFamily: HANKEN,
                  fontSize: "10px",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                REMOVE
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                if (!url.trim()) return;

                onApplyExternal(
                  url.trim(),
                  linkText.trim() || selectedText || url.trim(),
                  newTab
                );
              }}
              style={{
                flex: 1,
                padding: "9px 14px",
                border: `2px solid ${GREEN}`,
                borderRadius: "8px",
                background: GREEN,
                color: "#fff",
                fontFamily: HANKEN,
                fontSize: "10px",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              {existingHref ? "UPDATE LINK" : "INSERT LINK"}
            </button>
          </div>
        </div>
      )}

      {mode === "internal" && (
        <div>
          <label style={labelStyle}>SEARCH SCHOLAR</label>

          <input
            autoFocus
            type="text"
            value={query}
            onChange={(e) => onSearchInput(e.target.value)}
            placeholder="Search scholar by name..."
            style={{
              ...inputStyle,
              padding: "9px 10px",
              fontSize: "13px",
              marginBottom: "8px",
            }}
          />

          <div style={{ maxHeight: "190px", overflowY: "auto" }}>
            {loading ? (
              <div
                style={{
                  padding: "12px 6px",
                  fontSize: "12px",
                  color: MUTED,
                  fontStyle: "italic",
                }}
              >
                Searching...
              </div>
            ) : results.length === 0 ? (
              query.trim().length >= 2 ? (
                <div
                  style={{
                    padding: "12px 6px",
                    fontSize: "12px",
                    color: MUTED,
                    fontStyle: "italic",
                  }}
                >
                  No scholars found
                </div>
              ) : (
                <div
                  style={{
                    padding: "10px 6px",
                    fontSize: "11px",
                    color: MUTED,
                  }}
                >
                  Type at least 2 characters.
                </div>
              )
            ) : (
              results.map((s: ScholarSearchResult) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => {
                    onApplyInternal(
                      s.id,
                      s.name,
                      linkText.trim() || selectedText || s.name
                    );
                  }}
                  style={{
                    width: "100%",
                    textAlign: "left",
                    padding: "10px",
                    border: "none",
                    borderBottom: `1px solid ${BORDER}`,
                    background: "transparent",
                    cursor: "pointer",
                    borderRadius: "6px",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = GREEN_LIGHT;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "transparent";
                  }}
                >
                  <div
                    style={{
                      fontSize: "13px",
                      fontWeight: 700,
                      color: "#191c1b",
                    }}
                  >
                    {s.name}
                  </div>

                  <div
                    style={{
                      fontFamily: MONO,
                      fontSize: "9px",
                      color: MUTED,
                      marginTop: "3px",
                    }}
                  >
                    {s.discipline} · b.{s.born}
                  </div>
                </button>
              ))
            )}
          </div>

          {onRemove && existingHref && (
            <button
              type="button"
              onClick={onRemove}
              style={{
                width: "100%",
                marginTop: "10px",
                padding: "8px",
                border: `1.5px solid ${DANGER_BORDER}`,
                borderRadius: "8px",
                background: "transparent",
                color: DANGER,
                fontFamily: HANKEN,
                fontSize: "10px",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              REMOVE LINK
            </button>
          )}
        </div>
      )}
    </div>
  );
}
const TEXT_COLOR_PRESETS = ["#191c1b", "#ffffff", GREEN, GOLD, DANGER, "#2563eb"];
const HIGHLIGHT_COLOR_PRESETS = ["#fff3a3", "#c9f2c7", "#ffd6e0", "#bfe3ff", GOLD_LIGHT.includes("rgba") ? "#f3e3b8" : GOLD_LIGHT];

function ColorPickerPopover({
  label,
  value,
  presets,
  onChange,
  onClose,
}: {
  label: string;
  value: string;
  presets: string[];
  onChange: (color: string) => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const customInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  return (
    <div
      ref={ref}
      style={{
        position: "absolute",
        top: "calc(100% + 8px)",
        right: 0,
        zIndex: 300,
        width: "216px",
        maxWidth: "calc(100vw - 40px)",
        background: "#fff",
        border: `1.5px solid ${GREEN_BORDER}`,
        borderRadius: "12px",
        boxShadow: "0 12px 40px rgba(11,67,53,0.18)",
        padding: "14px",
      }}
    >
      <label style={labelStyle}>{label}</label>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginTop: "10px" }}>
        {presets.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => { onChange(c); onClose(); }}
            title={c}
            style={{
              width: "28px",
              height: "28px",
              borderRadius: "50%",
              border: value.toLowerCase() === c.toLowerCase() ? `2.5px solid ${GREEN}` : `1.5px solid ${BORDER}`,
              background: c,
              cursor: "pointer",
              padding: 0,
              flexShrink: 0,
            }}
          />
        ))}
        <button
          type="button"
          onClick={() => customInputRef.current?.click()}
          title="Custom color"
          style={{
            width: "28px",
            height: "28px",
            borderRadius: "50%",
            border: `1.5px solid ${BORDER}`,
            background: "conic-gradient(red, yellow, lime, cyan, blue, magenta, red)",
            cursor: "pointer",
            padding: 0,
            flexShrink: 0,
          }}
        />
      </div>
      <input
        ref={customInputRef}
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{ position: "absolute", width: 0, height: 0, opacity: 0, pointerEvents: "none" }}
      />
    </div>
  );
}
/* ─────────────────────────────────────────────
   BIOGRAPHY RICH TEXT EDITOR

   Important fixes:
   - Bold / Italic / Underline work from an empty cursor.
   - Clicking Bold/Italic/Underline toggles the typing mode.
   - Ordered lists explicitly show 1, 2, 3.
   - Links are inserted as Tiptap marks, not raw HTML.
   - Link clicks are handled once (no double-opening).
───────────────────────────────────────────── */

const RichTextEditor = ({
  value,
  onChange,
  placeholder,
  lang,
}: {
  value: string;
  onChange: (val: string) => void;
  placeholder: string;
  lang: string;
}) => {
  const [toolbarVersion, setToolbarVersion] = useState(0);
  const [showLinkMenu, setShowLinkMenu] = useState(false);
  const [showColorMenu, setShowColorMenu] = useState(false);
  const [showHighlightMenu, setShowHighlightMenu] = useState(false);

  const [direction, setDirection] = useState<"ltr" | "rtl">(
    lang.toLowerCase() === "ar" ? "rtl" : "ltr"
  );

  const linkButtonRef = useRef<HTMLDivElement>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1,2, 3],
        },
      }),

      TextStyle,
      Color,
      Underline,
       Superscript,

      Highlight.configure({
        multicolor: true,
      }),

      TextAlign.configure({
        types: ["heading", "paragraph"],
        alignments: ["left", "center", "right", "justify"],
      }),

      Placeholder.configure({
        placeholder,
        emptyEditorClass: "is-editor-empty",
      }),

    Link.configure({
  openOnClick: false,
  autolink: true,
  linkOnPaste: true,

  HTMLAttributes: {
    class: "biography-link",
  },
}),
    ],

    content: value || "",

    editorProps: {
      attributes: {
        class: "oulamauna-biography-editor",
        dir: direction,
        spellcheck: "true",
      },

      handleClick: (_view, _pos, event) => {
        const target = event.target as HTMLElement;
        const anchor = target.closest("a");

        if (!anchor) return false;

        const href = anchor.getAttribute("href");
        if (!href) return false;

        const targetName = anchor.getAttribute("target");

        if (targetName === "_blank") {
          window.open(href, "_blank", "noopener,noreferrer");
        } else {
          window.location.assign(href);
        }

        return true;
      },
    },

    onCreate: ({ editor }) => {
      editor.view.dom.setAttribute("dir", direction);
    },

    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  useEffect(() => {
    if (!editor) return;

    if (!editor.isFocused && value !== editor.getHTML()) {
      editor.commands.setContent(value || "", {
        emitUpdate: false,
      });
    }
  }, [value, editor]);

  useEffect(() => {
    if (!editor) return;

    editor.view.dom.setAttribute("dir", direction);
  }, [direction, editor]);

  useEffect(() => {
    const handler = (event: MouseEvent) => {
      if (
        linkButtonRef.current &&
        !linkButtonRef.current.contains(event.target as Node)
      ) {
        setShowLinkMenu(false);
      }
    };

    document.addEventListener("mousedown", handler);

    return () => {
      document.removeEventListener("mousedown", handler);
    };
  }, []);
    useEffect(() => {
  if (!editor) return;

  const refreshToolbar = () => {
    // Force React to refresh the toolbar immediately
    setToolbarVersion((v) => v + 1);
  };

  editor.on("transaction", refreshToolbar);
  editor.on("selectionUpdate", refreshToolbar);

  return () => {
    editor.off("transaction", refreshToolbar);
    editor.off("selectionUpdate", refreshToolbar);
  };
}, [editor]);

  if (!editor) return null;


  const buttonStyle = (active: boolean): React.CSSProperties => ({
    background: active ? GREEN_LIGHT : "transparent",
    border: "none",
    cursor: "pointer",
    padding: "7px 9px",
    minWidth: "34px",
    height: "34px",
    borderRadius: "6px",
    color: active ? GREEN : "#404945",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all 0.15s",
    fontWeight: active ? 700 : 400,
    flexShrink: 0,
  });

  /*
   * IMPORTANT:
   * We use onMouseDown + preventDefault so clicking the toolbar
   * does NOT destroy the editor cursor/selection.
   *
   * This is what lets:
   *   click B -> start typing bold
   *   click B again -> continue typing normally
   */
  const toolbarButton = (
    title: string,
    active: boolean,
    icon: React.ReactNode,
    onClick: () => void,
    disabled = false
  ) => (
    <button
      type="button"
      title={title}
      aria-label={title}
      disabled={disabled}
      style={{
        ...buttonStyle(active),
        opacity: disabled ? 0.35 : 1,
        cursor: disabled ? "not-allowed" : "pointer",
      }}
      onMouseDown={(e) => {
        e.preventDefault();

        if (!disabled) {
          onClick();
        }
      }}
    >
      {icon}
    </button>
  );

  /*
   * This helper is deliberately used for inline formatting.
   * toggleBold/toggleItalic/toggleUnderline all work with:
   *   - selected text
   *   - an empty cursor
   *   - future text typed after clicking the button
   */
  const toggleBold = () => {
    editor.chain().focus().toggleBold().run();
  };

  const toggleItalic = () => {
    editor.chain().focus().toggleItalic().run();
  };

  const toggleUnderline = () => {
    editor.chain().focus().toggleUnderline().run();
  };

  const currentLink = editor.getAttributes("link");

  const selectedText = editor.state.doc.textBetween(
    editor.state.selection.from,
    editor.state.selection.to,
    " "
  );

  const openLinkMenu = () => {
    /*
     * If the cursor is already inside a link, expand the selection
     * to the whole link before opening the menu.
     *
     * This makes editing/removing an existing link much easier.
     */
    if (editor.isActive("link")) {
      editor.chain().focus().extendMarkRange("link").run();
    }

    setShowLinkMenu((current) => !current);
  };

  const applyExternalLink = (
    url: string,
    text: string,
    newTab: boolean
  ) => {
    let safeUrl = url.trim();

    if (!/^https?:\/\//i.test(safeUrl)) {
      safeUrl = `https://${safeUrl}`;
    }

    /*
     * Reject dangerous protocols.
     */
    try {
      const parsed = new URL(safeUrl);

      if (!["http:", "https:"].includes(parsed.protocol)) {
        return;
      }

      safeUrl = parsed.href;
    } catch {
      return;
    }

    const attrs = {
      href: safeUrl,
      target: newTab ? "_blank" : "_self",
      rel: newTab ? "noopener noreferrer" : null,
    };

    const selection = editor.state.selection;

    /*
     * Existing link:
     * update the whole link range.
     */
    if (editor.isActive("link")) {
      const linkText = text.trim();

      if (linkText && linkText !== selectedText) {
        const { from } = editor.state.selection;

        editor
          .chain()
          .focus()
          .insertContent(linkText)
          .setTextSelection({
            from,
            to: from + linkText.length,
          })
          .setLink(attrs)
          .run();
      } else {
        editor
          .chain()
          .focus()
          .extendMarkRange("link")
          .setLink(attrs)
          .run();
      }
    }
    /*
     * Selected normal text:
     * turn the selection into a link.
     */
    else if (!selection.empty) {
      if (text.trim() === selectedText) {
        editor
          .chain()
          .focus()
          .setLink(attrs)
          .run();
      } else {
        const from = selection.from;
        const linkText = text.trim();

        editor
          .chain()
          .focus()
          .insertContent(linkText)
          .setTextSelection({
            from,
            to: from + linkText.length,
          })
          .setLink(attrs)
          .run();
      }
    }
    /*
     * Empty cursor:
     * insert an actual Tiptap link mark.
     */
    else {
      const linkText = text.trim() || safeUrl;

      editor
        .chain()
        .focus()
        .insertContent({
          type: "text",
          text: linkText,
          marks: [
            {
              type: "link",
              attrs,
            },
          ],
        })
        .unsetMark("link")
        .run();
    }

    setShowLinkMenu(false);
  };

  const applyInternalLink = (
    scholarId: number,
    scholarName: string,
    text: string
  ) => {
    const href = `/scholars/${scholarId}`;

    const attrs = {
      href,
      target: "_self",
      rel: null,
    };

    const selection = editor.state.selection;
    const linkText = text.trim() || scholarName;

    if (editor.isActive("link")) {
      const currentText = selectedText;

      if (linkText !== currentText) {
        const { from } = editor.state.selection;

        editor
          .chain()
          .focus()
          .insertContent(linkText)
          .setTextSelection({
            from,
            to: from + linkText.length,
          })
          .setLink(attrs)
          .run();
      } else {
        editor
          .chain()
          .focus()
          .extendMarkRange("link")
          .setLink(attrs)
          .run();
      }
    } else if (!selection.empty) {
      if (linkText === selectedText) {
        editor
          .chain()
          .focus()
          .setLink(attrs)
          .run();
      } else {
        const from = selection.from;

        editor
          .chain()
          .focus()
          .insertContent(linkText)
          .setTextSelection({
            from,
            to: from + linkText.length,
          })
          .setLink(attrs)
          .run();
      }
    } else {
      editor
        .chain()
        .focus()
        .insertContent({
          type: "text",
          text: linkText,
          marks: [
            {
              type: "link",
              attrs,
            },
          ],
        })
        .unsetMark("link")
        .run();
    }

    setShowLinkMenu(false);
  };

  const removeCurrentLink = () => {
    editor
      .chain()
      .focus()
      .extendMarkRange("link")
      .unsetLink()
      .run();

    setShowLinkMenu(false);
  };

  const setDirectionMode = (
    newDirection: "ltr" | "rtl"
  ) => {
    setDirection(newDirection);

    const { $from } = editor.state.selection;
    const parent = $from.parent;

    if (
      parent.type.name === "paragraph" ||
      parent.type.name === "heading"
    ) {
      editor
        .chain()
        .focus()
        .updateAttributes(parent.type.name, {
          dir: newDirection,
          style: `direction: ${newDirection};`,
        })
        .run();
    }
  };

  return (
    <div
      style={{
        border: `1.5px solid ${BORDER}`,
        borderRadius: "12px",
        overflow: "visible",
        background: "#fff",
        position: "relative",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "2px",
          padding: "8px 10px",
          background: "#f3f4f1",
          borderBottom: `1px solid ${BORDER}`,
          flexWrap: "wrap",
        }}
      >
        {toolbarButton(
          "Undo",
          false,
          <Icon name="undo" size={18} />,
          () => editor.chain().focus().undo().run(),
          !editor.can().undo()
        )}

        {toolbarButton(
          "Redo",
          false,
          <Icon name="redo" size={18} />,
          () => editor.chain().focus().redo().run(),
          !editor.can().redo()
        )}

        <div style={{ width: "1px", height: "24px", background: BORDER, margin: "0 5px" }} />

        {toolbarButton(
          "Bold — click then type bold text",
          editor.isActive("bold"),
          <Icon name="format_bold" size={18} />,
          toggleBold
        )}

        {toolbarButton(
          "Italic — click then type italic text",
          editor.isActive("italic"),
          <Icon name="format_italic" size={18} />,
          toggleItalic
        )}

        {toolbarButton(
  "Underline — click then type underlined text",
  editor.isActive("underline"),
  <Icon name="format_underlined" size={18} />,
  toggleUnderline
)}
{toolbarButton(
  "Strikethrough",
  editor.isActive("strike"),
  <Icon name="strikethrough_s" size={18} />,
  () => editor.chain().focus().toggleStrike().run()
)}
{toolbarButton(
  "Superscript",
  editor.isActive("superscript"),
  <span style={{ fontFamily: SERIF, fontSize: "14px", fontWeight: 700 }}>x²</span>,
  () => editor.chain().focus().toggleSuperscript().run()
)}
<div style={{ width: "1px", height: "24px", background: BORDER, margin: "0 5px" }} />
        

        <div style={{ width: "1px", height: "24px", background: BORDER, margin: "0 5px" }} />

        {toolbarButton(
          "Heading 1",
          editor.isActive("heading", { level: 1 }),
          <span style={{ fontFamily: SERIF, fontSize: "15px", fontWeight: 700 }}>H1</span>,
          () => editor.chain().focus().toggleHeading({ level: 1 }).run()
        )}

        {toolbarButton(
          "Heading 2",
          editor.isActive("heading", { level: 2 }),
          <span style={{ fontFamily: SERIF, fontSize: "14px", fontWeight: 700 }}>H2</span>,
          () => editor.chain().focus().toggleHeading({ level: 2 }).run()
        )}

        {toolbarButton(
          "Heading 3",
          editor.isActive("heading", { level: 3 }),
          <span style={{ fontFamily: SERIF, fontSize: "13px", fontWeight: 700 }}>H3</span>,
          () => editor.chain().focus().toggleHeading({ level: 3 }).run()
        )}

        <div style={{ width: "1px", height: "24px", background: BORDER, margin: "0 5px" }} />

        {toolbarButton(
          "Bullet list",
          editor.isActive("bulletList"),
          <Icon name="format_list_bulleted" size={18} />,
          () => editor.chain().focus().toggleBulletList().run()
        )}

        {toolbarButton(
          "Numbered list",
          editor.isActive("orderedList"),
          <Icon name="format_list_numbered" size={18} />,
          () => editor.chain().focus().toggleOrderedList().run()
        )}

       {toolbarButton(
  "Blockquote",
  editor.isActive("blockquote"),
  <Icon name="format_quote" size={18} />,
  () => editor.chain().focus().toggleBlockquote().run()
)}
{toolbarButton(
  "Horizontal rule",
  false,
  <Icon name="horizontal_rule" size={18} />,
  () => editor.chain().focus().setHorizontalRule().run()
)}
<div style={{ width: "1px", height: "24px", background: BORDER, margin: "0 5px" }} />

        <div style={{ width: "1px", height: "24px", background: BORDER, margin: "0 5px" }} />

        {toolbarButton(
          "Align left",
          editor.isActive({ textAlign: "left" }),
          <Icon name="format_align_left" size={18} />,
          () => editor.chain().focus().setTextAlign("left").run()
        )}

        {toolbarButton(
          "Align center",
          editor.isActive({ textAlign: "center" }),
          <Icon name="format_align_center" size={18} />,
          () => editor.chain().focus().setTextAlign("center").run()
        )}

        {toolbarButton(
          "Align right",
          editor.isActive({ textAlign: "right" }),
          <Icon name="format_align_right" size={18} />,
          () => editor.chain().focus().setTextAlign("right").run()
        )}

        {toolbarButton(
          "Justify",
          editor.isActive({ textAlign: "justify" }),
          <Icon name="format_align_justify" size={18} />,
          () => editor.chain().focus().setTextAlign("justify").run()
        )}

        <div style={{ width: "1px", height: "24px", background: BORDER, margin: "0 5px" }} />

        <div style={{ position: "relative", display: "inline-flex" }}>
          <button
            type="button"
            title="Text color"
            style={{
              width: "34px",
              height: "34px",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              borderRadius: "6px",
              border: "none",
              background: showColorMenu ? GREEN_LIGHT : "transparent",
            }}
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setShowHighlightMenu(false);
              setShowColorMenu((v) => !v);
            }}
          >
            <span
              style={{
                fontFamily: SERIF,
                fontWeight: 700,
                fontSize: "17px",
                color: editor.getAttributes("textStyle").color || "#191c1b",
                borderBottom: `3px solid ${
                  editor.getAttributes("textStyle").color || GREEN
                }`,
              }}
            >
              A
            </span>
          </button>

          {showColorMenu && (
            <ColorPickerPopover
              label="TEXT COLOR"
              value={editor.getAttributes("textStyle").color || "#191c1b"}
              presets={TEXT_COLOR_PRESETS}
              onChange={(c) => editor.chain().focus().setColor(c).run()}
              onClose={() => setShowColorMenu(false)}
            />
          )}
        </div>

        <div style={{ position: "relative", display: "inline-flex" }}>
          <button
            type="button"
            title="Highlight"
            style={{
              width: "34px",
              height: "34px",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              borderRadius: "6px",
              border: "none",
              background: showHighlightMenu ? GREEN_LIGHT : "transparent",
            }}
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setShowColorMenu(false);
              setShowHighlightMenu((v) => !v);
            }}
          >
            <span
              style={{
                fontFamily: SERIF,
                fontWeight: 700,
                fontSize: "16px",
                padding: "1px 3px",
                background: editor.getAttributes("highlight").color || "#fff3a3",
              }}
            >
              H
            </span>
          </button>

          {showHighlightMenu && (
            <ColorPickerPopover
              label="HIGHLIGHT COLOR"
              value={editor.getAttributes("highlight").color || "#fff3a3"}
              presets={HIGHLIGHT_COLOR_PRESETS}
              onChange={(c) => editor.chain().focus().toggleHighlight({ color: c }).run()}
              onClose={() => setShowHighlightMenu(false)}
            />
          )}
        </div>

        <div style={{ width: "1px", height: "24px", background: BORDER, margin: "0 5px" }} />

        {toolbarButton(
          "Left-to-right",
          direction === "ltr",
          <span style={{ fontFamily: MONO, fontSize: "9px", fontWeight: 700 }}>LTR</span>,
          () => setDirectionMode("ltr")
        )}

        {toolbarButton(
          "Right-to-left",
          direction === "rtl",
          <span style={{ fontFamily: MONO, fontSize: "9px", fontWeight: 700 }}>RTL</span>,
          () => setDirectionMode("rtl")
        )}

        <div style={{ width: "1px", height: "24px", background: BORDER, margin: "0 5px" }} />

        <div
  ref={linkButtonRef}
  style={{
    position: "relative",
    display: "inline-flex",
  }}
>
  <button
    type="button"
    title="Insert / edit link"
    aria-label="Insert / edit link"
    style={{
      ...buttonStyle(
        editor.isActive("link") || showLinkMenu
      ),
    }}
    onMouseDown={(e) => {
      // Keep the current text selection/cursor.
      e.preventDefault();
      e.stopPropagation();

      if (editor.isActive("link")) {
        editor
          .chain()
          .focus()
          .extendMarkRange("link")
          .run();
      }

      setShowLinkMenu(true);
    }}
    onClick={(e) => {
      e.preventDefault();
      e.stopPropagation();
    }}
  >
    <Icon name="link" size={18} />
  </button>

  {showLinkMenu && (
    <EditorLinkMenu
      lang={lang}
      selectedText={selectedText}
      existingHref={currentLink.href}
      existingTarget={currentLink.target}
      onApplyExternal={applyExternalLink}
      onApplyInternal={applyInternalLink}
      onRemove={
        editor.isActive("link")
          ? removeCurrentLink
          : undefined
      }
      onClose={() => setShowLinkMenu(false)}
    />
  )}
</div>
      </div>

      <EditorContent editor={editor} />

      <style>{`
        .oulamauna-biography-editor {
          direction: ${direction};
        }

        .ProseMirror {
          min-height: 450px;
          padding: 22px;
          font-family: ${SANS};
          font-size: 15px;
          line-height: 1.85;
          color: #191c1b;
          outline: none;
          word-break: break-word;
          white-space: pre-wrap;
        }

        .ProseMirror:focus {
          outline: none;
        }

        .ProseMirror p {
          margin: 0 0 14px 0;
        }

        .ProseMirror h1 {
          font-family: ${SERIF};
          font-size: 32px;
          line-height: 1.3;
          color: ${GREEN};
          margin: 28px 0 14px 0;
          font-weight: 700;
        }

        .ProseMirror h2 {
          font-family: ${SERIF};
          font-size: 25px;
          line-height: 1.35;
          color: ${GREEN};
          margin: 24px 0 12px 0;
          font-weight: 700;
        }

        .ProseMirror h3 {
          font-family: ${SERIF};
          font-size: 20px;
          line-height: 1.4;
          color: ${GREEN_DARK};
          margin: 20px 0 10px 0;
          font-weight: 700;
        }

        /*
         * IMPORTANT:
         * Explicitly restore list markers.
         * A global CSS reset in the project may otherwise remove them.
         */
        .ProseMirror ul {
          list-style-type: disc !important;
          padding-inline-start: 32px !important;
          margin: 10px 0 16px 0;
        }

        .ProseMirror ol {
          list-style-type: decimal !important;
          padding-inline-start: 32px !important;
          margin: 10px 0 16px 0;
        }

        .ProseMirror ul > li {
          list-style-type: disc !important;
        }

        .ProseMirror ol > li {
          list-style-type: decimal !important;
        }

        .ProseMirror li {
          display: list-item !important;
          margin: 4px 0;
        }

        .ProseMirror li::marker {
          font-weight: 600;
          color: ${GREEN};
        }

        .ProseMirror li > p {
          margin: 0;
        }

        .ProseMirror blockquote {
          border-left: 4px solid ${GOLD};
          margin: 18px 0;
          padding: 12px 18px;
          background: ${GOLD_LIGHT};
          color: #404945;
          font-family: ${SERIF};
          font-style: italic;
          border-radius: 0 8px 8px 0;
        }

        .ProseMirror strong {
          font-weight: 700;
        }

        .ProseMirror em {
          font-style: italic;
        }

        .ProseMirror u {
  text-decoration: underline;
  text-underline-offset: 2px;
}
.ProseMirror s {
  text-decoration: line-through;
  text-decoration-color: ${DANGER};
}
.ProseMirror sup {
  font-size: 0.75em;
  vertical-align: super;
  color: ${GREEN};
  font-weight: 600;
}
.ProseMirror hr {
  border: none;
  border-top: 2px dashed ${BORDER};
  margin: 28px 0;
}
       .ProseMirror a {
  color: ${GREEN};
  text-decoration: underline;
  text-decoration-thickness: 2px
  text-underline-offset: 3px;
  cursor: pointer;
  font-weight: 600;
  transition: color 0.15s ease, text-decoration-color 0.15s ease;
}

.ProseMirror a:hover {
  color: ${GOLD};
  text-decoration-color: ${GOLD};
}

.ProseMirror a:visited {
  color: ${GREEN};
}

        .ProseMirror a:hover {
          color: ${GOLD};
        }

        .ProseMirror .internal-scholar-link {
          color: ${GREEN};
          font-weight: 600;
        }

        .ProseMirror mark {
          padding: 0 2px;
          border-radius: 2px;
        }

        .ProseMirror p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          color: ${MUTED};
          pointer-events: none;
          float: left;
          height: 0;
        }

        .ProseMirror[dir="rtl"] {
          text-align: right;
        }

        .ProseMirror[dir="rtl"] ul,
        .ProseMirror[dir="rtl"] ol {
          padding-inline-start: 0 !important;
          padding-inline-end: 32px !important;
        }

        .ProseMirror[dir="rtl"] blockquote {
          border-left: none;
          border-right: 4px solid ${GOLD};
          border-radius: 8px 0 0 8px;
          padding-left: 0;
          padding-right: 18px;
        }

        .ProseMirror[dir="ltr"] {
          text-align: left;
        }

        .ProseMirror ::selection {
          background: rgba(201,168,76,0.25);
        }
      `}</style>
    </div>
  );
};

export default RichTextEditor;
