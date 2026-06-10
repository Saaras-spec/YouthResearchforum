"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Bold,
  Italic,
  Heading2,
  Heading3,
  Quote,
  List,
  ListOrdered,
  Image as ImageIcon,
  UploadCloud,
  X,
  Eye,
  Edit2,
  Loader2,
  Palette,
} from "lucide-react";

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  isSubmitting?: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// BIDIRECTIONAL PARSERS: HTML <-> MARKDOWN
// ─────────────────────────────────────────────────────────────────────────────

function parseInlineMarkdownToHtml(text: string): string {
  // Escape HTML tags to prevent cross-site issues while editing
  let html = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // Restore color spans that we generate
  html = html.replace(/&lt;span style="color:\s*([^"]+?);"&gt;(.*?)&lt;\/span&gt;/g, '<span style="color: $1;">$2</span>');
  html = html.replace(/&lt;span style="color:\s*([^"]+?)"&gt;(.*?)&lt;\/span&gt;/g, '<span style="color: $1;">$2</span>');

  // Bold (**text** -> <strong>text</strong>)
  html = html.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
  // Italic (*text* -> <em>text</em>)
  html = html.replace(/\*(.*?)\*/g, "<em>$1</em>");
  return html;
}

function markdownToHtml(markdown: string): string {
  if (!markdown) return "<p><br></p>";

  const blocks = markdown.split(/\n\s*\n/);
  const htmlBlocks = blocks.map((block) => {
    const trimmed = block.trim();
    if (!trimmed) return "";

    // Image: ![caption](url)
    if (trimmed.startsWith("![") && trimmed.includes("](") && trimmed.endsWith(")")) {
      const match = trimmed.match(/^!\[(.*?)\]\((.*?)\)$/);
      if (match) {
        const caption = match[1];
        const url = match[2];
        return `<figure class="my-4"><img src="${url}" alt="${caption}" class="max-w-full h-auto rounded border border-gray-300" /><figcaption class="text-center text-xs text-gray-500 italic mt-1">${caption}</figcaption></figure>`;
      }
    }

    // H2 (## heading)
    if (trimmed.startsWith("## ")) {
      return `<h2>${parseInlineMarkdownToHtml(trimmed.substring(3))}</h2>`;
    }
    // H3 (### heading)
    if (trimmed.startsWith("### ")) {
      return `<h3>${parseInlineMarkdownToHtml(trimmed.substring(4))}</h3>`;
    }
    // Blockquote (> text)
    if (trimmed.startsWith("> ")) {
      const lines = trimmed.split("\n").map(l => l.replace(/^>\s?/, ""));
      return `<blockquote>${parseInlineMarkdownToHtml(lines.join("<br>"))}</blockquote>`;
    }
    // Unordered List (- item)
    if (trimmed.startsWith("- ")) {
      const items = trimmed.split(/\n\s*-\s+/).map(i => i.replace(/^- /, "").trim());
      return `<ul>${items.map(it => `<li>${parseInlineMarkdownToHtml(it)}</li>`).join("")}</ul>`;
    }
    // Ordered List (1. item)
    if (trimmed.startsWith("1. ")) {
      const items = trimmed.split(/\n\s*\d+\.\s+/).map(i => i.replace(/^\d+\.\s+/, "").trim());
      return `<ol>${items.map(it => `<li>${parseInlineMarkdownToHtml(it)}</li>`).join("")}</ol>`;
    }

    // Paragraph
    return `<p>${parseInlineMarkdownToHtml(trimmed)}</p>`;
  });

  return htmlBlocks.filter(Boolean).join("\n");
}

