"use client";

import React, { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { Upload, AlertCircle, CheckCircle2, Loader2, HelpCircle } from "lucide-react";

export default function TicketForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [category, setCategory] = useState("General Inquiry");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [stepsToReproduce, setStepsToReproduce] = useState("");
  
  // File Upload States
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [attachmentUrl, setAttachmentUrl] = useState<string | null>(null);
  
  // Auth/Session states
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Form submission states
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setUser(session.user);
          setEmail(session.user.email || "");
          
          // Try to extract name
          const fullName = 
            session.user.user_metadata?.full_name || 
            session.user.user_metadata?.name || 
            (session.user.user_metadata?.first_name 
              ? `${session.user.user_metadata.first_name} ${session.user.user_metadata.last_name || ""}`.trim()
              : "");
          setName(fullName || session.user.email?.split("@")[0] || "");
        }
      } catch (err) {
        console.error("Error fetching user session:", err);
      } finally {
        setAuthLoading(false);
      }
    };
    fetchUser();
  }, []);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) {
      return;
    }
    const selectedFile = e.target.files[0];
    
    // Check file size (max 5MB)
    if (selectedFile.size > 5 * 1024 * 1024) {
      setError("File size exceeds 5MB limit.");
      return;
    }

    setFile(selectedFile);
    setError("");
    setUploading(true);

    try {
      const supabase = createClient();
      const fileExt = selectedFile.name.split(".").pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
      const filePath = `tickets/${fileName}`;

      // Upload file directly to Supabase storage
      const { data, error: uploadError } = await supabase.storage
        .from("ticket_attachments")
        .upload(filePath, selectedFile, {
          cacheControl: "3600",
          upsert: false
        });

      if (uploadError) {
        throw uploadError;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from("ticket_attachments")
        .getPublicUrl(filePath);

      setAttachmentUrl(publicUrl);
    } catch (err: any) {
      setError(`Failed to upload attachment: ${err.message || err}`);
      setFile(null);
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveFile = () => {
    setFile(null);
    setAttachmentUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const supabase = createClient();
      
      const ticketData = {
        user_id: user?.id || null,
        customer_name: name,
        customer_email: email,
        category,
        subject,
        description,
        steps_to_reproduce: category === "Technical Bug" ? stepsToReproduce : null,
        attachment_url: attachmentUrl,
        status: "open",
        priority: "normal",
        is_escalated: false
      };

      const { error: insertError } = await supabase
        .from("support_tickets")
        .insert(ticketData);

      if (insertError) {
        throw insertError;
      }

      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-white border border-[#eceff7] rounded-[24px] shadow-xl text-center max-w-xl mx-auto min-h-[350px] animate-in fade-in duration-300">
        <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center text-green-500 mb-6 shadow-inner">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <h3 className="font-primary text-[24px] font-bold text-[#262525] mb-3">Support Ticket Created</h3>
        <p className="font-primary text-[15px] text-[#717070] leading-relaxed max-w-md mb-6">
          Thank you for reaching out. We have logged your request under category <span className="font-semibold text-[#7655fb]">{category}</span>. 
          {user ? " Because you're logged in, we will automatically track updates under your account." : " A confirmation email will be sent to you shortly."}
        </p>
        <button
          onClick={() => {
            setSubmitted(false);
            setSubject("");
            setDescription("");
            setStepsToReproduce("");
            setAttachmentUrl(null);
            setFile(null);
          }}
          className="h-[50px] px-8 bg-[#7655fb] hover:bg-[#6445e0] text-white font-primary text-[15px] font-bold rounded-full transition-all hover:shadow-[0_10px_20px_rgba(118,85,251,0.2)] cursor-pointer"
        >
          Submit Another Request
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto bg-white border border-[#eceff7] rounded-[26px] p-6 md:p-8 shadow-2xl relative z-10">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-[#7655fb]/10 rounded-xl flex items-center justify-center text-[#7655fb]">
          <HelpCircle className="w-6 h-6" />
        </div>
        <div>
          <h2 className="font-primary text-[20px] md:text-[22px] font-bold text-[#262525]">Submit a Support Ticket</h2>
          <p className="font-primary text-[13px] text-[#717070]">Our support team is here to guide you.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        {/* Name and Email */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block font-primary text-[13px] font-bold text-[#4f5b7f]">Name</label>
              {user && (
                <span className="text-[11px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                  Verified User
                </span>
              )}
              {!user && !authLoading && (
                <span className="text-[11px] font-bold text-[#717070] bg-[#f5f6fa] px-2 py-0.5 rounded-full">
                  Guest Mode
                </span>
              )}
            </div>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              disabled={user !== null || authLoading}
              placeholder="Your full name"
              className={`w-full h-[52px] px-4 font-primary text-[15px] border border-[#e4e8f2] bg-[#fbfbff] rounded-[16px] outline-none transition-all focus:border-[#7655fb] focus:bg-white ${
                user ? "text-[#717070] opacity-80 cursor-not-allowed bg-gray-50" : "text-[#262525]"
              }`}
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block font-primary text-[13px] font-bold text-[#4f5b7f]">Email</label>
              {user && (
                <span className="text-[11px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                  Pre-filled
                </span>
              )}
            </div>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={user !== null || authLoading}
              placeholder="your.email@example.com"
              className={`w-full h-[52px] px-4 font-primary text-[15px] border border-[#e4e8f2] bg-[#fbfbff] rounded-[16px] outline-none transition-all focus:border-[#7655fb] focus:bg-white ${
                user ? "text-[#717070] opacity-80 cursor-not-allowed bg-gray-50" : "text-[#262525]"
              }`}
            />
          </div>
        </div>

        {/* Category Dropdown */}
        <div>
          <label className="block font-primary text-[13px] font-bold text-[#4f5b7f] mb-1.5">Category</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full h-[52px] px-4 font-primary text-[15px] text-[#262525] border border-[#e4e8f2] bg-[#fbfbff] rounded-[16px] outline-none transition-all focus:border-[#7655fb] focus:bg-white appearance-none cursor-pointer"
            style={{
              backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%23717070' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><polyline points='6 9 12 15 18 9'></polyline></svg>")`,
              backgroundRepeat: "no-repeat",
              backgroundPosition: "right 16px center",
              backgroundSize: "18px"
            }}
          >
            <option value="General Inquiry">General Inquiry</option>
            <option value="Billing">Billing</option>
            <option value="Technical Bug">Technical Bug</option>
            <option value="Feature Request">Feature Request</option>
          </select>
        </div>

        {/* Subject */}
        <div>
          <label className="block font-primary text-[13px] font-bold text-[#4f5b7f] mb-1.5">Subject</label>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            required
            placeholder="Summarize your issue"
            className="w-full h-[52px] px-4 font-primary text-[15px] text-[#262525] border border-[#e4e8f2] bg-[#fbfbff] rounded-[16px] outline-none transition-all focus:border-[#7655fb] focus:bg-white"
          />
        </div>

        {/* Dynamic field for Technical Bugs */}
        {category === "Technical Bug" && (
          <div className="animate-in slide-in-from-top-2 duration-300">
            <label className="block font-primary text-[13px] font-bold text-[#4f5b7f] mb-1.5">
              Steps to Reproduce
            </label>
            <textarea
              value={stepsToReproduce}
              onChange={(e) => setStepsToReproduce(e.target.value)}
              required
              rows={3}
              placeholder="1. Go to page X&#10;2. Click on button Y&#10;3. See error Z"
              className="w-full p-4 font-primary text-[15px] text-[#262525] border border-[#e4e8f2] bg-[#fbfbff] rounded-[16px] outline-none transition-all focus:border-[#7655fb] focus:bg-white resize-none"
            />
          </div>
        )}

        {/* Description */}
        <div>
          <label className="block font-primary text-[13px] font-bold text-[#4f5b7f] mb-1.5">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            rows={5}
            placeholder="Provide details about your support request..."
            className="w-full p-4 font-primary text-[15px] text-[#262525] border border-[#e4e8f2] bg-[#fbfbff] rounded-[16px] outline-none transition-all focus:border-[#7655fb] focus:bg-white resize-none"
          />
        </div>

        {/* File Attachment Upload */}
        <div>
          <label className="block font-primary text-[13px] font-bold text-[#4f5b7f] mb-1.5">
            Attach Screenshot (Optional)
          </label>
          
          {!file ? (
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-[#e4e8f2] hover:border-[#7655fb] bg-[#fbfbff] hover:bg-[#7655fb]/5 rounded-[18px] p-6 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all"
            >
              {uploading ? (
                <Loader2 className="w-8 h-8 text-[#7655fb] animate-spin" />
              ) : (
                <Upload className="w-8 h-8 text-[#717070]" />
              )}
              <span className="font-primary text-[14px] font-semibold text-[#4f5b7f]">
                {uploading ? "Uploading..." : "Click to upload a screenshot"}
              </span>
              <span className="font-primary text-[11px] text-[#717070]">
                PNG, JPG, JPEG or WEBP (Max 5MB)
              </span>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                className="hidden"
                disabled={uploading}
              />
            </div>
          ) : (
            <div className="flex items-center justify-between border border-[#e4e8f2] bg-[#fbfbff] p-4 rounded-[16px]">
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center text-green-500 shrink-0">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div className="overflow-hidden">
                  <p className="font-primary text-[14px] font-bold text-[#262525] truncate">{file.name}</p>
                  <p className="font-primary text-[11px] text-[#717070]">
                    {(file.size / (1024 * 1024)).toFixed(2)} MB • Uploaded
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleRemoveFile}
                className="font-primary text-[13px] font-semibold text-red-500 hover:text-red-700 px-3 py-1 rounded-lg hover:bg-red-50 transition-all cursor-pointer"
              >
                Remove
              </button>
            </div>
          )}
        </div>

        {error && (
          <div className="flex items-center gap-2 bg-red-50 text-red-600 px-4 py-3 rounded-[14px] border border-red-100">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span className="font-primary text-[13px] font-medium leading-tight">{error}</span>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={submitting || uploading}
          className="h-[52px] w-full bg-[#7655fb] hover:bg-[#6445e0] text-white font-primary text-[15px] font-bold rounded-[18px] hover:shadow-[0_12px_24px_rgba(118,85,251,0.24)] transition-all cursor-pointer shadow-md hover:translate-y-[-1px] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2 mt-2"
        >
          {submitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Submitting Ticket...
            </>
          ) : (
            "Submit Ticket"
          )}
        </button>
      </form>
    </div>
  );
}
