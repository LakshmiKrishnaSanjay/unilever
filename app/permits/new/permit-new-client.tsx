"use client";

import React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { PERMIT_FORMS, PERMIT_FORM_NAMES } from "@/components/permits/forms";
import type { PermitType , Worker  } from "@/lib/types";
import { supabase } from "@/lib/supabase-client"; // <-- change if your file path differs

const DRAFT_KEY = "ptw_create_draft_v1";

function isPermitType(value: string): value is PermitType {
  return (
    value === "HOT_WORK" ||
    value === "WORK_AT_HEIGHT" ||
    value === "CONFINED_SPACE" ||
    value === "EXCAVATION" ||
    value === "ELECTRICAL_ISOLATION" ||
    value === "PIPEWORK_ISOLATION" ||
    value === "MASTER"
  );
}

export default function PermitNewClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const mocId = searchParams.get("mocId") ?? undefined;

  const [permitType, setPermitType] = React.useState<PermitType>("HOT_WORK");
  const [data, setData] = React.useState<any>({});
  const [savedAt, setSavedAt] = React.useState<string | null>(null);

  // DB fields (minimal required)
  const [title, setTitle] = React.useState("");
  const [location, setLocation] = React.useState("");
  const [start_datetime, setStartDatetime] = React.useState("");
  const [end_datetime, setEndDatetime] = React.useState("");

  // optional flags
  const [requires_facilities_review, setRequiresFacilitiesReview] = React.useState(false);
  const [requires_efs_review, setRequiresEfsReview] = React.useState(false);

  const [workers, setWorkers] = React.useState<Worker[]>([
  {
    name: "",
    idPassport: "",
    role: "",
    contact: "",
    badge: "",
  },
]);

  const [submitting, setSubmitting] = React.useState(false);

  React.useEffect(() => {
    try {
      const raw = sessionStorage.getItem(DRAFT_KEY);
      if (!raw) return;

      const parsed = JSON.parse(raw);

      if (parsed?.permitType && isPermitType(parsed.permitType)) {
        setPermitType(parsed.permitType);
      }
      if (parsed?.data) setData(parsed.data);

      // restore extra fields if present
      if (typeof parsed?.title === "string") setTitle(parsed.title);
      if (typeof parsed?.location === "string") setLocation(parsed.location);
      if (typeof parsed?.start_datetime === "string") setStartDatetime(parsed.start_datetime);
      if (typeof parsed?.end_datetime === "string") setEndDatetime(parsed.end_datetime);
      if (typeof parsed?.requires_facilities_review === "boolean")
        setRequiresFacilitiesReview(parsed.requires_facilities_review);
      if (typeof parsed?.requires_efs_review === "boolean") setRequiresEfsReview(parsed.requires_efs_review);
      if (Array.isArray(parsed?.workers)) setWorkers(parsed.workers);
    } catch {}
  }, []);

  React.useEffect(() => {
    try {
      sessionStorage.setItem(
        DRAFT_KEY,
        JSON.stringify({
          mocId,
          permitType,
          data,

          // extra fields saved in draft
          title,
          location,
          start_datetime,
          end_datetime,
          requires_facilities_review,
          requires_efs_review,
          workers,

          updatedAt: new Date().toISOString(),
        })
      );
    } catch {}
  }, [
    mocId,
    permitType,
    data,
    title,
    location,
    start_datetime,
    end_datetime,
    requires_facilities_review,
    requires_efs_review,
    workers,
  ]);

  const FormComponent = PERMIT_FORMS[permitType];

  const clearDraft = () => {
    sessionStorage.removeItem(DRAFT_KEY);
    setData({});
    setSavedAt(null);

    setTitle("");
    setLocation("");
    setStartDatetime("");
    setEndDatetime("");
    setRequiresFacilitiesReview(false);
    setRequiresEfsReview(false);
      setWorkers([
    {
      name: "",
      idPassport: "",
      role: "",
      contact: "",
      badge: "",
    },
  ]);
  };

  const manualSave = () => {
    setSavedAt(new Date().toLocaleString());
    toast.success("Draft saved locally");
  };

  const addWorker = () => {
  setWorkers((prev) => [
    ...prev,
    {
      name: "",
      idPassport: "",
      role: "",
      contact: "",
      badge: "",
    },
  ]);
};

const removeWorker = (index: number) => {
  setWorkers((prev) => prev.filter((_, i) => i !== index));
};