function nodeToMarkdown(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) {
    return node.nodeValue || "";
  }

  if (node.nodeType === Node.ELEMENT_NODE) {
    const el = node as HTMLElement;
    const tagName = el.tagName.toLowerCase();

    const getChildrenMarkdown = () => {
      let childText = "";
      el.childNodes.forEach(child => {
        childText += nodeToMarkdown(child);
      });
      return childText;
    };

    switch (tagName) {
      case "strong":
      case "b": {
        const inner = getChildrenMarkdown().trim();
        return inner ? `**${inner}**` : "";
      }
      case "em":
      case "i": {
        const inner = getChildrenMarkdown().trim();
        return inner ? `*${inner}*` : "";
      }
      case "span": {
        const color = el.style.color;
        const inner = getChildrenMarkdown();
        if (color) {
          return `<span style="color: ${color};">${inner}</span>`;
        }
        return inner;
      }
      case "font": {
        const color = el.getAttribute("color");
        const inner = getChildrenMarkdown();
        if (color) {
          return `<span style="color: ${color};">${inner}</span>`;
        }
        return inner;
      }
      case "h2": {
        const inner = getChildrenMarkdown().trim();
        return inner ? `\n\n## ${inner}\n\n` : "";
      }
      case "h3": {
        const inner = getChildrenMarkdown().trim();
        return inner ? `\n\n### ${inner}\n\n` : "";
      }
      case "blockquote": {
        const inner = getChildrenMarkdown().trim();
        const lines = inner.split(/<br\s*\/?>|\n/).map(l => l.trim()).filter(Boolean).map(l => `> ${l}`);
        return lines.length ? `\n\n${lines.join("\n")}\n\n` : "";
      }
      case "ul": {
        let listItems = "";
        el.querySelectorAll("li").forEach(li => {
          const liText = Array.from(li.childNodes).map(nodeToMarkdown).join("").trim();
          if (liText) {
            listItems += `- ${liText}\n`;
          }
        });
        return listItems ? `\n\n${listItems}\n\n` : "";
      }
      case "ol": {
        let listItems = "";
        let count = 1;
        el.querySelectorAll("li").forEach(li => {
          const liText = Array.from(li.childNodes).map(nodeToMarkdown).join("").trim();
          if (liText) {
            listItems += `${count}. ${liText}\n`;
            count++;
          }
        });
        return listItems ? `\n\n${listItems}\n\n` : "";
      }
      case "p": {
        const inner = getChildrenMarkdown().trim();
        return inner ? `\n\n${inner}\n\n` : "";
      }
      case "br":
        return "\n";
      case "figure": {
        const img = el.querySelector("img");
        const figcaption = el.querySelector("figcaption");
        if (img) {
          const src = img.getAttribute("src") || "";
          const alt = figcaption ? figcaption.textContent || "" : img.getAttribute("alt") || "";
          return `\n\n![${alt}](${src})\n\n`;
        }
        return getChildrenMarkdown();
      }
      case "img": {
        const src = el.getAttribute("src") || "";
        const alt = el.getAttribute("alt") || "";
        return `\n\n![${alt}](${src})\n\n`;
      }
      default:
        return getChildrenMarkdown();
    }
  }

  return "";
}

function contentEditableToMarkdown(container: HTMLElement): string {
  let md = "";
  container.childNodes.forEach(child => {
    md += nodeToMarkdown(child);
  });
  return cleanMarkdown(md);
}

function cleanMarkdown(markdown: string): string {
  return markdown
    .replace(/\r/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

// Inline Markdown Helper for preview tab rendering
function parseInlineMarkdown(text: string): string {
  return text
    .replace(/&lt;span style="color:\s*([^"]+?);"&gt;(.*?)&lt;\/span&gt;/g, '<span style="color: $1;">$2</span>')
    .replace(/&lt;span style="color:\s*([^"]+?)"&gt;(.*?)&lt;\/span&gt;/g, '<span style="color: $1;">$2</span>')
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>");
}

