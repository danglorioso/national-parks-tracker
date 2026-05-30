"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import { UploadButton } from "@uploadthing/react";
import type { OurFileRouter } from "@/lib/uploadthing";
import { X, ChevronLeft, Trash2, Lock, Users, Globe, MapPin, CalendarRange } from "lucide-react";
import { format, differenceInDays, isSameDay } from "date-fns";
import { type DateRange } from "react-day-picker";
import type { JournalData } from "@/components/VisitDateDialog";

export interface ExistingVisitData {
  visitedDate: string;
  endDate?: string | null;
  title?: string | null;
  notes?: string | null;
  photos?: string[] | null;
  visibility?: string | null;
}

interface EditVisitDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  parkName: string;
  existing: ExistingVisitData;
  onSave: (startDate: Date, endDate: Date | undefined, journal: JournalData) => void;
  onDelete: () => void;
}

const VISIBILITY_OPTIONS: { value: JournalData['visibility']; label: string; description: string; icon: React.ElementType }[] = [
  { value: 'private', label: 'Private', description: 'Only you', icon: Lock },
  { value: 'friends', label: 'Friends', description: 'Mutual followers', icon: Users },
  { value: 'public', label: 'Public', description: 'Everyone', icon: Globe },
];

function formatDateRange(startDate: Date, endDate?: Date): string {
  if (!endDate) return format(startDate, 'MMMM d, yyyy');
  const days = differenceInDays(endDate, startDate) + 1;
  if (startDate.getFullYear() === endDate.getFullYear()) {
    if (startDate.getMonth() === endDate.getMonth()) {
      return `${format(startDate, 'MMMM d')}–${format(endDate, 'd, yyyy')} · ${days} days`;
    }
    return `${format(startDate, 'MMM d')}–${format(endDate, 'MMM d, yyyy')} · ${days} days`;
  }
  return `${format(startDate, 'MMM d, yyyy')}–${format(endDate, 'MMM d, yyyy')} · ${days} days`;
}