const updateWorker = (
  index: number,
  field: keyof Worker,
  value: string
) => {
  setWorkers((prev) =>
    prev.map((worker, i) =>
      i === index ? { ...worker, [field]: value } : worker
    )
  );
};

  const submitToDB = async () => {
    // Your API you shared earlier requires moc_id + required fields
    if (!mocId) {
      toast.error("Missing mocId in URL");
      return;
    }

    if (!title.trim()) return toast.error("Title is required");
    if (!location.trim()) return toast.error("Location is required");
    if (!start_datetime) return toast.error("Start date/time is required");
    if (!end_datetime) return toast.error("End date/time is required");

    setSubmitting(true);
    try {
      // Get token (same pattern as your createPTW function)
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) {
        toast.error("Not authenticated");
        return;
      }

      const cleanedWorkers: Worker[] = workers
  .map((w, idx) => ({
    name: w.name?.trim() || "",
    idPassport: w.idPassport?.trim() || "",
    role: w.role?.trim() || "",
    contact: w.contact?.trim() || "",
    badge: `W${String(idx + 1).padStart(3, "0")}`,
  }))
  .filter((w) => w.name || w.idPassport || w.role || w.contact);

if (cleanedWorkers.length === 0) {
  return toast.error("At least one worker is required");
}

const hasInvalidWorker = cleanedWorkers.some(
  (w) => !w.name || !w.idPassport || !w.role || !w.contact
);

if (hasInvalidWorker) {
  return toast.error("Please complete all worker fields");
}

      const payload = {
        moc_id: mocId,
        title: title.trim(),
        permit_type: permitType,
        location: location.trim(),
        start_datetime,
        end_datetime,
        requires_facilities_review,
        requires_efs_review,
        worker_list: cleanedWorkers,

        // matches your DB column `supporting_permit jsonb`
        supporting_permit: FormComponent ? { type: permitType, data } : null,
      };

      const res = await fetch("/api/admin/permit/create", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Create PTW failed");

      const id = json?.id as string | undefined;
      if (!id) throw new Error("No PTW id returned");

      toast.success("PTW created successfully");
      sessionStorage.removeItem(DRAFT_KEY);

      // Go to detail page
      router.push(`/permits`);
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || "Failed to create PTW");
    } finally {
      setSubmitting(false);
    }
  };
