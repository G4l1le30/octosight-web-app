import React from "react";
import { UseFormReturn } from "react-hook-form";
import { ReportFormData, IncidentType } from "@/types/ticket";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { IncidentTypeCard } from "@/components/report/IncidentTypeCard";
import { EvidenceUpload } from "@/components/report/EvidenceUpload";

interface ReportFormProps {
  form: UseFormReturn<ReportFormData>;
  onSubmit: (data: ReportFormData) => void;
  loading: boolean;
  incidentType: IncidentType;
  setIncidentType: (type: IncidentType) => void;
  dynamic: any;
  screenshots: File[];
  setScreenshots: (files: File[]) => void;
  screenshotError: boolean;
  setScreenshotError: (error: boolean) => void;
  attachments: File[];
  setAttachments: (files: File[]) => void;
  getLocalISOString: () => string;
}

export const ReportForm: React.FC<ReportFormProps> = ({
  form,
  onSubmit,
  loading,
  incidentType,
  setIncidentType,
  dynamic,
  screenshots,
  setScreenshots,
  screenshotError,
  setScreenshotError,
  attachments,
  setAttachments,
  getLocalISOString,
}) => {
  const {
    handleSubmit,
    register,
    formState: { errors },
    reset,
  } = form;

  return (
    <div className="card p-8 mb-8 bg-white border border-neutral-border overflow-visible">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        <div className="space-y-4">
          <label className="text-base font-bold text-secondary">Incident Type</label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {(["Website", "SMS", "WhatsApp", "Email"] as IncidentType[]).map((type) => (
              <IncidentTypeCard 
                key={type} 
                type={type} 
                selected={incidentType === type} 
                onClick={() => {
                  setIncidentType(type);
                  reset({ type, url: "", summary: "", senderNumbers: "", incidentDate: getLocalISOString() } as any);
                }} 
              />
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className={incidentType === "Website" ? "md:col-span-2" : ""}>
            <Input 
              label={dynamic.urlLabel} 
              placeholder={dynamic.urlPlaceholder} 
              error={errors.url?.message} 
              {...register("url")} 
            />
          </div>
          {incidentType !== "Website" && (
            <Input 
              label={dynamic.senderLabel} 
              placeholder={dynamic.senderPlaceholder} 
              error={errors.senderNumbers?.message} 
              {...register("senderNumbers")} 
            />
          )}
        </div>

        <Textarea label={dynamic.summaryLabel} placeholder={dynamic.summaryPlaceholder} error={errors.summary?.message} {...register("summary")} className="min-h-[150px]" />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <EvidenceUpload 
            id="screenshots-upload" 
            label={dynamic.fileLabel} 
            files={screenshots} 
            onFilesChange={(files) => { setScreenshots(files); if (files.length > 0) setScreenshotError(false); }} 
            error={screenshotError} 
            errorMessage="Required: Please upload a screenshot if message text is empty." 
            accept="image/*" 
            multiple 
          />
          <EvidenceUpload 
            id="attachments-upload" 
            label="Phishing Attachments" 
            files={attachments} 
            onFilesChange={setAttachments} 
            accept="*" 
          />
        </div>

        <Button type="submit" loading={loading} size="lg" className="w-full text-lg">Analyze Report</Button>
      </form>
    </div>
  );
};
