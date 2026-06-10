"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { createArticle, slugify, DEFAULT_PLACEHOLDER_IMAGE } from "@/lib/db";
import { Save, Image as ImageIcon, Sparkles, HelpCircle, ArrowLeft, UploadCloud } from "lucide-react";
import Link from "next/link";
import MarkdownEditor from "@/components/MarkdownEditor";

export default function AdminCreateArticlePage() {
  const router = useRouter();

  // Form states
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [content, setContent] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [authorBio, setAuthorBio] = useState("");
  const [section, setSection] = useState<"national" | "international">("national");
  const [category, setCategory] = useState("");
  const [readingTime, setReadingTime] = useState(10);
  const [featured, setFeatured] = useState(false);

  // Cover Image options: Uploader vs URL Link
  const [imageType, setImageType] = useState<"upload" | "url">("upload");
  const [coverImageUrl, setCoverImageUrl] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  // Status states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const uploadFileToCloudinary = async (file: File): Promise<string> => {
    setUploadProgress(15);

    // 1. Get signature from backend
    const signResponse = await fetch("/api/cloudinary-sign", {
      method: "POST",
    });

    if (!signResponse.ok) {
      throw new Error("Failed to authenticate upload request.");
    }

    const { signature, timestamp, apiKey, preset, cloudName } = await signResponse.json();
    setUploadProgress(45);

    // 2. Perform signed upload to Cloudinary
    const formData = new FormData();
    formData.append("file", file);
    formData.append("api_key", apiKey);
    formData.append("timestamp", timestamp.toString());
    formData.append("upload_preset", preset);
    formData.append("signature", signature);

    setUploadProgress(70);
    const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData?.error?.message || "Failed to upload cover image to Cloudinary.");
    }

    setUploadProgress(90);
    const data = await response.json();
    setUploadProgress(100);
    return data.secure_url;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      let finalImageUrl = coverImageUrl.trim();

      // If upload option is selected, upload file
      if (imageType === "upload" && selectedFile) {
        setUploadProgress(1);
        finalImageUrl = await uploadFileToCloudinary(selectedFile);
      } else if (imageType === "upload" && !selectedFile) {
        // Fallback to default placeholder if no file selected
        finalImageUrl = DEFAULT_PLACEHOLDER_IMAGE;
      }

      const articlePayload = {
        title: title.trim(),
        subtitle: subtitle.trim(),
        content: content.trim(),
        authorName: authorName.trim(),
        authorBio: authorBio.trim(),
        section,
        category: category.trim() || "Uncategorized",
        coverImage: finalImageUrl || DEFAULT_PLACEHOLDER_IMAGE,
        readingTime: Number(readingTime) || 5,
        featured,
        createdAt: serverTimestamp(),
      };

      await createArticle(articlePayload);
      router.push("/admin/articles");
    } catch (err: any) {
      console.error("Create article error:", err);
      setError(err.message || "Something went wrong while publishing the article.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Header */}
      <div className="border-b border-[#e6e2da] pb-6 flex items-center justify-between">
        <div>
          <Link
            href="/admin/articles"
            className="inline-flex items-center text-xs font-mono uppercase tracking-widest text-editorial-gray hover:text-editorial-accent mb-2"
          >
            <ArrowLeft className="h-3.5 w-3.5 mr-1.5" />
            Back to Articles
          </Link>
          <h1 className="font-serif text-3xl font-extrabold text-editorial-charcoal">
            Publish Article
          </h1>
          <p className="text-sm text-editorial-gray mt-1 font-light">
            Draft and publish a new article, policy review, or commentary piece.
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-editorial-accent text-xs p-4 rounded-sm">
          {error}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white border border-[#e6e2da] p-6 rounded-sm">
          
          {/* Title */}
          <div className="md:col-span-2">
            <label className="block text-xs font-mono uppercase tracking-wider text-editorial-gray mb-1.5">
              Article Title
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="The Illusion of Meritocracy..."
              className="w-full bg-editorial-cream-dark/10 border border-[#e6e2da] px-3.5 py-2.5 text-sm outline-none text-editorial-charcoal placeholder-editorial-gray/40 focus:border-editorial-accent transition-colors rounded-sm"
              disabled={isSubmitting}
            />
          </div>

          {/* Subtitle */}
          <div className="md:col-span-2">
            <label className="block text-xs font-mono uppercase tracking-wider text-editorial-gray mb-1.5">
              Subtitle / Synopsis
            </label>
            <textarea
              rows={2}
              required
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              placeholder="As credentialing expands, we examine the systemic class gaps in social mobility..."
              className="w-full bg-editorial-cream-dark/10 border border-[#e6e2da] p-3 text-sm outline-none text-editorial-charcoal placeholder-editorial-gray/40 focus:border-editorial-accent transition-colors rounded-sm resize-none"
              disabled={isSubmitting}
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-editorial-gray mb-1.5">
              Category
            </label>
            <input
              type="text"
              required
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="Philosophy, Sociology, Ecology..."
              className="w-full bg-editorial-cream-dark/10 border border-[#e6e2da] px-3.5 py-2.5 text-sm outline-none text-editorial-charcoal placeholder-editorial-gray/40 focus:border-editorial-accent transition-colors rounded-sm"
              disabled={isSubmitting}
            />
          </div>

          {/* Reading Time */}
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-editorial-gray mb-1.5">
              Est. Reading Time (minutes)
            </label>
            <input
              type="number"
              required
              min={1}
              value={readingTime}
              onChange={(e) => setReadingTime(Number(e.target.value))}
              className="w-full bg-editorial-cream-dark/10 border border-[#e6e2da] px-3.5 py-2.5 text-sm outline-none text-editorial-charcoal focus:border-editorial-accent transition-colors rounded-sm"
              disabled={isSubmitting}
            />
          </div>

          {/* Section Selector */}
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-editorial-gray mb-1.5">
              Editorial Section
            </label>
            <select
              value={section}
              onChange={(e) => setSection(e.target.value as any)}
              className="w-full bg-editorial-cream-dark/10 border border-[#e6e2da] px-3.5 py-2.5 text-sm outline-none text-editorial-charcoal focus:border-editorial-accent transition-colors rounded-sm cursor-pointer"
              disabled={isSubmitting}
            >
              <option value="national">National</option>
              <option value="international">International</option>
            </select>
          </div>

          {/* Featured Option */}
          <div className="flex items-center space-x-3.5 border border-[#e6e2da] bg-editorial-cream-dark/10 px-4 py-2.5 rounded-sm">
            <input
              id="featured-checkbox"
              type="checkbox"
              checked={featured}
              onChange={(e) => setFeatured(e.target.checked)}
              className="h-4.5 w-4.5 text-editorial-accent border-[#e6e2da] focus:ring-editorial-accent rounded-sm cursor-pointer"
              disabled={isSubmitting}
            />
            <label htmlFor="featured-checkbox" className="text-xs font-mono uppercase tracking-wider text-editorial-charcoal cursor-pointer font-bold select-none">
              Feature on Homepage
            </label>
          </div>

        </div>

        {/* Cover Image Upload Block */}
        <div className="bg-white border border-[#e6e2da] p-6 rounded-sm space-y-4">
          <label className="block text-xs font-mono uppercase tracking-wider text-editorial-gray border-b border-[#e6e2da] pb-2 mb-2 font-bold">
            Cover Illustration
          </label>

          <div className="flex items-center space-x-6">
            <button
              type="button"
              onClick={() => setImageType("upload")}
              className={`text-xs font-mono uppercase tracking-wider px-3.5 py-2 border rounded-sm transition-all cursor-pointer ${
                imageType === "upload"
                  ? "bg-editorial-charcoal border-editorial-charcoal text-white font-bold"
                  : "border-[#e6e2da] text-editorial-gray hover:text-editorial-charcoal hover:bg-editorial-cream-dark/30"
              }`}
            >
              Upload Image File
            </button>
            <button
              type="button"
              onClick={() => setImageType("url")}
              className={`text-xs font-mono uppercase tracking-wider px-3.5 py-2 border rounded-sm transition-all cursor-pointer ${
                imageType === "url"
                  ? "bg-editorial-charcoal border-editorial-charcoal text-white font-bold"
                  : "border-[#e6e2da] text-editorial-gray hover:text-editorial-charcoal hover:bg-editorial-cream-dark/30"
              }`}
            >
              Direct Image URL
            </button>
          </div>

          {imageType === "upload" ? (
            <div className="border border-dashed border-[#e6e2da] bg-editorial-cream-dark/10 p-8 rounded-sm text-center relative hover:bg-editorial-cream-dark/20 transition-colors">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                disabled={isSubmitting}
              />
              <UploadCloud className="h-10 w-10 text-editorial-gray mx-auto mb-3" />
              <p className="text-sm font-bold text-editorial-charcoal">
                {selectedFile ? selectedFile.name : "Choose file to upload"}
              </p>
              <p className="text-xs text-editorial-gray mt-1">PNG, JPG or WEBP up to 5MB</p>
              {uploadProgress > 0 && (
                <div className="mt-4 max-w-xs mx-auto">
                  <div className="h-1.5 w-full bg-[#e6e2da] rounded-full overflow-hidden">
                    <div className="h-full bg-editorial-accent transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                  </div>
                  <span className="text-[10px] font-mono text-editorial-gray mt-1 block">Uploading {uploadProgress}%</span>
                </div>
              )}
            </div>
          ) : (
            <div>
              <input
                type="text"
                value={coverImageUrl}
                onChange={(e) => setCoverImageUrl(e.target.value)}
                placeholder="e.g. https://example.com/cover.jpg"
                className="w-full bg-editorial-cream-dark/10 border border-[#e6e2da] px-3.5 py-2.5 text-sm outline-none text-editorial-charcoal focus:border-editorial-accent transition-colors rounded-sm"
                disabled={isSubmitting}
              />
              <span className="text-[10px] font-mono text-editorial-gray mt-1 block">
                Use remote absolute HTTPS URLs for cover illustration images.
              </span>
            </div>
          )}
        </div>

        {/* Author details */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-white border border-[#e6e2da] p-6 rounded-sm">
          <div className="md:col-span-1">
            <label className="block text-xs font-mono uppercase tracking-wider text-editorial-gray mb-1.5">
              Author Name
            </label>
            <input
              type="text"
              required
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              placeholder="e.g. Dr. Alistair Thorne"
              className="w-full bg-editorial-cream-dark/10 border border-[#e6e2da] px-3.5 py-2.5 text-sm outline-none text-editorial-charcoal focus:border-editorial-accent transition-colors rounded-sm"
              disabled={isSubmitting}
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs font-mono uppercase tracking-wider text-editorial-gray mb-1.5">
              Author Biography
            </label>
            <input
              type="text"
              required
              value={authorBio}
              onChange={(e) => setAuthorBio(e.target.value)}
              placeholder="e.g. Senior Lecturer in Sociology, researching inequality paradigms..."
              className="w-full bg-editorial-cream-dark/10 border border-[#e6e2da] px-3.5 py-2.5 text-sm outline-none text-editorial-charcoal focus:border-editorial-accent transition-colors rounded-sm"
              disabled={isSubmitting}
            />
          </div>
        </div>

        {/* Article Content Markdown Editor */}
        <div className="bg-white border border-[#e6e2da] p-6 rounded-sm space-y-4">
          <div className="flex justify-between items-center border-b border-[#e6e2da] pb-3.5">
            <label className="block text-xs font-mono uppercase tracking-wider text-editorial-gray font-bold">
              Article Body Content
            </label>
            <span className="text-[10px] font-mono text-editorial-gray">
              Supports markdown headers, lists, quotes, inline formatting, and custom images.
            </span>
          </div>

          <MarkdownEditor
            value={content}
            onChange={setContent}
            isSubmitting={isSubmitting}
          />
        </div>

        {/* Submit */}
        <div className="flex justify-end pt-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center bg-editorial-accent hover:bg-editorial-charcoal text-white uppercase text-xs tracking-widest font-bold px-6 py-3.5 rounded-sm transition-all shadow-xs cursor-pointer disabled:opacity-50"
          >
            <Save className="h-4 w-4 mr-2" />
            {isSubmitting ? "Uploading & Publishing..." : "Publish Article"}
          </button>
        </div>
      </form>
    </div>
  );
}
