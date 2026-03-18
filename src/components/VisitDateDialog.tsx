"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import { UploadButton } from "@uploadthing/react";
import type { OurFileRouter } from "@/lib/uploadthing";
import { X, ChevronLeft } from "lucide-react";
import { format } from "date-fns";

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
  onConfirm: (date: Date, journal: JournalData) => void;
}

const VISIBILITY_OPTIONS: { value: JournalData['visibility']; label: string; description: string }[] = [
  { value: 'private', label: 'Private', description: 'Only you' },
  { value: 'friends', label: 'Friends', description: 'Mutual followers' },
  { value: 'public', label: 'Public', description: 'Everyone' },
];

export default function VisitDateDialog({ open, onOpenChange, parkName, onConfirm }: VisitDateDialogProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [visibility, setVisibility] = useState<JournalData['visibility']>('private');
  const [dateError, setDateError] = useState("");

  const handleNext = () => {
    if (!date) { setDateError("Please select a date"); return; }
    if (date > new Date()) { setDateError("Date cannot be in the future"); return; }
    setDateError("");
    setStep(2);
  };

  const handleBack = () => setStep(1);

  const handleSubmit = () => {
    if (!date) return;
    onConfirm(date, {
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
    setDate(new Date());
    setTitle("");
    setNotes("");
    setPhotos([]);
    setVisibility('private');
    setDateError("");
  };

  const removePhoto = (url: string) => setPhotos(prev => prev.filter(p => p !== url));

  return (
    <Dialog open={open} onOpenChange={handleCancel}>
      <DialogContent className="w-full max-w-sm">

        <DialogHeader>
          <DialogTitle className="text-base leading-snug">{parkName}</DialogTitle>
          <p className="text-xs text-gray-400">{step === 1 ? 'Step 1 of 2 — When did you visit?' : 'Step 2 of 2 — Add a journal entry'}</p>
          {/* Step indicator — inside header so it clears the close button */}
          <div className="flex items-center gap-2 pt-1 pr-6">
            <div className={`h-1.5 flex-1 rounded-full transition-colors ${step >= 1 ? 'bg-emerald-500' : 'bg-gray-200'}`} />
            <div className={`h-1.5 flex-1 rounded-full transition-colors ${step >= 2 ? 'bg-emerald-500' : 'bg-gray-200'}`} />
          </div>
        </DialogHeader>

        {/* ── Step 1: Date ── */}
        {step === 1 && (
          <>
            <div className="flex justify-center py-1">
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                captionLayout="dropdown"
                fromYear={1950}
                toYear={new Date().getFullYear()}
                fixedWeeks
                className="rounded-xl border border-gray-200 shadow-sm"
              />
            </div>
            {dateError && <p className="text-sm text-red-600 -mt-1">{dateError}</p>}
            <DialogFooter>
              <Button variant="outline" onClick={handleCancel}>Cancel</Button>
              <Button onClick={handleNext} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                Next →
              </Button>
            </DialogFooter>
          </>
        )}

        {/* ── Step 2: Journal ── */}
        {step === 2 && (
          <>
            {/* Selected date badge */}
            <div className="text-xs text-gray-500 bg-gray-100 rounded-lg px-3 py-1.5 w-fit">
              Visited {date ? format(date, 'MMMM d, yyyy') : ''}
            </div>

            <div className="space-y-4">
              {/* Title */}
              <div className="space-y-1.5">
                <Label htmlFor="visit-title" className="text-sm font-medium">
                  Title <span className="text-gray-400 font-normal">(optional)</span>
                </Label>
                <input
                  id="visit-title"
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="e.g. Hiked the Narrows!"
                  maxLength={255}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  autoFocus
                />
              </div>

              {/* Notes */}
              <div className="space-y-1.5">
                <Label htmlFor="visit-notes" className="text-sm font-medium">
                  Notes <span className="text-gray-400 font-normal">(optional)</span>
                </Label>
                <textarea
                  id="visit-notes"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="What did you see? What was the highlight?"
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
                />
              </div>

              {/* Photos */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  Photos <span className="text-gray-400 font-normal">(optional, up to 5)</span>
                </Label>
                {photos.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {photos.map(url => (
                      <div key={url} className="relative w-14 h-14 rounded-lg overflow-hidden border border-gray-200">
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
                      button: "bg-gray-100 text-gray-700 text-sm px-3 py-1.5 rounded-lg border border-gray-300 hover:bg-gray-200 after:bg-emerald-600 ut-uploading:cursor-not-allowed",
                      allowedContent: "text-xs text-gray-400",
                    }}
                  />
                )}
              </div>

              {/* Visibility */}
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Who can see this?</Label>
                <div className="flex gap-2">
                  {VISIBILITY_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setVisibility(opt.value)}
                      className={`flex-1 flex flex-col items-center py-2 rounded-lg border text-xs transition-colors ${
                        visibility === opt.value
                          ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                          : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <span className="font-medium">{opt.label}</span>
                      <span className="text-gray-400 text-[11px]">{opt.description}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <DialogFooter className="flex-row gap-2">
              <Button variant="outline" onClick={handleBack} className="gap-1">
                <ChevronLeft className="w-4 h-4" /> Back
              </Button>
              <Button onClick={handleSubmit} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white">
                Log Visit
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
