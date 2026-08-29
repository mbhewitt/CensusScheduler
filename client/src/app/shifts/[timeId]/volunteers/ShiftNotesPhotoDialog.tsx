"use client";

import {
  Alert,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useSnackbar } from "notistack";
import { useRef, useState } from "react";

// Shift-lead tool: photograph paper roster notes → a vision model reads the
// handwriting and matches each row to a volunteer on the shift → the lead
// reviews/edits → save. Additive; opened from a button on the roster page.
interface Vol {
  shiftboardId: number;
  timePositionId: number;
  playaName: string;
  worldName: string;
}
interface ParsedEntry {
  name: string;
  note: string;
  matchedShiftboardId: number | null;
  timePositionId: number | null;
  confidence: "high" | "medium" | "low";
}
// Editable row: a parsed entry the lead can re-target (by shiftboardId) or clear.
interface Row extends ParsedEntry {
  targetShiftboardId: number | "";
}

interface Props {
  timeId: number;
  volunteerList: Vol[];
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export const ShiftNotesPhotoDialog = ({
  timeId,
  volunteerList,
  open,
  onClose,
  onSaved,
}: Props) => {
  const { enqueueSnackbar } = useSnackbar();
  const fileRef = useRef<HTMLInputElement>(null);
  const [parsing, setParsing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [rows, setRows] = useState<Row[] | null>(null);

  const reset = () => {
    setRows(null);
    setError("");
    if (fileRef.current) fileRef.current.value = "";
  };
  const close = () => {
    reset();
    onClose();
  };

  const handleFile = async (file: File) => {
    setError("");
    setParsing(true);
    setRows(null);
    try {
      const dataUrl: string = await new Promise((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve(String(r.result));
        r.onerror = () => reject(new Error("Could not read the file"));
        r.readAsDataURL(file);
      });
      const [, mediaType = "image/jpeg", imageBase64 = ""] =
        dataUrl.match(/^data:([^;]+);base64,(.*)$/) ?? [];
      const res = await fetch(`/api/shifts/${timeId}/notes-photo?action=parse`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ imageBase64, mediaType }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message ?? `Failed (${res.status})`);
      const entries: ParsedEntry[] = data.entries ?? [];
      if (entries.length === 0) {
        setError("No notes could be read from that photo. Try a clearer, straight-on picture.");
      }
      setRows(
        entries.map((e) => ({ ...e, targetShiftboardId: e.matchedShiftboardId ?? "" }))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't read the photo.");
    } finally {
      setParsing(false);
    }
  };

  const save = async () => {
    if (!rows) return;
    const entries = rows
      .filter((r) => r.targetShiftboardId !== "" && r.note.trim())
      .map((r) => {
        const vol = volunteerList.find((v) => v.shiftboardId === r.targetShiftboardId);
        return vol
          ? { shiftboardId: vol.shiftboardId, timePositionId: vol.timePositionId, note: r.note.trim() }
          : null;
      })
      .filter(Boolean);
    if (entries.length === 0) {
      setError("Nothing to save — assign each note to a volunteer first.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/shifts/${timeId}/notes-photo?action=save`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ entries }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message ?? `Failed (${res.status})`);
      enqueueSnackbar(`Saved ${data.saved} note${data.saved === 1 ? "" : "s"}.`, {
        variant: "success",
      });
      onSaved();
      close();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't save the notes.");
    } finally {
      setSaving(false);
    }
  };

  const matchedCount = rows?.filter((r) => r.matchedShiftboardId !== null).length ?? 0;
  const unmatchedCount = (rows?.length ?? 0) - matchedCount;

  return (
    <Dialog open={open} onClose={close} fullWidth maxWidth="sm">
      <DialogTitle>Scan paper notes</DialogTitle>
      <DialogContent>
        <Typography color="text.secondary" variant="body2" sx={{ mb: 2 }}>
          Take a clear, straight-on photo of your paper roster notes. We&apos;ll read
          the handwriting and match each note to a volunteer — you review and edit
          before anything is saved.
        </Typography>

        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          capture="environment"
          style={{ display: "none" }}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
          }}
        />
        <Button
          variant="contained"
          disabled={parsing}
          onClick={() => fileRef.current?.click()}
          startIcon={parsing ? <CircularProgress size={18} /> : undefined}
        >
          {parsing ? "Reading…" : rows ? "Choose a different photo" : "Take / choose photo"}
        </Button>

        {error && (
          <Alert severity="warning" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}

        {rows && rows.length > 0 && (
          <>
            <Typography variant="body2" sx={{ mt: 2, mb: 1 }}>
              {matchedCount} matched
              {unmatchedCount > 0 && `, ${unmatchedCount} need a volunteer assigned`}. Edit
              as needed, then Save.
            </Typography>
            <Stack spacing={2}>
              {rows.map((r, i) => (
                <Stack key={i} spacing={1} sx={{ borderLeft: 3, borderColor: "divider", pl: 1.5 }}>
                  <Typography variant="caption" color="text.secondary">
                    Read as: {r.name || "(name unclear)"} · confidence {r.confidence}
                  </Typography>
                  <TextField
                    select
                    size="small"
                    label="Volunteer"
                    value={r.targetShiftboardId}
                    onChange={(e) => {
                      const val = e.target.value === "" ? "" : Number(e.target.value);
                      setRows((prev) =>
                        prev!.map((row, j) => (j === i ? { ...row, targetShiftboardId: val } : row))
                      );
                    }}
                  >
                    <MenuItem value="">— skip this note —</MenuItem>
                    {volunteerList.map((v) => (
                      <MenuItem key={v.shiftboardId} value={v.shiftboardId}>
                        {v.playaName} &quot;{v.worldName}&quot;
                      </MenuItem>
                    ))}
                  </TextField>
                  <TextField
                    size="small"
                    label="Note"
                    multiline
                    value={r.note}
                    onChange={(e) =>
                      setRows((prev) =>
                        prev!.map((row, j) => (j === i ? { ...row, note: e.target.value } : row))
                      )
                    }
                  />
                </Stack>
              ))}
            </Stack>
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={close}>Cancel</Button>
        <Button
          variant="contained"
          disabled={saving || !rows || rows.length === 0}
          onClick={save}
          startIcon={saving ? <CircularProgress size={18} /> : undefined}
        >
          Save notes
        </Button>
      </DialogActions>
    </Dialog>
  );
};
