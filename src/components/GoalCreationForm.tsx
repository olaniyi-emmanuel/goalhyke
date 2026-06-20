"use client";

import React, { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface GoalCreationFormProps {
  initialCategory?: string;
  onCancel?: () => void;
}

const deadlineOptions = [
  { label: "--pick your timeline--", value: "" },
  { label: "Tomorrow", value: "tomorrow" },
  { label: "In 3 days", value: "3-days" },
  { label: "In 1 week", value: "1-week" },
  { label: "In 2 weeks", value: "2-weeks" },
  { label: "In 1 month", value: "1-month" },
  { label: "In 3 months", value: "3-months" },
];

const workDayOptions = [
  { label: "--select--", value: "" },
  { label: "Weekdays", value: "weekdays" },
  { label: "Weekends", value: "weekends" },
  { label: "Monday, Wednesday, Friday", value: "monday-wednesday-friday" },
  { label: "Tuesday, Thursday", value: "tuesday-thursday" },
  { label: "Every day", value: "every-day" },
];

const reminderOptions = [
  { label: "--select--", value: "" },
  { label: "No reminders", value: "none" },
  { label: "Every morning", value: "morning" },
  { label: "Every evening", value: "evening" },
  { label: "One day before deadline", value: "before-deadline" },
];

const tokenOptions = [
  { label: "--select--", value: "" },
  { label: "20 tokens (Minimum)", value: "20" },
  { label: "25 tokens", value: "25" },
  { label: "50 tokens", value: "50" },
  { label: "100 tokens", value: "100" },
];

const tokenFateOptions = [
  { label: "--select--", value: "" },
  { label: "Donate to charity", value: "charity" },
  { label: "Return to GoalHyke pool", value: "goalhyke-pool" },
  { label: "Give to my referee", value: "referee" },
  { label: "Burn the tokens", value: "burn" },
];

const submissionModeOptions = [
  { label: "--select submission mode--", value: "" },
  { label: "Image / Screenshot upload", value: "image" },
  { label: "Video / Screen recording upload", value: "video" },
  { label: "Text Log / Written proof (no file required)", value: "text" },
];

function resolveEndDate(deadline: string) {
  const start = new Date();
  const end = new Date(start);

  switch (deadline) {
    case "tomorrow":
      end.setDate(end.getDate() + 1);
      break;
    case "3-days":
      end.setDate(end.getDate() + 3);
      break;
    case "1-week":
      end.setDate(end.getDate() + 7);
      break;
    case "2-weeks":
      end.setDate(end.getDate() + 14);
      break;
    case "1-month":
      end.setMonth(end.getMonth() + 1);
      break;
    case "3-months":
      end.setMonth(end.getMonth() + 3);
      break;
    default:
      end.setDate(end.getDate() + 7);
      break;
  }

  return {
    startDate: start.toISOString().split("T")[0],
    endDate: end.toISOString().split("T")[0],
  };
}

const fieldShell =
  "w-full rounded-[3px] border border-[#ececec] bg-white px-4 py-4 text-[12px] text-[#8f8d8d] shadow-[0_0_4px_rgba(0,0,0,0.12)] outline-none transition-[border,box-shadow] focus:border-[#7655fb] focus:shadow-[0_0_0_4px_rgba(118,85,251,0.08)]";

const GoalCreationForm = ({
  initialCategory = "",
  onCancel,
}: GoalCreationFormProps) => {
  const [formData, setFormData] = useState({
    specificTask: "",
    successDefinition: "",
    deadline: "",
    workDays: "",
    importance: "",
    reminderPreference: "",
    tokenCommitment: "",
    tokenFate: "",
    submissionMode: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!initialCategory) {
      return;
    }

    setFormData((prev) => ({
      ...prev,
      specificTask: prev.specificTask || initialCategory,
      importance:
        prev.importance ||
        `Completing ${initialCategory.toLowerCase()} keeps me moving toward my bigger goal.`,
    }));
  }, [initialCategory]);

  const category = useMemo(
    () => initialCategory || "Custom target",
    [initialCategory],
  );

  const handleChange = (
    event: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const requiredValues = [
      formData.specificTask,
      formData.successDefinition,
      formData.deadline,
      formData.workDays,
      formData.importance,
      formData.reminderPreference,
      formData.tokenCommitment,
      formData.tokenFate,
      formData.submissionMode,
    ];

    if (requiredValues.some((value) => !value.trim())) {
      setError("Please fill in all fields before creating this target.");
      return;
    }

    setError(null);
    setSuccess(false);
    setIsLoading(true);

    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setError("You must be logged in to create a goal.");
        return;
      }

      const { startDate, endDate } = resolveEndDate(formData.deadline);
      const description = [
        `Success criteria: ${formData.successDefinition}.`,
        `Planned work days: ${formData.workDays}.`,
        `Why this matters: ${formData.importance}.`,
        `Reminder preference: ${formData.reminderPreference}.`,
        `Submission mode: ${formData.submissionMode}.`,
        `Token commitment: ${formData.tokenCommitment} tokens.`,
        `If missed: ${formData.tokenFate}.`,
      ].join(" ");

      const { data: profile } = await supabase
        .from("profiles")
        .select("tokens")
        .eq("id", user.id)
        .maybeSingle();

      const tokenBalance =
        profile && typeof profile.tokens === "number" ? profile.tokens : 0;

      const tokensToCommit = parseInt(formData.tokenCommitment) || 20;

      if (tokenBalance < tokensToCommit) {
        setError(`Insufficient tokens! You need ${tokensToCommit} tokens, but you only have ${tokenBalance} tokens.`);
        setIsLoading(false);
        return;
      }

      const { error: profileError } = await supabase
        .from("profiles")
        .update({ tokens: tokenBalance - tokensToCommit })
        .eq("id", user.id);

      if (profileError) {
        throw new Error(`Profile update failed: ${profileError.message}`);
      }

      const metadata = {
        committed_tokens: tokensToCommit,
        remaining_committed: tokensToCommit,
        failures_count: 0,
        failures_logged: [],
        success_logged: [],
        deductions_history: [],
        submission_mode: formData.submissionMode,
      };

      const { error: insertError } = await supabase.from("goals").insert({
        user_id: user.id,
        title: formData.specificTask,
        category,
        start_date: startDate,
        end_date: endDate,
        description,
        metadata,
      });

      if (insertError) {
        setError(insertError.message);
        return;
      }

      setSuccess(true);
      setFormData({
        specificTask: initialCategory || "",
        successDefinition: "",
        deadline: "",
        workDays: "",
        importance: "",
        reminderPreference: "",
        tokenCommitment: "",
        tokenFate: "",
        submissionMode: "",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto flex w-full max-w-[560px] flex-col gap-6"
    >
      {error && (
        <div className="rounded-[8px] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-500">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-[8px] border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-600">
          Goal created successfully!
        </div>
      )}

      <div className="flex flex-col gap-3">
        <label className="text-[14px] font-semibold text-[#262525]">
          What is the specific task you want to complete?
        </label>
        <input
          type="text"
          name="specificTask"
          value={formData.specificTask}
          onChange={handleChange}
          placeholder="e.g Write 1000 words for my novel"
          disabled={isLoading}
          className={fieldShell}
        />
      </div>

      <div className="flex flex-col gap-3">
        <label className="text-[14px] font-semibold text-[#262525]">
          What does success look like for this task? How will you know it&apos;s
          finished?
        </label>
        <textarea
          name="successDefinition"
          value={formData.successDefinition}
          onChange={handleChange}
          placeholder="The document is saved and a word count of 1000 is reached"
          disabled={isLoading}
          className={`${fieldShell} min-h-[92px] resize-none`}
        />
      </div>

      <div className="flex flex-col gap-3">
        <label className="text-[14px] font-semibold text-[#262525]">
          What is your final deadline for completing this task?
        </label>
        <select
          name="deadline"
          value={formData.deadline}
          onChange={handleChange}
          disabled={isLoading}
          className={`${fieldShell} cursor-pointer`}
        >
          {deadlineOptions.map((option) => (
            <option key={option.label} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-3">
        <label className="text-[14px] font-semibold text-[#262525]">
          On which days of the week do you plan to work on this?
        </label>
        <select
          name="workDays"
          value={formData.workDays}
          onChange={handleChange}
          disabled={isLoading}
          className={`${fieldShell} cursor-pointer`}
        >
          {workDayOptions.map((option) => (
            <option key={option.label} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-3">
        <label className="text-[14px] font-semibold text-[#262525]">
          Why is it important for you to complete this task?
        </label>
        <textarea
          name="importance"
          value={formData.importance}
          onChange={handleChange}
          placeholder="e.g Write 1000 words for my novel"
          disabled={isLoading}
          className={`${fieldShell} min-h-[92px] resize-none`}
        />
      </div>

      <div className="flex flex-col gap-3">
        <label className="text-[14px] font-semibold text-[#262525]">
          Would you like to receive reminders to work on this task? If so, when?
        </label>
        <select
          name="reminderPreference"
          value={formData.reminderPreference}
          onChange={handleChange}
          disabled={isLoading}
          className={`${fieldShell} cursor-pointer`}
        >
          {reminderOptions.map((option) => (
            <option key={option.label} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-3">
        <label className="text-[14px] font-semibold text-[#262525]">
          What is the mandatory submission mode for verification?
        </label>
        <select
          name="submissionMode"
          value={formData.submissionMode}
          onChange={handleChange}
          disabled={isLoading}
          className={`${fieldShell} cursor-pointer`}
        >
          {submissionModeOptions.map((option) => (
            <option key={option.label} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-3">
        <label className="text-[14px] font-semibold text-[#262525]">
          How many tokens are you willing to commit to this task?
        </label>
        <select
          name="tokenCommitment"
          value={formData.tokenCommitment}
          onChange={handleChange}
          disabled={isLoading}
          className={`${fieldShell} cursor-pointer`}
        >
          {tokenOptions.map((option) => (
            <option key={option.label} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-3">
        <label className="text-[14px] font-semibold text-[#262525]">
          What should be the fate of these tokens be if you fail to meet your
          deadline?
        </label>
        <select
          name="tokenFate"
          value={formData.tokenFate}
          onChange={handleChange}
          disabled={isLoading}
          className={`${fieldShell} cursor-pointer`}
        >
          {tokenFateOptions.map((option) => (
            <option key={option.label} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-6 flex items-center justify-center gap-4 sm:gap-8">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="min-w-[115px] rounded-full border border-[#ff3b3b] bg-white px-6 py-2.5 text-[12px] font-medium text-[#ff3b3b] transition-colors hover:bg-[#fff5f5] disabled:opacity-50"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={isLoading}
          className="gh-btn-primary min-w-[115px] px-6 py-2.5 text-[12px] disabled:opacity-50"
        >
          {isLoading ? "Creating..." : "Create"}
        </button>
      </div>
    </form>
  );
};

export default GoalCreationForm;
