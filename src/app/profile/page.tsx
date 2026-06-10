"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { db, auth } from "@/lib/firebase";
import { doc, updateDoc } from "firebase/firestore";
import { updateProfile, updatePassword, reauthenticateWithCredential, EmailAuthProvider } from "firebase/auth";
import { Lock, Mail, User, ShieldAlert, Check, Loader2, ChevronDown, ChevronUp } from "lucide-react";

export default function ProfilePage() {
  const { user, userData, refreshRole, loading: authLoading } = useAuth();
  const router = useRouter();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [tempPhotoUrl, setTempPhotoUrl] = useState("");
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  // Password reset section
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Status states
  const [isSaving, setIsSaving] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [passwordMsg, setPasswordMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Initialize fields
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
      return;
    }

    if (userData) {
      setFirstName(userData.firstName || "");
      setLastName(userData.lastName || "");
      setEmail(userData.email || user?.email || "");
      setTempPhotoUrl(userData.photoURL || user?.photoURL || "");
    }
  }, [user, userData, authLoading, router]);

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-editorial-cream flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-editorial-accent" />
      </div>
    );
  }

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setStatusMsg(null);
      setIsUploadingPhoto(true);

      try {
        // 1. Get signature from backend
        const signResponse = await fetch("/api/cloudinary-sign", {
          method: "POST",
        });

        if (!signResponse.ok) {
          throw new Error("Failed to authenticate upload request.");
        }

        const { signature, timestamp, apiKey, preset, cloudName } = await signResponse.json();

        // 2. Perform signed upload to Cloudinary
        const formData = new FormData();
        formData.append("file", file);
        formData.append("api_key", apiKey);
        formData.append("timestamp", timestamp.toString());
        formData.append("upload_preset", preset);
        formData.append("signature", signature);

        const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData?.error?.message || "Failed to upload profile photo to Cloudinary.");
        }

        const data = await response.json();
        setTempPhotoUrl(data.secure_url);
        setStatusMsg({ type: "success", text: "Photo uploaded. Save profile to confirm changes." });
      } catch (err: any) {
        console.error("Error uploading profile photo:", err);
        setStatusMsg({ type: "error", text: err.message || "Failed to upload photo." });
      } finally {
        setIsUploadingPhoto(false);
      }
    }
  };

  const handleRemovePhoto = () => {
    setTempPhotoUrl("");
    setStatusMsg({ type: "success", text: "Photo removed. Save profile to confirm changes." });
  };

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMsg(null);
    setIsSaving(true);

    try {
      // 1. Update Auth display name & photoURL
      const newDisplayName = `${firstName.trim()} ${lastName.trim()}`.trim();
      await updateProfile(user, {
        displayName: newDisplayName,
        photoURL: tempPhotoUrl,
      });

      // 2. Update Firestore Document
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        name: newDisplayName, // keep legacy field in sync
        photoURL: tempPhotoUrl,
      });

      // Refresh authentication context state
      await refreshRole();
      setStatusMsg({ type: "success", text: "Profile updated successfully." });
    } catch (err: any) {
      console.error("Error updating profile:", err);
      setStatusMsg({ type: "error", text: err.message || "Failed to update profile." });
    } finally {
      setIsSaving(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMsg(null);

    if (!currentPassword) {
      setPasswordMsg({ type: "error", text: "Please enter your current password." });
      return;
    }

    if (newPassword.length < 6) {
      setPasswordMsg({ type: "error", text: "New password must be at least 6 characters." });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: "error", text: "New passwords do not match." });
      return;
    }

    setIsResettingPassword(true);

    try {
      // Reauthenticate user
      const credential = EmailAuthProvider.credential(user.email!, currentPassword);
      await reauthenticateWithCredential(user, credential);

      // Update password
      await updatePassword(user, newPassword);

      setPasswordMsg({ type: "success", text: "Password updated successfully." });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      console.error("Error updating password:", err);
      setPasswordMsg({
        type: "error",
        text: err.code === "auth/wrong-password"
          ? "Incorrect current password."
          : err.message || "Failed to update password.",
      });
    } finally {
      setIsResettingPassword(false);
    }
  };

  // Avatar rendering helper matching Navbar tones
  const getAvatarColor = (name: string): string => {
    const AVATAR_COLORS = [
      "#9d2b2b", "#c39a5b", "#2b6e9d", "#6e2b9d", "#2b9d6e",
      "#9d6e2b", "#5b5bc3", "#9d2b6e", "#2b9d9d", "#6e9d2b",
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
  };

  const avatarLetter = firstName?.charAt(0)?.toUpperCase() || "?";
  const avatarColor = getAvatarColor(firstName || "User");

  return (
    <div className="min-h-screen bg-editorial-cream py-16 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-2xl mx-auto">
        <div className="mb-10 text-center">
          <span className="text-[10px] font-mono tracking-widest uppercase text-editorial-gold font-bold">
            Account Management
          </span>
          <h1 className="font-serif text-4xl font-bold text-editorial-charcoal mt-2">
            Edit Profile
          </h1>
          <p className="text-sm text-editorial-gray font-light mt-2 max-w-sm mx-auto">
            Update your personal details or change your security credentials.
          </p>
        </div>

        <div className="bg-white border border-[#e6e2da] p-5 sm:p-8 rounded-sm shadow-xs space-y-8">
          {/* Unified Profile Form */}
          <form onSubmit={handleProfileSave} className="space-y-6">
            {statusMsg && (
              <div className={`flex items-center text-xs p-3 rounded-sm border ${
                statusMsg.type === "success" 
                  ? "bg-emerald-50 border-emerald-200 text-emerald-800" 
                  : "bg-red-50 border-red-200 text-editorial-accent"
              }`}>
                {statusMsg.type === "success" ? (
                  <Check className="h-4.5 w-4.5 mr-2 flex-shrink-0" />
                ) : (
                  <ShieldAlert className="h-4.5 w-4.5 mr-2 flex-shrink-0" />
                )}
                {statusMsg.text}
              </div>
            )}
            {/* Profile Picture Uploader */}
            <div className="flex flex-col sm:flex-row items-center gap-6 pb-6 border-b border-[#e6e2da]/40">
              <div className="relative group">
                {tempPhotoUrl ? (
                  <div className="h-24 w-24 rounded-full overflow-hidden border border-[#e6e2da] relative">
                    <img
                      src={tempPhotoUrl}
                      alt="Profile Preview"
                      className="object-cover w-full h-full"
                    />
                  </div>
                ) : (
                  <div
                    className="h-24 w-24 rounded-full flex items-center justify-center text-white font-bold text-3xl tracking-wide border border-[#e6e2da]"
                    style={{ backgroundColor: avatarColor }}
                  >
                    {avatarLetter}
                  </div>
                )}
                
                {isUploadingPhoto && (
                  <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-white" />
                  </div>
                )}
              </div>

              <div className="text-center sm:text-left space-y-2">
                <h3 className="text-xs font-mono uppercase tracking-wider text-editorial-gray font-bold">
                  Profile Illustration
                </h3>
                <div className="flex flex-wrap items-center gap-3">
                  <label className="inline-flex items-center px-4 py-2 border border-[#e6e2da] hover:border-editorial-accent text-editorial-charcoal hover:text-editorial-accent bg-white text-xs font-mono uppercase tracking-wider font-bold rounded-sm cursor-pointer transition-all duration-200">
                    <span>Upload New Photo</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoChange}
                      className="hidden"
                      disabled={isSaving || isUploadingPhoto}
                    />
                  </label>
                  {tempPhotoUrl && (
                    <button
                      type="button"
                      onClick={handleRemovePhoto}
                      className="px-4 py-2 border border-transparent text-editorial-accent hover:text-red-700 bg-transparent text-xs font-mono uppercase tracking-wider font-bold cursor-pointer transition-colors duration-200"
                      disabled={isSaving || isUploadingPhoto}
                    >
                      Remove
                    </button>
                  )}
                </div>
                <p className="text-[10px] text-editorial-gray/80 italic">
                  Clear, square PNG, JPG, or WEBP up to 2MB recommended.
                </p>
              </div>
            </div>

            {/* Inputs Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label htmlFor="firstName" className="block text-xs font-mono uppercase tracking-wider text-editorial-gray mb-1.5">
                  First Name
                </label>
                <div className="relative">
                  <input
                    id="firstName"
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full bg-editorial-cream-dark/20 border border-[#e6e2da] px-3.5 py-2.5 text-sm outline-none text-editorial-charcoal focus:border-editorial-accent transition-colors rounded-sm pl-10"
                    placeholder="First Name"
                    disabled={isSaving}
                  />
                  <User className="absolute left-3.5 top-3.5 h-4 w-4 text-editorial-gray/60 stroke-[1.5]" />
                </div>
              </div>

              <div>
                <label htmlFor="lastName" className="block text-xs font-mono uppercase tracking-wider text-editorial-gray mb-1.5">
                  Last Name
                </label>
                <div className="relative">
                  <input
                    id="lastName"
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full bg-editorial-cream-dark/20 border border-[#e6e2da] px-3.5 py-2.5 text-sm outline-none text-editorial-charcoal focus:border-editorial-accent transition-colors rounded-sm pl-10"
                    placeholder="Last Name"
                    disabled={isSaving}
                  />
                  <User className="absolute left-3.5 top-3.5 h-4 w-4 text-editorial-gray/60 stroke-[1.5]" />
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-xs font-mono uppercase tracking-wider text-editorial-gray mb-1.5">
                Email Address (Read-only)
              </label>
              <div className="relative">
                <input
                  id="email"
                  type="email"
                  value={email}
                  disabled
                  className="w-full bg-neutral-100 border border-[#e6e2da] px-3.5 py-2.5 text-sm outline-none text-neutral-400 cursor-not-allowed rounded-sm pl-10"
                />
                <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-neutral-400 stroke-[1.5]" />
              </div>
              <p className="text-[10px] text-editorial-gray/80 mt-1.5 italic">
                Contact administration to request a change of registered email address.
              </p>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isSaving}
                className="group relative w-full sm:w-auto flex justify-center items-center py-3 px-6 border border-transparent text-xs uppercase tracking-widest font-bold text-white bg-editorial-charcoal hover:bg-editorial-accent focus:outline-none transition-all rounded-sm cursor-pointer disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Saving Changes...
                  </>
                ) : (
                  "Save Changes"
                )}
              </button>
            </div>
          </form>

          {/* Collapsible Password Reset Section */}
          <div className="border-t border-[#e6e2da] pt-6">
            <button
              onClick={() => setShowPasswordReset(!showPasswordReset)}
              className="flex items-center justify-between w-full py-2 text-left font-serif text-xl font-bold text-editorial-charcoal hover:text-editorial-accent transition-colors cursor-pointer"
            >
              <span>Security & Password Reset</span>
              {showPasswordReset ? (
                <ChevronUp className="h-5 w-5 text-editorial-gray" />
              ) : (
                <ChevronDown className="h-5 w-5 text-editorial-gray" />
              )}
            </button>

            {showPasswordReset && (
              <form onSubmit={handlePasswordReset} className="mt-6 space-y-6 animate-in fade-in slide-in-from-top-3 duration-250">
                {passwordMsg && (
                  <div className={`flex items-center text-xs p-3 rounded-sm border ${
                    passwordMsg.type === "success"
                      ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                      : "bg-red-50 border-red-200 text-editorial-accent"
                  }`}>
                    {passwordMsg.type === "success" ? (
                      <Check className="h-4.5 w-4.5 mr-2 flex-shrink-0" />
                    ) : (
                      <ShieldAlert className="h-4.5 w-4.5 mr-2 flex-shrink-0" />
                    )}
                    {passwordMsg.text}
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <label htmlFor="currentPassword" className="block text-xs font-mono uppercase tracking-wider text-editorial-gray mb-1.5">
                      Current Password
                    </label>
                    <div className="relative">
                      <input
                        id="currentPassword"
                        type="password"
                        required
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className="w-full bg-editorial-cream-dark/20 border border-[#e6e2da] px-3.5 py-2.5 text-sm outline-none text-editorial-charcoal focus:border-editorial-accent transition-colors rounded-sm pl-10"
                        placeholder="••••••••"
                        disabled={isResettingPassword}
                      />
                      <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-editorial-gray/60 stroke-[1.5]" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="newPassword" className="block text-xs font-mono uppercase tracking-wider text-editorial-gray mb-1.5">
                        New Password (min 6 chars)
                      </label>
                      <div className="relative">
                        <input
                          id="newPassword"
                          type="password"
                          required
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="w-full bg-editorial-cream-dark/20 border border-[#e6e2da] px-3.5 py-2.5 text-sm outline-none text-editorial-charcoal focus:border-editorial-accent transition-colors rounded-sm pl-10"
                          placeholder="••••••••"
                          disabled={isResettingPassword}
                        />
                        <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-editorial-gray/60 stroke-[1.5]" />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="confirmPassword" className="block text-xs font-mono uppercase tracking-wider text-editorial-gray mb-1.5">
                        Confirm New Password
                      </label>
                      <div className="relative">
                        <input
                          id="confirmPassword"
                          type="password"
                          required
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="w-full bg-editorial-cream-dark/20 border border-[#e6e2da] px-3.5 py-2.5 text-sm outline-none text-editorial-charcoal focus:border-editorial-accent transition-colors rounded-sm pl-10"
                          placeholder="••••••••"
                          disabled={isResettingPassword}
                        />
                        <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-editorial-gray/60 stroke-[1.5]" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isResettingPassword}
                    className="group relative w-full sm:w-auto flex justify-center items-center py-3 px-6 border border-transparent text-xs uppercase tracking-widest font-bold text-white bg-editorial-charcoal hover:bg-editorial-accent focus:outline-none transition-all rounded-sm cursor-pointer disabled:opacity-50"
                  >
                    {isResettingPassword ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Updating Password...
                      </>
                    ) : (
                      "Update Password"
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