export default function EditVisitDialog({
  open, onOpenChange, parkName, existing, onSave, onDelete,
}: EditVisitDialogProps) {
  const today = new Date();
  const [step, setStep] = useState<1 | 2>(1);
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(existing.visitedDate),
    to: existing.endDate ? new Date(existing.endDate) : undefined,
  });
  const [title, setTitle] = useState(existing.title ?? "");
  const [notes, setNotes] = useState(existing.notes ?? "");
  const [photos, setPhotos] = useState<string[]>(existing.photos ?? []);
  const [visibility, setVisibility] = useState<JournalData['visibility']>(
    (existing.visibility as JournalData['visibility']) ?? 'private'
  );
  const [dateError, setDateError] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const startDate = dateRange?.from;
  const endDate = dateRange?.to && startDate && !isSameDay(dateRange.to, startDate)
    ? dateRange.to
    : undefined;

  const handleNext = () => {
    if (!startDate) { setDateError("Please select a visit date"); return; }
    if (startDate > today) { setDateError("Start date cannot be in the future"); return; }
    if (endDate && endDate > today) { setDateError("End date cannot be in the future"); return; }
    setDateError("");
    setStep(2);
  };

  const handleSave = () => {
    if (!startDate) return;
    onSave(startDate, endDate, {
      title: title.trim() || undefined,
      notes: notes.trim() || undefined,
      photos: photos.length > 0 ? photos : undefined,
      visibility,
    });
    onOpenChange(false);
  };

  const handleCancel = () => {
    setStep(1);
    setDateError("");
    onOpenChange(false);
  };

  const handleConfirmDelete = () => {
    setShowDeleteConfirm(false);
    onOpenChange(false);
    onDelete();
  };

  const removePhoto = (url: string) => setPhotos(prev => prev.filter(p => p !== url));

  return (
    <>
      <Dialog open={open} onOpenChange={handleCancel}>
        <DialogContent className="w-full max-w-sm">

          {/* ── Header ── */}
          <DialogHeader>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-visited shrink-0" />
              <DialogTitle className="text-base leading-snug">{parkName}</DialogTitle>
            </div>
            <p className="text-xs text-ink-mute">
              {step === 1 ? 'When was your trip?' : 'Edit journal entry (optional)'}
            </p>
            <div className="flex items-center gap-2 pt-1 pr-6">
              <div className={`h-1 flex-1 rounded-full transition-colors ${step >= 1 ? 'bg-visited' : 'bg-surface-alt'}`} />
              <div className={`h-1 flex-1 rounded-full transition-colors ${step >= 2 ? 'bg-visited' : 'bg-surface-alt'}`} />
            </div>
          </DialogHeader>

          {/* ── Step 1: Date range ── */}
          {step === 1 && (
            <>
              <div className="flex items-center gap-1.5 text-[11px] text-ink-mute -mb-1">
                <CalendarRange className="w-3.5 h-3.5 shrink-0" />
                Click a start date, then an end date for multi-day trips.
              </div>

              <div className="flex justify-center">
                <Calendar
                  mode="range"
                  selected={dateRange}
                  onSelect={setDateRange}
                  defaultMonth={startDate}
                  captionLayout="dropdown"
                  fromYear={1950}
                  toYear={today.getFullYear()}
                  disabled={{ after: today }}
                  fixedWeeks
                  className="rounded-xl border border-hairline shadow-sm"
                />
              </div>

              {startDate && (
                <div className="flex items-center gap-2 text-xs bg-surface-alt rounded-lg px-3 py-2">
                  <CalendarRange className="w-3.5 h-3.5 text-visited shrink-0" />
                  <span className="text-ink font-medium">
                    {formatDateRange(startDate, endDate)}
                  </span>
                  {!endDate && (
                    <span className="text-ink-mute ml-auto shrink-0">tap to add end date</span>
                  )}
                </div>
              )}

              {dateError && <p className="text-xs text-red-600 -mt-1">{dateError}</p>}

              <DialogFooter className="flex-col gap-3 sm:flex-col">
                <div className="flex gap-2 w-full">
                  <Button variant="outline" onClick={handleCancel}>Cancel</Button>
                  <Button
                    onClick={handleNext}
                    disabled={!startDate}
                    className="flex-1 bg-primary hover:bg-primary-deep text-primary-fg"
                  >
                    Next →
                  </Button>
                </div>
                <div className="border-t border-hairline-soft pt-1">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowDeleteConfirm(true)}
                    className="w-full gap-2 text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete this visit
                  </Button>
                </div>
              </DialogFooter>
            </>
          )}

          {/* ── Step 2: Journal ── */}
          {step === 2 && (
            <>
              {startDate && (
                <div className="flex items-center gap-2 text-xs text-ink-mute bg-surface-alt rounded-lg px-3 py-1.5 w-fit">
                  <CalendarRange className="w-3 h-3 text-visited shrink-0" />
                  {formatDateRange(startDate, endDate)}
                </div>
              )}

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="edit-title" className="text-sm font-medium">
                    Title <span className="text-ink-mute font-normal">(optional)</span>
                  </Label>
                  <input
                    id="edit-title"
                    type="text"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder="e.g. Hiked the Narrows!"
                    maxLength={255}
                    className="w-full border border-hairline bg-surface rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    autoFocus
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="edit-notes" className="text-sm font-medium">
                    Notes <span className="text-ink-mute font-normal">(optional)</span>
                  </Label>
                  <textarea
                    id="edit-notes"
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    placeholder="What did you see? What was the highlight?"
                    rows={3}
                    className="w-full border border-hairline bg-surface rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">
                    Photos <span className="text-ink-mute font-normal">(optional, up to 5)</span>
                  </Label>
                  {photos.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {photos.map(url => (
                        <div key={url} className="relative w-14 h-14 rounded-lg overflow-hidden border border-hairline">
                          <img src={url} alt="upload" className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => removePhoto(url)}
                            className="absolute top-0.5 right-0.5 bg-black/60 rounded-full p-0.5 text-white hover:bg-black/80"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  {photos.length < 5 && (
                    <UploadButton<OurFileRouter, "journalPhotos">
                      endpoint="journalPhotos"
                      onClientUploadComplete={res => {
                        setPhotos(prev => [...prev, ...res.map(r => r.url)].slice(0, 5));
                      }}
                      onUploadError={err => console.error("Upload error:", err)}
                      appearance={{
                        button: "bg-surface-alt text-ink text-sm px-3 py-1.5 rounded-lg border border-hairline hover:opacity-80 after:bg-primary ut-uploading:cursor-not-allowed",
                        allowedContent: "text-xs text-ink-mute",
                      }}
                    />
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label className="text-sm font-medium">Who can see this?</Label>
                  <div className="flex gap-2">
                    {VISIBILITY_OPTIONS.map(opt => {
                      const Icon = opt.icon;
                      const selected = visibility === opt.value;
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setVisibility(opt.value)}
                          className={`flex-1 flex flex-col items-center gap-1 py-2.5 rounded-lg border text-xs transition-colors ${
                            selected
                              ? 'border-primary bg-surface-alt text-primary'
                              : 'border-hairline bg-surface text-ink-soft hover:bg-surface-alt'
                          }`}
                        >
                          <Icon className={`w-3.5 h-3.5 ${selected ? 'text-visited' : 'text-ink-mute'}`} />
                          <span className="font-medium">{opt.label}</span>
                          <span className="text-ink-mute text-[11px]">{opt.description}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <DialogFooter className="flex-col gap-3 sm:flex-col">
                <div className="flex gap-2 w-full">
                  <Button variant="outline" onClick={() => setStep(1)} className="gap-1">
                    <ChevronLeft className="w-4 h-4" /> Back
                  </Button>
                  <Button onClick={handleSave} className="flex-1 bg-primary hover:bg-primary-deep text-primary-fg">
                    Save changes
                  </Button>
                </div>
                <div className="border-t border-hairline-soft pt-1">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowDeleteConfirm(true)}
                    className="w-full gap-2 text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete this visit
                  </Button>
                </div>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this visit?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove your visit to{" "}
              <span className="font-medium text-ink">{parkName}</span>.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Delete visit
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
