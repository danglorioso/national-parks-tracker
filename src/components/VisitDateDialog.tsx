"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";

interface VisitDateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  parkName: string;
  onConfirm: (date: Date) => void;
}

export default function VisitDateDialog({ open, onOpenChange, parkName, onConfirm }: VisitDateDialogProps) {
    const [date, setDate] = useState<Date | undefined>(new Date())
    const [error, setError] = useState("");

  const handleSubmit = () => {
    if (!date) {
      setError("Please select a date");
      return;
    }

    // Check if date is in the future
    if (date > new Date()) {
      setError("Date cannot be in the future");
      return;
    }

    setError("");
    onConfirm(date);
    onOpenChange(false);
    // Reset form
    setDate(undefined);
  };

  const handleCancel = () => {
    setError("");
    setDate(undefined);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleCancel}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>When did you visit {parkName}?</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="flex flex-col gap-3">
            <Label htmlFor="date" className="text-sm text-muted-foreground">
              Enter the date below.
            </Label>
            <div className="flex justify-center">
              <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  className="rounded-lg border shadow-sm"
                  captionLayout="dropdown"
              />
            </div>
          </div>
          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>
            Confirm
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

