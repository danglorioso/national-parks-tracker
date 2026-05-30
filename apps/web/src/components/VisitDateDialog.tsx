"use client";

import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import { UploadButton } from "@uploadthing/react";
import type { OurFileRouter } from "@/lib/uploadthing";
import { X, ChevronLeft, Lock, Users, Globe, MapPin, CalendarRange } from "lucide-react";
import { format, differenceInDays, isSameDay } from "date-fns";
import { type DateRange } from "react-day-picker";

export interface JournalData {
  title?: string;
  notes?: string;
  photos?: string[];
  visibility: 'public' | 'friends' | 'private';
}

interface VisitDateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  parkName: string;
  onConfirm: (startDate: Date, endDate: Date | undefined, journal: JournalData) => void;
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

export default function VisitDateDialog({ open, onOpenChange, parkName, onConfirm }: VisitDateDialogProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [dateRange, setDateRange] = useState<DateRange | undefined>({ from: new Date(), to: undefined });
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [visibility, setVisibility] = useState<JournalData['visibility']>('public');
  const [dateError, setDateError] = useState("");

  const today = new Date();
  const startDate = dateRange?.from;
  // Treat from===to as a single-day visit (no end date)
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

  const handleSubmit = () => {
    if (!startDate) return;
    onConfirm(startDate, endDate, {
      title: title.trim() || undefined,
      notes: notes.trim() || undefined,
      photos: photos.length > 0 ? photos : undefined,
      visibility,
    });
    onOpenChange(false);
    resetForm();
  };

  const handleCancel = () => {
    resetForm();
    onOpenChange(false);
  };

  const resetForm = () => {
    setStep(1);
    setDateRange({ from: new Date(), to: undefined });
    setTitle("");
    setNotes("");
    setPhotos([]);
    setVisibility('public');
    setDateError("");
  };

  const removePhoto = (url: string) => setPhotos(prev => prev.filter(p => p !== url));

  return (
    <Dialog open={open} onOpenChange={handleCancel}>
      <DialogContent className="w-full max-w-sm">

        {/* ── Header ── */}
        <DialogHeader>
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-visited shrink-0" />
            <DialogTitle className="text-base leading-snug">{parkName}</DialogTitle>
          </div>
          <p className="text-xs text-ink-mute">
            {step === 1 ? 'When was your trip?' : 'Add a journal entry (optional)'}
          </p>
          <div className="flex items-center gap-2 pt-1 pr-6">
            <div className={`h-1 flex-1 rounded-full transition-colors ${step >= 1 ? 'bg-visited' : 'bg-surface-alt'}`} />
            <div className={`h-1 flex-1 rounded-full transition-colors ${step >= 2 ? 'bg-visited' : 'bg-surface-alt'}`} />
          </div>
        </DialogHeader>

        {/* ── Step 1: Date range ── */}
        {step === 1 && (
          <>
            {/* Hint */}
            <div className="flex items-center gap-1.5 text-[11px] text-ink-mute -mb-1">
              <CalendarRange className="w-3.5 h-3.5 shrink-0" />
              Click a start date, then an end date for multi-day trips.
            </div>

            {/* Calendar */}
            <div className="flex justify-center">
              <Calendar
                mode="range"
                selected={dateRange}
                onSelect={setDateRange}
                captionLayout="dropdown"
                fromYear={1950}
                toYear={today.getFullYear()}
                disabled={{ after: today }}
                fixedWeeks
                className="rounded-xl border border-hairline shadow-sm"
              />
            </div>

            {/* Selected range summary */}
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

            <DialogFooter>
              <Button variant="outline" onClick={handleCancel}>Cancel</Button>
              <Button
                onClick={handleNext}
                disabled={!startDate}
                className="bg-primary hover:bg-primary-deep text-primary-fg"
              >
                Next →
              </Button>
            </DialogFooter>
          </>
        )}

        {/* ── Step 2: Journal ── */}
        {step === 2 && (
          <>
            {/* Date range breadcrumb */}
            {startDate && (
              <div className="flex items-center gap-2 text-xs text-ink-mute bg-surface-alt rounded-lg px-3 py-1.5 w-fit">
                <CalendarRange className="w-3 h-3 text-visited shrink-0" />
                {formatDateRange(startDate, endDate)}
              </div>
            )}

            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="visit-title" className="text-sm font-medium">
                  Title <span className="text-ink-mute font-normal">(optional)</span>
                </Label>
                <input
                  id="visit-title"
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
                <Label htmlFor="visit-notes" className="text-sm font-medium">
                  Notes <span className="text-ink-mute font-normal">(optional)</span>
                </Label>
                <textarea
                  id="visit-notes"
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

            <DialogFooter className="flex-row gap-2">
              <Button variant="outline" onClick={handleCancel}>Cancel</Button>
              <Button variant="outline" onClick={() => setStep(1)} className="gap-1">
                <ChevronLeft className="w-4 h-4" /> Back
              </Button>
              <Button onClick={handleSubmit} className="flex-1 bg-primary hover:bg-primary-deep text-primary-fg">
                Log Visit
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
