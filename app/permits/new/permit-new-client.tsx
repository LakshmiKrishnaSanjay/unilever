"use client";

import React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { PERMIT_FORMS, PERMIT_FORM_NAMES } from "@/components/permits/forms";
import type { PermitType, Worker } from "@/lib/types";
import { supabase } from "@/lib/supabase-client";
import { useWorkflowActions } from "@/lib/use-workflow";

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

function createEmptyWorker(): Worker {
  return {
    name: "",
    idPassport: "",
    role: "",
    contact: "",
    badge: "",
  };
}

export default function PermitNewClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const workflowActions = useWorkflowActions();

  const mocId = searchParams.get("mocId") ?? undefined;

  const [permitType, setPermitType] = React.useState<PermitType>("HOT_WORK");
  const [data, setData] = React.useState<any>({});
  const [savedAt, setSavedAt] = React.useState<string | null>(null);

  const [title, setTitle] = React.useState("");
  const [location, setLocation] = React.useState("");
  const [start_datetime, setStartDatetime] = React.useState("");
  const [end_datetime, setEndDatetime] = React.useState("");

  const [requires_facilities_review, setRequiresFacilitiesReview] = React.useState(false);
  const [requires_efs_review, setRequiresEfsReview] = React.useState(false);

  const [workers, setWorkers] = React.useState<Worker[]>([createEmptyWorker()]);

  const [draftId, setDraftId] = React.useState<string | null>(null);
  const [savingDraft, setSavingDraft] = React.useState(false);
  const [clearingDraft, setClearingDraft] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);

  const FormComponent = PERMIT_FORMS[permitType];

  const addWorker = () => {
    setWorkers((prev) => [...prev, createEmptyWorker()]);
  };

  const removeWorker = (index: number) => {
    setWorkers((prev) => {
      const next = prev.filter((_, i) => i !== index);
      return next.length > 0 ? next : [createEmptyWorker()];
    });
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

  const buildPayload = React.useCallback(() => {
    const cleanedWorkers: Worker[] = workers.map((w, idx) => ({
      name: w.name?.trim() || "",
      idPassport: w.idPassport?.trim() || "",
      role: w.role?.trim() || "",
      contact: w.contact?.trim() || "",
      badge: w.badge?.trim() || `W${String(idx + 1).padStart(3, "0")}`,
      badge_id: (w as any).badge_id ?? null,
      badgeId: (w as any).badgeId ?? null,
    }));

    return {
      id: draftId ?? undefined,
      moc_id: mocId ?? null,
      title: title.trim() || null,
      permit_type: permitType,
      location: location.trim() || null,
      start_datetime: start_datetime || null,
      end_datetime: end_datetime || null,
      requires_facilities_review,
      requires_efs_review,
      requires_stakeholder_closure: false,
      worker_list: cleanedWorkers,
      supporting_permit: FormComponent ? { type: permitType, data } : null,
    };
  }, [
    draftId,
    mocId,
    title,
    permitType,
    location,
    start_datetime,
    end_datetime,
    requires_facilities_review,
    requires_efs_review,
    workers,
    FormComponent,
    data,
  ]);

  const resetForm = React.useCallback(() => {
    setDraftId(null);
    setPermitType("HOT_WORK");
    setData({});
    setSavedAt(null);
    setTitle("");
    setLocation("");
    setStartDatetime("");
    setEndDatetime("");
    setRequiresFacilitiesReview(false);
    setRequiresEfsReview(false);
    setWorkers([createEmptyWorker()]);
  }, []);

  const handleSaveDraft = async () => {
    if (!mocId) {
      toast.error("Missing mocId in URL");
      return;
    }

    try {
      setSavingDraft(true);

      const res = await workflowActions.savePTWDraft(buildPayload());

      if (!res.success) {
        toast.error(res.error || "Failed to save draft");
        return;
      }

      if (res.id) {
        setDraftId(res.id);
        setSavedAt(new Date().toLocaleString());
        toast.success("Draft saved successfully");
        router.push(`/permits/${res.id}/edit`);
        return;
      }

      toast.success("Draft saved successfully");
      setSavedAt(new Date().toLocaleString());
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || "Failed to save draft");
    } finally {
      setSavingDraft(false);
    }
  };

  const handleClearDraft = async () => {
    try {
      setClearingDraft(true);

      if (draftId) {
        const res = await workflowActions.clearPTWDraft(draftId);

        if (!res.success) {
          toast.error(res.error || "Failed to clear draft");
          return;
        }

        toast.success("Draft cleared successfully");
        resetForm();
        router.replace(`/permits/new${mocId ? `?mocId=${mocId}` : ""}`);
        return;
      }

      resetForm();
      toast.success("Form cleared");
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || "Failed to clear draft");
    } finally {
      setClearingDraft(false);
    }
  };

  const handleSubmit = async () => {
    if (!mocId) {
      toast.error("Missing mocId in URL");
      return;
    }

    setSubmitting(true);
    try {
      let ptwId = draftId;

      if (!ptwId) {
        const saveRes = await workflowActions.savePTWDraft(buildPayload());

        if (!saveRes.success || !saveRes.id) {
          toast.error(saveRes.error || "Failed to save draft before submit");
          return;
        }

        ptwId = saveRes.id;
        setDraftId(ptwId);
      }

      const submitRes = await workflowActions.submitPTW(ptwId);

      if (!submitRes.success) {
        toast.error(submitRes.error || "Failed to submit PTW");
        return;
      }

      toast.success("PTW submitted successfully");
      router.push(`/permits/${ptwId}`);
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
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-xl font-semibold">Create PTW</h1>
        <p className="text-sm text-muted-foreground">
          {mocId ? `Linked MOC: ${mocId}` : "No MOC linked"}
        </p>
      </div>

      <div className="grid max-w-xl gap-3">
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
          onChange={(e) => {
            const next = e.target.value;
            if (isPermitType(next)) {
              setPermitType(next);
              setData({});
            }
          }}
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
            onClick={handleSaveDraft}
            type="button"
            disabled={savingDraft || submitting || clearingDraft}
          >
            {savingDraft ? "Saving..." : "Save Draft"}
          </button>

          <button
            className="inline-flex h-9 items-center justify-center rounded-md border px-4 text-sm disabled:opacity-60"
            onClick={handleClearDraft}
            type="button"
            disabled={savingDraft || submitting || clearingDraft}
          >
            {clearingDraft ? "Clearing..." : "Clear Draft"}
          </button>

          <button
            className="inline-flex h-9 items-center justify-center rounded-md bg-foreground px-4 text-sm font-medium text-background disabled:opacity-60"
            onClick={handleSubmit}
            type="button"
            disabled={savingDraft || submitting || clearingDraft}
          >
            {submitting ? "Submitting..." : "Submit PTW"}
          </button>

          {savedAt && (
            <span className="text-xs text-muted-foreground">
              Saved: {savedAt}
            </span>
          )}
        </div>
      </div>

      <div className="rounded-lg border p-4">
        <div className="mb-2 text-sm font-medium">Form</div>

        {!FormComponent ? (
          <div className="text-sm text-muted-foreground">
            No supporting form for this permit type.
          </div>
        ) : (
          <FormComponent data={data} onChange={(next: any) => setData(next)} readOnly={false} />
        )}
      </div>

      <div className="max-w-4xl space-y-4 rounded-lg border p-4">
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