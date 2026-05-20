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
import { X, ChevronLeft, Trash2 } from "lucide-react";
import { format } from "date-fns";
import type { JournalData } from "@/components/VisitDateDialog";

export interface ExistingVisitData {
  visitedDate: string;
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
  onSave: (date: Date, journal: JournalData) => void;
  onDelete: () => void;
}

const VISIBILITY_OPTIONS: { value: JournalData['visibility']; label: string; description: string }[] = [
  { value: 'private', label: 'Private', description: 'Only you' },
  { value: 'friends', label: 'Friends', description: 'Mutual followers' },
  { value: 'public', label: 'Public', description: 'Everyone' },
];

export default function EditVisitDialog({
  open, onOpenChange, parkName, existing, onSave, onDelete,
}: EditVisitDialogProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [date, setDate] = useState<Date | undefined>(new Date(existing.visitedDate));
  const [title, setTitle] = useState(existing.title ?? "");
  const [notes, setNotes] = useState(existing.notes ?? "");
  const [photos, setPhotos] = useState<string[]>(existing.photos ?? []);
  const [visibility, setVisibility] = useState<JournalData['visibility']>(
    (existing.visibility as JournalData['visibility']) ?? 'private'
  );
  const [dateError, setDateError] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleNext = () => {
    if (!date) { setDateError("Please select a date"); return; }
    if (date > new Date()) { setDateError("Date cannot be in the future"); return; }
    setDateError("");
    setStep(2);
  };

  const handleSave = () => {
    if (!date) return;
    onSave(date, {
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
          <DialogHeader>
            <DialogTitle className="text-base leading-snug">{parkName}</DialogTitle>
            <p className="text-xs text-gray-400">
              {step === 1 ? 'Step 1 of 2 — Change visit date' : 'Step 2 of 2 — Edit journal entry'}
            </p>
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
                  defaultMonth={date}
                  captionLayout="dropdown"
                  fromYear={1950}
                  toYear={new Date().getFullYear()}
                  fixedWeeks
                  className="rounded-xl border border-gray-200 shadow-sm"
                />
              </div>
              {dateError && <p className="text-sm text-red-600 -mt-1">{dateError}</p>}
              <DialogFooter className="flex-col gap-3 sm:flex-col">
                <div className="flex gap-2 w-full">
                  <Button variant="outline" onClick={handleCancel}>Cancel</Button>
                  <Button onClick={handleNext} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white">
                    Next →
                  </Button>
                </div>
                <div className="border-t border-gray-100 pt-1">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowDeleteConfirm(true)}
                    className="w-full gap-2 text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600 hover:border-red-300"
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
              <div className="text-xs text-gray-500 bg-gray-100 rounded-lg px-3 py-1.5 w-fit">
                Visited {date ? format(date, 'MMMM d, yyyy') : ''}
              </div>

              <div className="space-y-4">
                {/* Title */}
                <div className="space-y-1.5">
                  <Label htmlFor="edit-title" className="text-sm font-medium">
                    Title <span className="text-gray-400 font-normal">(optional)</span>
                  </Label>
                  <input
                    id="edit-title"
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
                  <Label htmlFor="edit-notes" className="text-sm font-medium">
                    Notes <span className="text-gray-400 font-normal">(optional)</span>
                  </Label>
                  <textarea
                    id="edit-notes"
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

              <DialogFooter className="flex-col gap-3 sm:flex-col">
                <div className="flex gap-2 w-full">
                  <Button variant="outline" onClick={() => setStep(1)} className="gap-1">
                    <ChevronLeft className="w-4 h-4" /> Back
                  </Button>
                  <Button onClick={handleSave} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white">
                    Save changes
                  </Button>
                </div>
                <div className="border-t border-gray-100 pt-1">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowDeleteConfirm(true)}
                    className="w-full gap-2 text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600 hover:border-red-300"
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

      {/* Delete confirmation — separate so it renders above the edit dialog */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this visit?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove your visit to{" "}
              <span className="font-medium text-gray-900">{parkName}</span>.
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
