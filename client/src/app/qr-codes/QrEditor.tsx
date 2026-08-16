"use client";

import { UploadFile as UploadFileIcon } from "@mui/icons-material";
import {
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  MenuItem,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import Image from "next/image";
import { enqueueSnackbar } from "notistack";
import { useEffect, useRef, useState } from "react";

import type { IQrCode } from "@/components/types/qr";

import {
  defaultFilename,
  defaultSettings,
  type QrSettings,
  type QrType,
} from "./qrDefaults";

async function readError(res: Response): Promise<string> {
  try {
    return (await res.json()).message ?? `Request failed (${res.status})`;
  } catch {
    return `Request failed (${res.status})`;
  }
}

interface Props {
  open: boolean;
  burnYear: number;
  editing: IQrCode | null; // null = create
  onClose: () => void;
  onSaved: () => void;
}

export const QrEditor = ({ open, burnYear, editing, onClose, onSaved }: Props) => {
  const [qrType, setQrType] = useState<QrType>("calendar");
  const [filename, setFilename] = useState("");
  const [settings, setSettings] = useState<QrSettings>(defaultSettings("calendar", burnYear));
  const [preview, setPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const uploadRef = useRef<HTMLInputElement>(null);
  // Whether the admin has hand-edited the filename (so we stop auto-filling it).
  const filenameTouched = useRef(false);

  // Load the editing row, or reset to defaults for a fresh create.
  useEffect(() => {
    if (!open) return;
    filenameTouched.current = false;
    if (editing) {
      setQrType(editing.qrType);
      setSettings(editing.settings);
      setFilename(editing.filename);
      filenameTouched.current = true;
    } else {
      setQrType("calendar");
      const s = defaultSettings("calendar", burnYear);
      setSettings(s);
      setFilename(defaultFilename("calendar", burnYear, s));
    }
  }, [open, editing, burnYear]);

  // Live preview (debounced) whenever the design changes.
  useEffect(() => {
    if (!open) return;
    const t = setTimeout(async () => {
      try {
        const res = await fetch("/api/qr-codes/preview", {
          method: "POST",
          body: JSON.stringify({ qrType, settings }),
        });
        if (res.ok) setPreview((await res.json()).dataUri);
        else setPreview(null);
      } catch {
        setPreview(null);
      }
    }, 350);
    return () => clearTimeout(t);
  }, [open, qrType, settings]);

  const changeType = (t: QrType) => {
    setQrType(t);
    const s = defaultSettings(t, burnYear);
    setSettings(s);
    if (!filenameTouched.current) setFilename(defaultFilename(t, burnYear, s));
  };

  const patch = (p: Partial<QrSettings>) => setSettings((s) => ({ ...s, ...p }));

  const handleUpload = async (file: File) => {
    const body = new FormData();
    body.append("file", file);
    const res = await fetch("/api/qr-codes/decode", { method: "POST", body });
    if (!res.ok) {
      enqueueSnackbar(await readError(res), { variant: "error" });
      return;
    }
    const j = await res.json();
    setQrType(j.qrType);
    setSettings(j.settings);
    if (!filenameTouched.current) {
      setFilename(defaultFilename(j.qrType, burnYear, j.settings));
    }
    enqueueSnackbar("Decoded — edit and save to add it to the registry", {
      variant: "success",
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const url = editing ? `/api/qr-codes/${editing.qrId}` : "/api/qr-codes";
      const res = await fetch(url, {
        method: editing ? "PUT" : "POST",
        body: JSON.stringify({ qrType, filename, settings }),
      });
      if (!res.ok) {
        enqueueSnackbar(await readError(res), { variant: "error" });
        return;
      }
      enqueueSnackbar(editing ? "Saved" : "Created", { variant: "success" });
      onSaved();
    } finally {
      setSaving(false);
    }
  };

  const cal = settings.calendar;
  const wifi = settings.wifi;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{editing ? "Edit QR code" : "New QR code"}</DialogTitle>
      <DialogContent>
        <Stack direction={{ xs: "column", md: "row" }} spacing={3} sx={{ mt: 1 }}>
          {/* form */}
          <Stack spacing={2} sx={{ flex: 1 }}>
            <ToggleButtonGroup
              exclusive
              size="small"
              value={qrType}
              onChange={(_, v) => v && changeType(v)}
            >
              <ToggleButton value="calendar">Calendar</ToggleButton>
              <ToggleButton value="link">Link</ToggleButton>
              <ToggleButton value="wifi">WiFi</ToggleButton>
            </ToggleButtonGroup>

            {qrType === "calendar" && cal && (
              <>
                <TextField
                  label="Title"
                  size="small"
                  value={cal.title}
                  onChange={(e) => patch({ calendar: { ...cal, title: e.target.value } })}
                />
                <Stack direction="row" spacing={2}>
                  <TextField
                    label="Date"
                    type="date"
                    size="small"
                    slotProps={{ inputLabel: { shrink: true } }}
                    value={cal.date}
                    onChange={(e) => patch({ calendar: { ...cal, date: e.target.value } })}
                  />
                  <TextField
                    label="Time (Pacific)"
                    type="time"
                    size="small"
                    slotProps={{ inputLabel: { shrink: true } }}
                    value={cal.time}
                    onChange={(e) => patch({ calendar: { ...cal, time: e.target.value } })}
                  />
                </Stack>
                <Stack direction="row" spacing={2}>
                  <TextField
                    label="Duration (min)"
                    type="number"
                    size="small"
                    value={cal.durationMinutes}
                    onChange={(e) =>
                      patch({ calendar: { ...cal, durationMinutes: Number(e.target.value) } })
                    }
                  />
                  <TextField
                    label="Reminder (min before)"
                    type="number"
                    size="small"
                    value={cal.reminderMinutes}
                    onChange={(e) =>
                      patch({ calendar: { ...cal, reminderMinutes: Number(e.target.value) } })
                    }
                  />
                </Stack>
                <TextField
                  label="Link / location"
                  size="small"
                  value={cal.location}
                  onChange={(e) => patch({ calendar: { ...cal, location: e.target.value } })}
                />
              </>
            )}

            {qrType === "link" && (
              <TextField
                label="URL"
                size="small"
                value={settings.link ?? ""}
                onChange={(e) => patch({ link: e.target.value })}
              />
            )}

            {qrType === "wifi" && wifi && (
              <>
                <TextField
                  label="SSID"
                  size="small"
                  value={wifi.ssid}
                  onChange={(e) => patch({ wifi: { ...wifi, ssid: e.target.value } })}
                />
                <TextField
                  label="Password"
                  size="small"
                  value={wifi.password}
                  disabled={wifi.encryption === "nopass"}
                  onChange={(e) => patch({ wifi: { ...wifi, password: e.target.value } })}
                />
                <TextField
                  select
                  label="Encryption"
                  size="small"
                  value={wifi.encryption}
                  onChange={(e) =>
                    patch({
                      wifi: { ...wifi, encryption: e.target.value as typeof wifi.encryption },
                    })
                  }
                >
                  <MenuItem value="WPA">WPA/WPA2</MenuItem>
                  <MenuItem value="WEP">WEP</MenuItem>
                  <MenuItem value="nopass">None</MenuItem>
                </TextField>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={wifi.hidden}
                      onChange={(e) => patch({ wifi: { ...wifi, hidden: e.target.checked } })}
                    />
                  }
                  label="Hidden network"
                />
              </>
            )}

            {/* styling */}
            <Typography variant="subtitle2" sx={{ pt: 1 }}>
              Styling
            </Typography>
            <Stack direction="row" spacing={2} alignItems="center">
              <TextField
                label="Foreground"
                type="color"
                size="small"
                sx={{ width: 100 }}
                value={settings.fgColor}
                onChange={(e) => patch({ fgColor: e.target.value })}
              />
              <TextField
                label="Background"
                type="color"
                size="small"
                sx={{ width: 100 }}
                value={settings.bgColor}
                onChange={(e) => patch({ bgColor: e.target.value })}
              />
            </Stack>
            <Stack direction="row" spacing={2}>
              <TextField
                select
                label="Border"
                size="small"
                sx={{ width: 140 }}
                value={settings.border ? "on" : "off"}
                onChange={(e) => patch({ border: e.target.value === "on" })}
              >
                <MenuItem value="on">With border</MenuItem>
                <MenuItem value="off">No border</MenuItem>
              </TextField>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={settings.logo}
                    onChange={(e) => patch({ logo: e.target.checked })}
                  />
                }
                label="Census logo"
              />
            </Stack>

            <TextField
              label="Filename (download name)"
              size="small"
              value={filename}
              helperText="Must be unique. No extension needed."
              onChange={(e) => {
                filenameTouched.current = true;
                setFilename(e.target.value);
              }}
            />

            <input
              ref={uploadRef}
              type="file"
              accept="image/*"
              hidden
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleUpload(f);
                if (uploadRef.current) uploadRef.current.value = "";
              }}
            />
            <Button
              variant="text"
              startIcon={<UploadFileIcon />}
              onClick={() => uploadRef.current?.click()}
              sx={{ alignSelf: "flex-start" }}
            >
              Upload an existing QR to decode &amp; edit
            </Button>
          </Stack>

          {/* preview */}
          <Box sx={{ width: 240, textAlign: "center" }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Preview
            </Typography>
            {preview ? (
              <Image
                src={preview}
                alt="QR preview"
                width={220}
                height={220}
                unoptimized
                style={{ border: "1px solid #ddd" }}
              />
            ) : (
              <Box
                sx={{
                  width: 220,
                  height: 220,
                  border: "1px dashed #ccc",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "text.secondary",
                  mx: "auto",
                }}
              >
                Fill in fields
              </Box>
            )}
          </Box>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" disabled={saving || !filename.trim()} onClick={handleSave}>
          {saving ? "Saving…" : editing ? "Save" : "Create"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
