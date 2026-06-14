"use client";

import React, { useState } from "react";
import { createClient } from "@/lib/supabase/client";

const GoalCreationForm = () => {
  const [formData, setFormData] = useState({
    title: "",
    category: "",
    startDate: "",
    endDate: "",
    description: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const categories = [
    "Grow wealth",
    "Lose weight",
    "Master tech skill",
    "Exercise regularly",
    "Strengthen your spirit",
    "Level up your career",
    "Excel academically",
    "Read more",
    "Stay healthy",
    "Other"
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.category || !formData.startDate || !formData.endDate) {
      setError("Please fill in all required fields.");
      return;
    }

    setError(null);
    setSuccess(false);
    setIsLoading(true);

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      setError("You must be logged in to create a goal.");
      setIsLoading(false);
      return;
    }

    const { error: insertError } = await supabase.from("goals").insert({
      user_id: user.id,
      title: formData.title,
      category: formData.category,
      start_date: formData.startDate,
      end_date: formData.endDate,
      description: formData.description,
    });

    if (insertError) {
      setError(insertError.message);
      setIsLoading(false);
    } else {
      setSuccess(true);
      setIsLoading(false);
      setFormData({
        title: "",
        category: "",
        startDate: "",
        endDate: "",
        description: "",
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6 max-w-[800px] mx-auto w-full">
      {error && (
        <div className="p-3 text-sm text-red-500 bg-red-50 rounded-[8px] border border-red-200">
          {error}
        </div>
      )}
      {success && (
        <div className="p-3 text-sm text-green-600 bg-green-50 rounded-[8px] border border-green-200">
          Goal created successfully!
        </div>
      )}

      {/* Title */}
      <div className="flex flex-col gap-2">
        <label className="text-[#262525] text-[14px] font-bold font-secondary">
          Goal Title
        </label>
        <input
          type="text"
          name="title"
          placeholder="e.g. Learn React Native"
          value={formData.title}
          onChange={handleChange}
          disabled={isLoading}
          className="w-full h-[50px] px-4 rounded-[10px] border border-[#E0E0E0] bg-[#FAFAFA] text-[#262525] text-[14px] font-secondary focus:outline-none focus:border-[#7655fb] transition-colors disabled:opacity-50"
          required
        />
      </div>

      {/* Category */}
      <div className="flex flex-col gap-2">
        <label className="text-[#262525] text-[14px] font-bold font-secondary">
          Category
        </label>
        <div className="relative">
          <select
            name="category"
            value={formData.category}
            onChange={handleChange}
            disabled={isLoading}
            className="w-full h-[50px] px-4 rounded-[10px] border border-[#E0E0E0] bg-[#FAFAFA] text-[#262525] text-[14px] font-secondary focus:outline-none focus:border-[#7655fb] transition-colors appearance-none cursor-pointer disabled:opacity-50"
            required
          >
            <option value="" disabled>Select a category</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[#717070]">
            <svg width="12" height="8" viewBox="0 0 12 8" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M1 1.5L6 6.5L11 1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </div>
      </div>

      {/* Dates Row */}
      <div className="flex flex-col md:flex-row gap-6">
        <div className="flex-1 flex flex-col gap-2">
          <label className="text-[#262525] text-[14px] font-bold font-secondary">
            Start Date
          </label>
          <input
            type="date"
            name="startDate"
            value={formData.startDate}
            onChange={handleChange}
            disabled={isLoading}
            className="w-full h-[50px] px-4 rounded-[10px] border border-[#E0E0E0] bg-[#FAFAFA] text-[#262525] text-[14px] font-secondary focus:outline-none focus:border-[#7655fb] transition-colors disabled:opacity-50"
            required
          />
        </div>
        <div className="flex-1 flex flex-col gap-2">
          <label className="text-[#262525] text-[14px] font-bold font-secondary">
            End Date
          </label>
          <input
            type="date"
            name="endDate"
            value={formData.endDate}
            onChange={handleChange}
            disabled={isLoading}
            className="w-full h-[50px] px-4 rounded-[10px] border border-[#E0E0E0] bg-[#FAFAFA] text-[#262525] text-[14px] font-secondary focus:outline-none focus:border-[#7655fb] transition-colors disabled:opacity-50"
            required
          />
        </div>
      </div>

      {/* Description */}
      <div className="flex flex-col gap-2">
        <label className="text-[#262525] text-[14px] font-bold font-secondary">
          Description (Optional)
        </label>
        <textarea
          name="description"
          placeholder="Describe your goal..."
          value={formData.description}
          onChange={handleChange}
          disabled={isLoading}
          className="w-full h-[120px] p-4 rounded-[10px] border border-[#E0E0E0] bg-[#FAFAFA] text-[#262525] text-[14px] font-secondary focus:outline-none focus:border-[#7655fb] transition-colors resize-none disabled:opacity-50"
        />
      </div>

      {/* Submit Button */}
      <div className="flex justify-end mt-4">
        <button
          type="submit"
          disabled={isLoading}
          className="bg-[#7655fb] text-white rounded-[50px] px-8 py-3 text-[15px] font-bold font-secondary hover:bg-[#6445e0] transition-colors shadow-lg shadow-[#7655fb]/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[150px]"
        >
          {isLoading ? "Creating..." : "Create Goal"}
        </button>
      </div>
    </form>
  );
};

export default GoalCreationForm;