function rgbToHex(rgb: string): string {
  if (!rgb) return "#000000";
  if (rgb.startsWith("#")) return rgb;
  const match = rgb.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
  if (!match) return rgb;
  const r = parseInt(match[1]);
  const g = parseInt(match[2]);
  const b = parseInt(match[3]);
  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

function normalizeColor(colorVal: any): string {
  if (!colorVal) return "#000000";
  const str = String(colorVal).trim();
  if (str.startsWith("rgb")) {
    return rgbToHex(str);
  }
  if (str.startsWith("#")) {
    return str;
  }
  if (!isNaN(Number(str))) {
    const num = Number(str);
    const r = (num & 0xFF);
    const g = ((num >> 8) & 0xFF);
    const b = ((num >> 16) & 0xFF);
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  }
  return str;
}

function isSelectionBold(editor: HTMLDivElement | null): boolean {
  if (typeof window === "undefined" || !editor) return false;
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return false;

  let node: Node | null = selection.anchorNode;
  while (node && node !== editor) {
    if (node.nodeType === Node.ELEMENT_NODE) {
      const tagName = (node as HTMLElement).tagName.toLowerCase();
      if (tagName === "strong" || tagName === "b") {
        return true;
      }
    }
    node = node.parentNode;
  }
  return false;
}

const isValidHex = (hex: string): boolean => {
  return /^#[0-9A-Fa-f]{6}$|^#[0-9A-Fa-f]{3}$/.test(hex);
};

export default function MarkdownEditor({
  value,
  onChange,
  isSubmitting = false,
}: MarkdownEditorProps) {
  const [activeTab, setActiveTab] = useState<"write" | "preview">("write");
  const [showImageModal, setShowImageModal] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageCaption, setImageCaption] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState("");
  
  const [activeStyles, setActiveStyles] = useState({
    bold: false,
    italic: false,
    h2: false,
    h3: false,
    blockquote: false,
    bulletList: false,
    orderedList: false,
  });

  const [showColorMenu, setShowColorMenu] = useState(false);
  const [selectedColor, setSelectedColor] = useState("#000000");
  const [recentColors, setRecentColors] = useState<string[]>([
    "#000000",
    "#4b5563",
    "#ef4444",
    "#3b82f6",
    "#10b981",
  ]);
  const [customColorInput, setCustomColorInput] = useState("");

  const editorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const colorPickerRef = useRef<HTMLDivElement>(null);
  const savedSelectionRef = useRef<Range | null>(null);
  const lastMarkdownRef = useRef<string>("");

  const themeColors = [
    "#ffffff", "#000000", "#374151", "#9ca3af", "#f3f4f6", "#e6e2da",
    "#de3e44", "#1e3a8a", "#3b82f6", "#10b981", "#8b5cf6", "#f97316"
  ];

  const standardColors = [
    "#800000", "#ff0000", "#ff9900", "#ffff00", "#99cc00", "#00ff00",
    "#006600", "#33cccc", "#0000ff", "#000080", "#990099", "#ff00ff"
  ];

  // Sync value from parent (only if it differs from the last emitted markdown)
  useEffect(() => {
    if (editorRef.current && value !== lastMarkdownRef.current) {
      editorRef.current.innerHTML = markdownToHtml(value);
      lastMarkdownRef.current = value;
    }
  }, [value]);

  // Handle color menu outside clicks
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (colorPickerRef.current && !colorPickerRef.current.contains(e.target as Node)) {
        setShowColorMenu(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  // Update button active state highlights in toolbar
  const updateActiveStyles = () => {
    if (typeof document === "undefined") return;

    const bulletList = document.queryCommandState("insertUnorderedList");
    const orderedList = document.queryCommandState("insertOrderedList");

    const formatBlock = document.queryCommandValue("formatBlock");
    const h2 = formatBlock === "h2";
    const h3 = formatBlock === "h3";
    const blockquote = formatBlock === "blockquote";

    // Handle Bold button verification specifically for heading blocks
    let bold = document.queryCommandState("bold");
    if (bold && (h2 || h3)) {
      bold = isSelectionBold(editorRef.current);
    }

    const italic = document.queryCommandState("italic");

    // Track selection color
    const rawColor = document.queryCommandValue("foreColor");
    const activeColor = normalizeColor(rawColor);

    setActiveStyles({
      bold,
      italic,
      h2,
      h3,
      blockquote,
      bulletList,
      orderedList,
    });
    
    setSelectedColor(activeColor);
  };

  const handleInput = () => {
    const editor = editorRef.current;
    if (!editor) return;

    const markdown = contentEditableToMarkdown(editor);
    lastMarkdownRef.current = markdown;
    onChange(markdown);
    updateActiveStyles();
  };

  // Safe wrapper around document.execCommand to handle deprecation gracefully
  const executeCommand = (command: string, value: string = ""): boolean => {
    if (typeof document === "undefined") return false;
    try {
      return document.execCommand(command, false, value);
    } catch (err) {
      console.warn(`Browser failed or warning on execCommand(${command}):`, err);
      return false;
    }
  };

  const toggleFormat = (command: string, value: string = "") => {
    const editor = editorRef.current;
    if (!editor) return;
    editor.focus();
    executeCommand(command, value);
    handleInput();
  };

  const toggleBlockFormat = (tag: string) => {
    const editor = editorRef.current;
    if (!editor) return;
    editor.focus();

    if (typeof document !== "undefined") {
      const currentFormat = document.queryCommandValue("formatBlock");
      if (currentFormat === tag) {
        // Toggle off: back to normal paragraph
        executeCommand("formatBlock", "p");
      } else {
        executeCommand("formatBlock", tag);
      }
    }
    handleInput();
  };

  const addRecentColor = (color: string) => {
    const normalized = color.toLowerCase();
    setRecentColors((prev) => {
      const filtered = prev.filter((c) => c.toLowerCase() !== normalized);
      return [normalized, ...filtered].slice(0, 5);
    });
  };

  const toggleColor = (color: string) => {
    const editor = editorRef.current;
    if (!editor) return;
    editor.focus();
    executeCommand("foreColor", color);
    setSelectedColor(color);
    addRecentColor(color);
    handleInput();
    setShowColorMenu(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImageFile(e.target.files[0]);
      setUploadError("");
    }
  };

  const uploadToCloudinary = async (file: File): Promise<string> => {
    setUploadProgress(15);
    
    // 1. Get signature from the backend
    const signResponse = await fetch("/api/cloudinary-sign", {
      method: "POST",
    });

    if (!signResponse.ok) {
      throw new Error("Failed to authenticate upload request.");
    }

    const { signature, timestamp, apiKey, preset, cloudName } = await signResponse.json();
    setUploadProgress(40);

    // 2. Perform signed upload to Cloudinary
    const formData = new FormData();
    formData.append("file", file);
    formData.append("api_key", apiKey);
    formData.append("timestamp", timestamp.toString());
    formData.append("upload_preset", preset);
    formData.append("signature", signature);

    setUploadProgress(65);
    const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData?.error?.message || "Failed to upload image.");
    }

    setUploadProgress(90);
    const data = await response.json();
    setUploadProgress(100);
    return data.secure_url;
  };

  const openImageModal = () => {
    // Save current range/cursor position before editor loses focus
    if (typeof window !== "undefined") {
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        savedSelectionRef.current = selection.getRangeAt(0).cloneRange();
      }
    }
    setShowImageModal(true);
  };

  const handleImageInsert = async (e?: React.FormEvent | React.MouseEvent) => {
    if (e) e.preventDefault();
    if (!imageFile) {
      setUploadError("Please select an image file to upload.");
      return;
    }

    setIsUploading(true);
    setUploadError("");
    setUploadProgress(10);

    try {
      const imageUrl = await uploadToCloudinary(imageFile);
      const captionText = imageCaption.trim();

      // Create visual premium figure HTML to insert
      const imageHtml = `<figure class="my-4" contenteditable="false"><img src="${imageUrl}" alt="${captionText}" class="max-w-full h-auto rounded border border-gray-300 mx-auto block" />${captionText ? `<figcaption class="text-center text-xs text-gray-500 italic mt-1">${captionText}</figcaption>` : ""}</figure><p><br></p>`;

      const editor = editorRef.current;
      if (editor) {
        editor.focus();

        let range: Range | null = null;
        if (savedSelectionRef.current) {
          range = savedSelectionRef.current;
        } else if (typeof window !== "undefined") {
          const selection = window.getSelection();
          if (selection && selection.rangeCount > 0) {
            range = selection.getRangeAt(0);
          }
        }

        if (range) {
          range.deleteContents();
          
          const tempDiv = document.createElement("div");
          tempDiv.innerHTML = imageHtml;

          const frag = document.createDocumentFragment();
          let child;
          while ((child = tempDiv.firstChild)) {
            frag.appendChild(child);
          }

          range.insertNode(frag);
          
          // Collapse selection after inserted block
          range.collapse(false);
          const selection = window.getSelection();
          if (selection) {
            selection.removeAllRanges();
            selection.addRange(range);
          }
        } else {
          editor.innerHTML += imageHtml;
        }

        // Trigger change
        handleInput();
      }

      // Reset states
      setImageFile(null);
      setImageCaption("");
      setShowImageModal(false);
    } catch (err: any) {
      console.error("Cloudinary upload error:", err);
      setUploadError(err.message || "Failed to upload image. Please try again.");
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      savedSelectionRef.current = null;
    }
  };

  const renderPreview = () => {
    if (!value.trim()) {
      return (
        <div className="text-center py-12 text-editorial-gray/50 italic text-sm font-sans">
          No content written yet. Switch to "Write" mode to begin.
        </div>
      );
    }

    const blocks = value.split(/\n\s*\n/);

    return (
      <div className="rich-text text-editorial-charcoal prose prose-neutral max-w-none">
        {blocks.map((block, idx) => {
          const trimmed = block.trim();
          if (!trimmed) return null;

          // H2
          if (trimmed.startsWith("## ")) {
            const text = trimmed.substring(3).trim();
            return <h2 key={idx} className="border-b border-[#e6e2da] pb-1" dangerouslySetInnerHTML={{ __html: parseInlineMarkdown(text) }} />;
          }
          // H3
          if (trimmed.startsWith("### ")) {
            const text = trimmed.substring(4).trim();
            return <h3 key={idx} dangerouslySetInnerHTML={{ __html: parseInlineMarkdown(text) }} />;
          }
          // Quote
          if (trimmed.startsWith("> ")) {
            const text = trimmed.substring(2).trim();
            return <blockquote key={idx} dangerouslySetInnerHTML={{ __html: parseInlineMarkdown(text) }} />;
          }
          // Unordered list
          if (trimmed.startsWith("- ")) {
            const items = trimmed
              .split(/\n\s*-\s+/)
              .map((item) => item.replace(/^- /, "").trim())
              .filter(Boolean);
            return (
              <ul key={idx} className="list-disc pl-6 my-4 space-y-1">
                {items.map((it, i) => (
                  <li key={i} dangerouslySetInnerHTML={{ __html: parseInlineMarkdown(it) }} />
                ))}
              </ul>
            );
          }
          // Ordered list
          if (trimmed.startsWith("1. ")) {
            const items = trimmed
              .split(/\n\s*\d+\.\s+/)
              .map((item) => item.replace(/^\d+\.\s+/, "").trim())
              .filter(Boolean);
            return (
              <ol key={idx} className="list-decimal pl-6 my-4 space-y-1">
                {items.map((it, i) => (
                  <li key={i} dangerouslySetInnerHTML={{ __html: parseInlineMarkdown(it) }} />
                ))}
              </ol>
            );
          }
          // Markdown Image block: ![Caption](URL)
          if (trimmed.startsWith("![") && trimmed.includes("](") && trimmed.endsWith(")")) {
            const match = trimmed.match(/^!\[(.*?)\]\((.*?)\)$/);
            if (match) {
              const caption = match[1];
              const url = match[2];
              return (
                <figure key={idx} className="my-8 space-y-2.5">
                  <div className="w-full bg-editorial-cream-dark/10 border border-[#e6e2da] rounded-xs flex items-center justify-center p-2">
                    <img
                      src={url}
                      alt={caption || "Essay illustration"}
                      className="max-w-full h-auto block"
                      loading="lazy"
                    />
                  </div>
                  {caption && (
                    <figcaption className="text-center text-xs text-editorial-gray italic font-sans leading-relaxed">
                      {caption}
                    </figcaption>
                  )}
                </figure>
              );
            }
          }

          return <p key={idx} dangerouslySetInnerHTML={{ __html: parseInlineMarkdown(trimmed) }} />;
        })}
      </div>
    );
  };

  return (
    <div className="border border-[#e6e2da] bg-white rounded-sm flex flex-col relative">
      {/* Editor Header / Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between border-b border-[#e6e2da] bg-editorial-cream-dark/20 p-2 sm:p-3 space-y-2 sm:space-y-0 rounded-t-sm">
        
        {/* Toolbar Buttons */}
        <div className={`flex flex-wrap items-center gap-1 transition-opacity ${activeTab === "preview" ? "opacity-30 pointer-events-none" : ""}`}>
          <button
            type="button"
            onClick={() => toggleFormat("bold")}
            className={`p-2 rounded-sm cursor-pointer transition-colors ${
              activeStyles.bold
                ? "bg-editorial-charcoal text-white"
                : "text-editorial-gray hover:text-editorial-charcoal hover:bg-editorial-cream-dark/50"
            }`}
            title="Bold"
            disabled={isSubmitting || activeTab === "preview"}
          >
            <Bold className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => toggleFormat("italic")}
            className={`p-2 rounded-sm cursor-pointer transition-colors ${
              activeStyles.italic
                ? "bg-editorial-charcoal text-white"
                : "text-editorial-gray hover:text-editorial-charcoal hover:bg-editorial-cream-dark/50"
            }`}
            title="Italic"
            disabled={isSubmitting || activeTab === "preview"}
          >
            <Italic className="h-4 w-4" />
          </button>
          
          <div className="w-px h-4 bg-[#e6e2da] mx-1 hidden sm:block" />

          <button
            type="button"
            onClick={() => toggleBlockFormat("h2")}
            className={`p-2 rounded-sm cursor-pointer transition-colors ${
              activeStyles.h2
                ? "bg-editorial-charcoal text-white"
                : "text-editorial-gray hover:text-editorial-charcoal hover:bg-editorial-cream-dark/50"
            }`}
            title="Heading 2"
            disabled={isSubmitting || activeTab === "preview"}
          >
            <Heading2 className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => toggleBlockFormat("h3")}
            className={`p-2 rounded-sm cursor-pointer transition-colors ${
              activeStyles.h3
                ? "bg-editorial-charcoal text-white"
                : "text-editorial-gray hover:text-editorial-charcoal hover:bg-editorial-cream-dark/50"
            }`}
            title="Heading 3"
            disabled={isSubmitting || activeTab === "preview"}
          >
            <Heading3 className="h-4 w-4" />
          </button>

          <div className="w-px h-4 bg-[#e6e2da] mx-1 hidden sm:block" />

          <button
            type="button"
            onClick={() => toggleBlockFormat("blockquote")}
            className={`p-2 rounded-sm cursor-pointer transition-colors ${
              activeStyles.blockquote
                ? "bg-editorial-charcoal text-white"
                : "text-editorial-gray hover:text-editorial-charcoal hover:bg-editorial-cream-dark/50"
            }`}
            title="Blockquote"
            disabled={isSubmitting || activeTab === "preview"}
          >
            <Quote className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => toggleFormat("insertUnorderedList")}
            className={`p-2 rounded-sm cursor-pointer transition-colors ${
              activeStyles.bulletList
                ? "bg-editorial-charcoal text-white"
                : "text-editorial-gray hover:text-editorial-charcoal hover:bg-editorial-cream-dark/50"
            }`}
            title="Unordered List"
            disabled={isSubmitting || activeTab === "preview"}
          >
            <List className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => toggleFormat("insertOrderedList")}
            className={`p-2 rounded-sm cursor-pointer transition-colors ${
              activeStyles.orderedList
                ? "bg-editorial-charcoal text-white"
                : "text-editorial-gray hover:text-editorial-charcoal hover:bg-editorial-cream-dark/50"
            }`}
            title="Ordered List"
            disabled={isSubmitting || activeTab === "preview"}
          >
            <ListOrdered className="h-4 w-4" />
          </button>

          <div className="w-px h-4 bg-[#e6e2da] mx-1 hidden sm:block" />

          {/* Microsoft Word Style Redesigned Color Picker Button */}
          <div ref={colorPickerRef} className="relative">
            <button
              type="button"
              onClick={() => setShowColorMenu(!showColorMenu)}
              className="p-2 text-editorial-gray hover:text-editorial-charcoal hover:bg-editorial-cream-dark/50 rounded-sm cursor-pointer transition-colors flex items-center gap-1.5"
              title="Text Color"
              disabled={isSubmitting || activeTab === "preview"}
            >
              <Palette className="h-4 w-4" />
              <span 
                className="w-3.5 h-3.5 rounded-full border border-[#e6e2da] block shadow-2xs"
                style={{ backgroundColor: selectedColor }}
              />
            </button>

            {showColorMenu && (
              <div className="absolute top-full left-0 mt-1 bg-white border border-[#e6e2da] p-3.5 rounded-sm shadow-lg z-[100] w-52 flex flex-col space-y-2.5 animate-in fade-in slide-in-from-top-1 duration-150">
                
                {/* Theme Colors Grid */}
                <div>
                  <div className="text-[10px] font-mono text-editorial-gray uppercase tracking-wider mb-1.5 font-bold">Theme Colors</div>
                  <div className="grid grid-cols-6 gap-1">
                    {themeColors.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => toggleColor(color)}
                        className="w-6 h-6 rounded-xs border border-gray-200 cursor-pointer hover:scale-115 hover:shadow-xs hover:border-editorial-charcoal transition-all"
                        style={{ backgroundColor: color }}
                        title={color}
                      />
                    ))}
                  </div>
                </div>

                {/* Standard Colors Grid */}
                <div>
                  <div className="text-[10px] font-mono text-editorial-gray uppercase tracking-wider mb-1.5 font-bold">Standard Colors</div>
                  <div className="grid grid-cols-6 gap-1">
                    {standardColors.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => toggleColor(color)}
                        className="w-6 h-6 rounded-xs border border-gray-200 cursor-pointer hover:scale-115 hover:shadow-xs hover:border-editorial-charcoal transition-all"
                        style={{ backgroundColor: color }}
                        title={color}
                      />
                    ))}
                  </div>
                </div>

                {/* Recent Colors Grid */}
                {recentColors.length > 0 && (
                  <div>
                    <div className="text-[10px] font-mono text-editorial-gray uppercase tracking-wider mb-1.5 font-bold">Recent Colors</div>
                    <div className="flex flex-wrap gap-1">
                      {recentColors.map((color, idx) => (
                        <button
                          key={`${color}-${idx}`}
                          type="button"
                          onClick={() => toggleColor(color)}
                          className="w-6 h-6 rounded-xs border border-gray-200 cursor-pointer hover:scale-115 hover:shadow-xs hover:border-editorial-charcoal transition-all"
                          style={{ backgroundColor: color }}
                          title={color}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Custom Color Input */}
                <div className="border-t border-[#e6e2da] pt-2.5 flex flex-col space-y-1.5">
                  <div className="text-[10px] font-mono text-editorial-gray uppercase tracking-wider font-bold">Custom Color</div>
                  <div className="flex items-center gap-1.5">
                    <span 
                      className="w-6 h-6 rounded-xs border border-gray-300 block shrink-0" 
                      style={{ backgroundColor: isValidHex(customColorInput) ? customColorInput : "#ffffff" }}
                    />
                    <input
                      type="text"
                      value={customColorInput}
                      onChange={(e) => setCustomColorInput(e.target.value)}
                      placeholder="#FF5733"
                      className="flex-1 bg-editorial-cream-dark/10 border border-[#e6e2da] px-2 py-1 text-xs outline-none text-editorial-charcoal rounded-xs font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (isValidHex(customColorInput)) {
                          toggleColor(customColorInput);
                        }
                      }}
                      disabled={!isValidHex(customColorInput)}
                      className="bg-editorial-charcoal hover:bg-editorial-accent text-white px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider rounded-xs cursor-pointer disabled:opacity-35 disabled:pointer-events-none transition-colors"
                    >
                      Apply
                    </button>
                  </div>
                </div>

              </div>
            )}
          </div>

          <div className="w-px h-4 bg-[#e6e2da] mx-1 hidden sm:block" />

          {/* Insert Image Trigger */}
          <button
            type="button"
            onClick={openImageModal}
            className="p-2 text-editorial-accent hover:bg-editorial-accent/5 hover:text-editorial-accent rounded-sm cursor-pointer transition-colors flex items-center gap-1 font-mono text-[10px] tracking-wider uppercase font-bold"
            title="Insert Essay Image"
            disabled={isSubmitting || activeTab === "preview"}
          >
            <ImageIcon className="h-4 w-4 text-editorial-accent" />
            <span>Add Image</span>
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex bg-[#e6e2da]/45 p-1 rounded-sm self-end sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveTab("write")}
            className={`px-3 py-1.5 text-xs font-mono uppercase tracking-wider rounded-xs transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === "write"
                ? "bg-white text-editorial-charcoal font-bold shadow-xs"
                : "text-editorial-gray hover:text-editorial-charcoal"
            }`}
          >
            <Edit2 className="h-3 w-3" />
            Write
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("preview")}
            className={`px-3 py-1.5 text-xs font-mono uppercase tracking-wider rounded-xs transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === "preview"
                ? "bg-white text-editorial-charcoal font-bold shadow-xs"
                : "text-editorial-gray hover:text-editorial-charcoal"
            }`}
          >
            <Eye className="h-3 w-3" />
            Preview
          </button>
        </div>
      </div>

      {/* Editor Content Area */}
      <div className="relative min-h-[350px] flex-1 flex flex-col bg-white">
        {/* Write Tab Container (hidden instead of unmounted) */}
        <div className={`flex flex-col flex-1 ${activeTab === "write" ? "flex" : "hidden"}`}>
          <style dangerouslySetInnerHTML={{ __html: `
            .rich-editor {
              outline: none;
              min-height: 350px;
            }
            .rich-editor:empty:before {
              content: attr(data-placeholder);
              color: #a3a3a3;
              cursor: text;
            }
            .rich-editor h2 {
              font-size: 1.5rem !important;
              font-weight: 700 !important;
              border-bottom: 1px solid #e6e2da !important;
              padding-bottom: 0.25rem !important;
              margin-top: 1.5rem !important;
              margin-bottom: 0.75rem !important;
            }
            .rich-editor h3 {
              font-size: 1.25rem !important;
              font-weight: 600 !important;
              margin-top: 1.25rem !important;
              margin-bottom: 0.5rem !important;
            }
            .rich-editor blockquote {
              border-left: 4px solid #cbd5e1 !important;
              padding-left: 1rem !important;
              font-style: italic !important;
              color: #4b5563 !important;
              margin: 1rem 0 !important;
            }
            .rich-editor ul {
              list-style-type: disc !important;
              padding-left: 1.5rem !important;
              margin: 0.75rem 0 !important;
            }
            .rich-editor ol {
              list-style-type: decimal !important;
              padding-left: 1.5rem !important;
              margin: 0.75rem 0 !important;
            }
            .rich-editor p {
              margin-bottom: 0.75rem !important;
              line-height: 1.625 !important;
            }
            .rich-editor figure {
              margin: 1.5rem 0 !important;
            }
            .rich-editor figcaption {
              font-size: 0.75rem !important;
              color: #71717a !important;
              font-style: italic !important;
              margin-top: 0.5rem !important;
              text-align: center;
            }
          ` }} />
          <div
            ref={editorRef}
            contentEditable={!isSubmitting}
            onInput={handleInput}
            onKeyUp={updateActiveStyles}
            onMouseUp={updateActiveStyles}
            onFocus={updateActiveStyles}
            data-placeholder="Write your long-form publication body content here..."
            className="rich-editor w-full flex-1 p-4 sm:p-6 text-sm font-sans outline-none text-editorial-charcoal focus:bg-editorial-cream-dark/5 transition-colors resize-y leading-relaxed overflow-y-auto"
          />
        </div>

        {/* Preview Tab Container (hidden instead of unmounted) */}
        <div className={`p-4 sm:p-8 overflow-y-auto max-h-[600px] flex-1 bg-editorial-cream ${activeTab === "preview" ? "block" : "hidden"}`}>
          {renderPreview()}
        </div>

        {/* Image Upload Popover Modal */}
        {showImageModal && (
          <div className="absolute inset-0 bg-editorial-charcoal/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <div className="bg-white border border-[#e6e2da] w-full max-w-md p-6 rounded-sm shadow-xl space-y-4 animate-in fade-in zoom-in duration-200">
              
              <div className="flex items-center justify-between border-b border-[#e6e2da] pb-3">
                <h3 className="font-serif font-bold text-lg text-editorial-charcoal flex items-center gap-2">
                  <ImageIcon className="h-5 w-5 text-editorial-accent" />
                  Insert Essay Image
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    setShowImageModal(false);
                    setImageFile(null);
                    setImageCaption("");
                    setUploadError("");
                  }}
                  className="text-editorial-gray hover:text-editorial-charcoal transition-colors cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {uploadError && (
                <div className="bg-red-50 border border-red-200 text-editorial-accent text-xs p-3 rounded-sm">
                  {uploadError}
                </div>
              )}

              <div className="space-y-4">
                {/* File Upload Zone */}
                <div className="space-y-1">
                  <label className="block text-xs font-mono uppercase tracking-wider text-editorial-gray">
                    Image File
                  </label>
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="border border-dashed border-[#e6e2da] bg-editorial-cream-dark/15 p-6 rounded-sm text-center cursor-pointer hover:bg-editorial-cream-dark/30 transition-colors relative"
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                      disabled={isUploading}
                    />
                    <UploadCloud className="h-8 w-8 text-editorial-gray mx-auto mb-2" />
                    <p className="text-xs font-bold text-editorial-charcoal truncate">
                      {imageFile ? imageFile.name : "Select or drag image file"}
                    </p>
                    <p className="text-[10px] text-editorial-gray mt-0.5">PNG, JPG or WEBP (Max 5MB)</p>
                  </div>
                </div>

                {/* Optional Caption */}
                <div className="space-y-1">
                  <label className="block text-xs font-mono uppercase tracking-wider text-editorial-gray">
                    Caption (Optional)
                  </label>
                  <input
                    type="text"
                    value={imageCaption}
                    onChange={(e) => setImageCaption(e.target.value)}
                    placeholder="e.g. Figure 1: Overcrowded classroom in suburbia"
                    className="w-full bg-editorial-cream-dark/10 border border-[#e6e2da] px-3 py-2 text-xs outline-none text-editorial-charcoal focus:border-editorial-accent transition-colors rounded-sm"
                    disabled={isUploading}
                  />
                </div>

                {/* Upload Status */}
                {isUploading && (
                  <div className="space-y-2">
                    <div className="h-1.5 w-full bg-[#e6e2da] rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-editorial-accent transition-all duration-300" 
                        style={{ width: `${uploadProgress}%` }} 
                      />
                    </div>
                    <div className="flex items-center justify-between text-[10px] font-mono text-editorial-gray">
                      <span className="flex items-center gap-1">
                        <Loader2 className="h-3 w-3 animate-spin text-editorial-accent" />
                        Uploading to Cloudinary...
                      </span>
                      <span>{uploadProgress}%</span>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowImageModal(false);
                      setImageFile(null);
                      setImageCaption("");
                      setUploadError("");
                    }}
                    className="px-4 py-2 border border-[#e6e2da] text-editorial-gray hover:text-editorial-charcoal rounded-sm text-xs font-mono uppercase tracking-wider cursor-pointer bg-white transition-colors"
                    disabled={isUploading}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleImageInsert}
                    className="px-4 py-2 bg-editorial-accent hover:bg-editorial-charcoal text-white rounded-sm text-xs font-mono uppercase tracking-wider font-bold transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                    disabled={isUploading || !imageFile}
                  >
                    {isUploading ? "Uploading..." : "Insert Image"}
                  </button>
                </div>
              </div>

            </div>
          </div>
        )}
      </div>
    </div>
  );
}