React.useEffect(() => {
  const getProfile = async () => {
    const { data: authData } = await supabase.auth.getUser();
    if (!authData?.user) return;

    const { data: profile, error } = await supabase
      .from("users")
      .select("*")
      .eq("auth_id", authData.user.id)
      .single();

    if (error) {
      console.error("Profile fetch error:", error);
      return;
    }

    console.log("DB profile:", profile);
  };

  getProfile();
}, []);


  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Create PTW</h1>
        <p className="text-sm text-muted-foreground">
          {mocId ? `Linked MOC: ${mocId}` : "No MOC linked (optional)"}
        </p>
      </div>

      {/* Basic PTW fields */}
      <div className="grid gap-3 max-w-xl">
        <label className="text-sm font-medium">Title</label>
        <input
          className="h-10 rounded-md border bg-background px-3 text-sm"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="PTW title"
        />

        <label className="text-sm font-medium">Location</label>
        <input
          className="h-10 rounded-md border bg-background px-3 text-sm"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="Site / area"
        />

        <label className="text-sm font-medium">Start Date & Time</label>
        <input
          type="datetime-local"
          className="h-10 rounded-md border bg-background px-3 text-sm"
          value={start_datetime}
          onChange={(e) => setStartDatetime(e.target.value)}
        />

        <label className="text-sm font-medium">End Date & Time</label>
        <input
          type="datetime-local"
          className="h-10 rounded-md border bg-background px-3 text-sm"
          value={end_datetime}
          onChange={(e) => setEndDatetime(e.target.value)}
        />

        <label className="text-sm font-medium">Permit Type</label>
        <select
          className="h-10 rounded-md border bg-background px-3 text-sm"
          value={permitType}
          onChange={(e) => setPermitType(e.target.value as PermitType)}
        >
          <option value="HOT_WORK">{PERMIT_FORM_NAMES.HOT_WORK}</option>
          <option value="WORK_AT_HEIGHT">{PERMIT_FORM_NAMES.WORK_AT_HEIGHT}</option>
          <option value="CONFINED_SPACE">{PERMIT_FORM_NAMES.CONFINED_SPACE}</option>
          <option value="EXCAVATION">{PERMIT_FORM_NAMES.EXCAVATION}</option>
          <option value="ELECTRICAL_ISOLATION">{PERMIT_FORM_NAMES.ELECTRICAL_ISOLATION}</option>
          <option value="PIPEWORK_ISOLATION">{PERMIT_FORM_NAMES.PIPEWORK_ISOLATION}</option>
          <option value="MASTER">{PERMIT_FORM_NAMES.MASTER}</option>
        </select>

        <div className="flex items-center gap-2 pt-2">
          <input
            id="fac"
            type="checkbox"
            checked={requires_facilities_review}
            onChange={(e) => setRequiresFacilitiesReview(e.target.checked)}
          />
          <label htmlFor="fac" className="text-sm">
            Requires Facilities Review
          </label>
        </div>

        <div className="flex items-center gap-2">
          <input
            id="efs"
            type="checkbox"
            checked={requires_efs_review}
            onChange={(e) => setRequiresEfsReview(e.target.checked)}
          />
          <label htmlFor="efs" className="text-sm">
            Requires EFS Review
          </label>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <button
            className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground disabled:opacity-60"
            onClick={manualSave}
            type="button"
            disabled={submitting}
          >
            Save Draft
          </button>

          <button
            className="inline-flex h-9 items-center justify-center rounded-md border px-4 text-sm disabled:opacity-60"
            onClick={clearDraft}
            type="button"
            disabled={submitting}
          >
            Clear Draft
          </button>

          <button
            className="inline-flex h-9 items-center justify-center rounded-md bg-foreground px-4 text-sm font-medium text-background disabled:opacity-60"
            onClick={submitToDB}
            type="button"
            disabled={submitting}
          >
            {submitting ? "Submitting..." : "Submit PTW"}
          </button>

          {savedAt && <span className="text-xs text-muted-foreground">Saved: {savedAt}</span>}
        </div>
      </div>

      {/* Supporting form */}
      <div className="rounded-lg border p-4">
        <div className="text-sm font-medium mb-2">Form</div>

        {!FormComponent ? (
          <div className="text-sm text-muted-foreground">No supporting form for this permit type.</div>
        ) : (
          <FormComponent data={data} onChange={(next: any) => setData(next)} readOnly={false} />
        )}
      </div>


      <div className="rounded-lg border p-4 space-y-4 max-w-4xl">
  <div className="flex items-center justify-between">
    <div className="text-sm font-medium">Workers</div>
    <button
      type="button"
      onClick={addWorker}
      className="inline-flex h-9 items-center justify-center rounded-md border px-3 text-sm"
    >
      Add Worker
    </button>
  </div>

  {workers.map((worker, index) => (
    <div key={index} className="grid gap-3 rounded-md border p-3 md:grid-cols-2">
      <div>
        <label className="text-sm font-medium">Worker Name</label>
        <input
          className="mt-1 h-10 w-full rounded-md border bg-background px-3 text-sm"
          value={worker.name}
          onChange={(e) => updateWorker(index, "name", e.target.value)}
          placeholder="Worker name"
        />
      </div>

      <div>
        <label className="text-sm font-medium">ID / Passport</label>
        <input
          className="mt-1 h-10 w-full rounded-md border bg-background px-3 text-sm"
          value={worker.idPassport || ""}
          onChange={(e) => updateWorker(index, "idPassport", e.target.value)}
          placeholder="ID / passport"
        />
      </div>

      <div>
        <label className="text-sm font-medium">Role</label>
        <input
          className="mt-1 h-10 w-full rounded-md border bg-background px-3 text-sm"
          value={worker.role}
          onChange={(e) => updateWorker(index, "role", e.target.value)}
          placeholder="Role"
        />
      </div>

      <div>
        <label className="text-sm font-medium">Contact</label>
        <input
          className="mt-1 h-10 w-full rounded-md border bg-background px-3 text-sm"
          value={worker.contact || ""}
          onChange={(e) => updateWorker(index, "contact", e.target.value)}
          placeholder="Contact number"
        />
      </div>

      {workers.length > 1 && (
        <div className="md:col-span-2">
          <button
            type="button"
            onClick={() => removeWorker(index)}
            className="inline-flex h-9 items-center justify-center rounded-md border px-3 text-sm text-red-600"
          >
            Remove Worker
          </button>
        </div>
      )}
    </div>
  ))}
</div>

      
    </div>
  );
}