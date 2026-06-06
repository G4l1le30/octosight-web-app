import React from "react";
import { UseFormReturn } from "react-hook-form";
import { ReportFormData, IncidentType } from "@/types/ticket";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { IncidentTypeCard } from "@/components/report/IncidentTypeCard";
import { EvidenceUpload } from "@/components/report/EvidenceUpload";
import { ChevronDown, ChevronUp, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

interface ReportFormProps {
  form: UseFormReturn<ReportFormData>;
  onSubmit: (data: ReportFormData) => void;
  loading: boolean;
  incidentType: IncidentType;
  setIncidentType: (type: IncidentType) => void;
  dynamic: any;
  screenshotFile: File | null;
  setScreenshotFile: (file: File | null) => void;
  screenshotError: boolean;
  setScreenshotError: (error: boolean) => void;
  attachmentFile: File | null;
  setAttachmentFile: (file: File | null) => void;
  getLocalISOString: () => string;
  isConfirming?: boolean;
  onFileReset?: () => void;
}

export const ReportForm: React.FC<ReportFormProps> = ({
  form,
  onSubmit,
  loading,
  incidentType,
  setIncidentType,
  dynamic,
  screenshotFile,
  setScreenshotFile,
  screenshotError,
  setScreenshotError,
  attachmentFile,
  setAttachmentFile,
  getLocalISOString,
}) => {
  const {
    handleSubmit,
    register,
    formState: { errors },
    reset,
  } = form;

  const [showAdvanced, setShowAdvanced] = React.useState(false);

  return (
    <div className="card p-6 md:p-8 mb-6 md:mb-8 bg-white border border-neutral-border overflow-visible">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 md:space-y-8">
        <div className="space-y-3 md:space-y-4">
          <label className="text-sm md:text-base font-bold text-secondary">Incident Type</label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
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

        <Textarea label={dynamic.summaryLabel} placeholder={dynamic.summaryPlaceholder} error={errors.summary?.message} {...register("summary")} className="min-h-[110px] md:min-h-[150px]" />

        {/* Advanced Information Section */}
        <div className="border border-neutral-border rounded-lg md:rounded-xl overflow-hidden shadow-sm">
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="w-full flex items-center justify-between p-3 md:p-4 hover:bg-neutral-border/20 transition-colors text-left"
          >
            <div className="flex items-center gap-2 md:gap-3">
              <div className="p-1.5 md:p-2 rounded-md md:rounded-lg text-black">
                <ShieldCheck className="size-5" />
              </div>
              <div>
                <span className="font-bold text-secondary block leading-tight">Advanced Information (Optional)</span>
                <span className="text-xs md:text-sm text-secondary/80 font-medium">Bank &amp; Transaction Details</span>
              </div>
            </div>
            {showAdvanced ? <ChevronUp className="size-5 text-secondary" /> : <ChevronDown className="size-5 text-secondary" />}
          </button>

          <div className={cn(
            "p-4 md:p-6 space-y-4 md:space-y-6 bg-white border-t border-neutral-border animate-in fade-in duration-300",
            showAdvanced ? "block" : "hidden"
          )}>
            <p className="text-xs font-medium text-secondary/60 leading-relaxed">
              If the incident involves a bank transfer or if you have specific payment info, please fill these out.
              This information is used to improve our global blacklist system.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              <Input
                label="Attacker Bank Name"
                placeholder="e.g., CIMB NIAGA, OCTO Pay"
                error={errors.bankName?.message}
                {...register("bankName")}
              />
              <Input
                label="Attacker Account Number"
                placeholder="e.g., 706123456789"
                type="number"
                error={errors.bankAccount?.message}
                {...register("bankAccount")}
              />
              <div className="md:col-span-2">
                <Input
                  label="Reference / Invoice Number"
                  placeholder="e.g., TRX-9921-X99-FAKE"
                  error={errors.referenceNumber?.message}
                  {...register("referenceNumber")}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Evidence Upload — files stored locally, uploaded on submit */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          <EvidenceUpload
            label={dynamic.fileLabel}
            id="screenshot-uploader"
            mode="screenshot"
            accept=".png,.jpg,.jpeg"
            onFileChange={(file) => {
              setScreenshotFile(file);
              if (file) setScreenshotError(false);
            }}
            error={screenshotError}
            errorMessage="A screenshot is required when no text summary is provided."
            disabled={loading}
            otherSelectedFile={attachmentFile}
          />

          <EvidenceUpload
            label="Phishing Attachment"
            id="attachment-uploader"
            mode="attachment"
            accept=".pdf,.doc,.docx,.docm,.rtf,.zip,.rar,.7z,.apk,.exe,.scr,.vbs,.html,.htm,.eml"
            onFileChange={setAttachmentFile}
            disabled={loading}
            otherSelectedFile={screenshotFile}
          />
        </div>

        <Button type="submit" loading={loading} size="lg" className="w-full text-base md:text-lg">
          Analyze Report
        </Button>
      </form>
    </div>
  );
};
