"use client";

import {
  CheckCircle as CheckCircleIcon,
  Download as DownloadIcon,
  Email as EmailIcon,
  Lock as LockIcon,
  UploadFile as UploadFileIcon,
} from "@mui/icons-material";
import {
  Box,
  Button,
  Chip,
  Container,
  MenuItem,
  Paper,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { enqueueSnackbar } from "notistack";
import { useRef, useState } from "react";
import useSWR, { useSWRConfig } from "swr";

import { Hero } from "@/components/layout/Hero";
import { ErrorPage } from "@/components/general/ErrorPage";
import { Loading } from "@/components/general/Loading";
import type {
  IResSapPeople,
  IResSapPool,
  ISapPerson,
} from "@/components/types/sap";
import { fetcherGet } from "@/utils/fetcher";

const PEOPLE_URL = "/api/saps/people";
const POOL_URL = "/api/saps";

// Stable key for per-row UI state (volunteers keyed by id, off-book by email).
const rowKey = (p: ISapPerson) =>
  p.shiftboardId != null ? `v${p.shiftboardId}` : `e${p.email}`;

const targetBody = (p: ISapPerson) =>
  p.shiftboardId != null ? { shiftboardId: p.shiftboardId } : { email: p.email };

async function readError(res: Response): Promise<string> {
  try {
    const j = await res.json();
    return j.message ?? `Request failed (${res.status})`;
  } catch {
    return `Request failed (${res.status})`;
  }
}

export const Saps = () => {
  const { mutate } = useSWRConfig();
  const refresh = () => {
    mutate(PEOPLE_URL);
    mutate(POOL_URL);
  };

  const { data: peopleData, error: peopleError } = useSWR<IResSapPeople>(
    PEOPLE_URL,
    fetcherGet,
  );
  const { data: poolData } = useSWR<IResSapPool>(POOL_URL, fetcherGet);

  // Per-row chosen date in the dropdown (defaults to "auto").
  const [dateChoice, setDateChoice] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<Record<string, boolean>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [offbookEmail, setOffbookEmail] = useState("");
  const [offbookName, setOffbookName] = useState("");

  if (peopleError) return <ErrorPage />;
  if (!peopleData) return <Loading />;

  const { availableDates, people, burnYear } = peopleData;

  const setRowBusy = (key: string, value: boolean) =>
    setBusy((b) => ({ ...b, [key]: value }));

  // upload ----------------------------------------------------------------
  const handleUpload = async (file: File) => {
    setUploading(true);
    try {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch("/api/saps/upload", { method: "POST", body });
      if (!res.ok) {
        enqueueSnackbar(await readError(res), { variant: "error" });
        return;
      }
      const j = await res.json();
      const quarantined = j.quarantined?.length ?? 0;
      enqueueSnackbar(
        `Ingested ${j.ingested}, ${j.duplicates} duplicate(s)` +
          (quarantined ? `, ${quarantined} unreadable page(s)` : ""),
        { variant: quarantined ? "warning" : "success" },
      );
      refresh();
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // assign / unassign -----------------------------------------------------
  const handleAssignToggle = async (p: ISapPerson, checked: boolean) => {
    const key = rowKey(p);
    setRowBusy(key, true);
    try {
      if (checked) {
        const date = dateChoice[key] ?? "auto";
        const res = await fetch("/api/saps/assign", {
          method: "POST",
          body: JSON.stringify({ ...targetBody(p), date }),
        });
        if (!res.ok) {
          enqueueSnackbar(await readError(res), { variant: "error" });
          return;
        }
      } else {
        const res = await fetch("/api/saps/assign", {
          method: "DELETE",
          body: JSON.stringify(targetBody(p)),
        });
        if (!res.ok) {
          enqueueSnackbar(await readError(res), { variant: "error" });
          return;
        }
      }
      refresh();
    } finally {
      setRowBusy(key, false);
    }
  };

  // download (issue) — POST flips to received + streams the PDF -----------
  const handleDownload = async (p: ISapPerson) => {
    if (!p.assignment) return;
    const key = rowKey(p);
    setRowBusy(key, true);
    try {
      const res = await fetch(`/api/saps/${p.assignment.sapId}/issue`, {
        method: "POST",
      });
      if (!res.ok) {
        enqueueSnackbar(await readError(res), { variant: "error" });
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `SAP_${p.assignment.sapDate}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      refresh();
    } finally {
      setRowBusy(key, false);
    }
  };

  const handleEmail = async (p: ISapPerson) => {
    if (!p.assignment) return;
    const key = rowKey(p);
    setRowBusy(key, true);
    try {
      const res = await fetch(`/api/saps/${p.assignment.sapId}/email`, {
        method: "POST",
      });
      if (!res.ok) {
        enqueueSnackbar(await readError(res), { variant: "error" });
        return;
      }
      enqueueSnackbar("SAP queued for email", { variant: "success" });
      refresh();
    } finally {
      setRowBusy(key, false);
    }
  };

  const handleAddOffbook = async () => {
    const res = await fetch("/api/saps/offbook", {
      method: "POST",
      body: JSON.stringify({ email: offbookEmail, name: offbookName }),
    });
    if (!res.ok) {
      enqueueSnackbar(await readError(res), { variant: "error" });
      return;
    }
    enqueueSnackbar("Off-book person added", { variant: "success" });
    setOffbookEmail("");
    setOffbookName("");
    mutate(PEOPLE_URL);
  };

  // render ----------------------------------------------------------------
  return (
    <>
      <Hero
        imageStyles={{
          backgroundImage: "url(/banners/storage.jpg)",
          backgroundSize: "cover",
        }}
        text="SAPs"
      />
      <Container component="main" sx={{ mb: 6 }}>
        <Typography sx={{ mb: 2 }}>
          Setup Access Pass management
          {burnYear ? ` — ${burnYear}` : ""}. Upload the year&apos;s batch PDF,
          then assign and deliver passes. A downloaded or emailed SAP is locked.
        </Typography>

        {/* upload */}
        <Box component="section" sx={{ mb: 4 }}>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf"
            hidden
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleUpload(file);
            }}
          />
          <Button
            variant="contained"
            startIcon={<UploadFileIcon />}
            disabled={uploading}
            onClick={() => fileInputRef.current?.click()}
          >
            {uploading ? "Uploading…" : "Upload SAP batch PDF"}
          </Button>
        </Box>

        {/* people */}
        <Typography variant="h5" sx={{ mb: 1 }}>
          People
        </Typography>
        <TableContainer component={Paper} sx={{ mb: 4 }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>First shift</TableCell>
                <TableCell>To-do</TableCell>
                <TableCell>SAP date</TableCell>
                <TableCell align="center">Assign</TableCell>
                <TableCell>Deliver</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {people.map((p) => {
                const key = rowKey(p);
                const assignment = p.assignment;
                const isReceived = assignment?.status === "received";
                const isAssigned = assignment?.status === "assigned";
                const choice = dateChoice[key] ?? "auto";
                const rowBusy = busy[key] ?? false;
                return (
                  <TableRow key={key} hover>
                    <TableCell>
                      <Stack
                        direction="row"
                        spacing={1}
                        alignItems="center"
                      >
                        <span>{p.name}</span>
                        {p.kind === "offbook" && (
                          <Chip label="off-book" size="small" />
                        )}
                        {p.isStaff && (
                          <Chip label="Staff" size="small" color="info" />
                        )}
                      </Stack>
                    </TableCell>
                    <TableCell>
                      {p.firstShiftDayname ?? p.firstShiftDate ?? "—"}
                    </TableCell>
                    <TableCell>
                      {p.requiredDays.length === 0 ? (
                        <Tooltip title="No arrival date set — nothing to require">
                          <span style={{ color: "#999" }}>—</span>
                        </Tooltip>
                      ) : p.missing.length === 0 ? (
                        <Stack
                          direction="row"
                          spacing={0.5}
                          alignItems="center"
                        >
                          <CheckCircleIcon color="success" fontSize="small" />
                          <span>Complete</span>
                        </Stack>
                      ) : (
                        <Tooltip title={`Missing: ${p.missing.join("; ")}`}>
                          <span>Missing {p.missing.length} day(s)</span>
                        </Tooltip>
                      )}
                    </TableCell>
                    <TableCell>
                      {assignment ? (
                        <span>{assignment.sapDate}</span>
                      ) : (
                        <Select
                          size="small"
                          value={choice}
                          disabled={rowBusy}
                          onChange={(e) =>
                            setDateChoice((d) => ({
                              ...d,
                              [key]: e.target.value,
                            }))
                          }
                          sx={{ minWidth: 160 }}
                        >
                          <MenuItem value="auto">
                            {p.autoLabel}
                            {p.autoSapDayname ? ` (${p.autoSapDayname})` : ""}
                          </MenuItem>
                          {availableDates.map((d) => (
                            <MenuItem key={d.date} value={d.date}>
                              {(d.dayname ?? d.date) + ` (${d.count})`}
                            </MenuItem>
                          ))}
                        </Select>
                      )}
                    </TableCell>
                    <TableCell align="center">
                      {isReceived ? (
                        <Tooltip title="Issued — locked">
                          <LockIcon color="disabled" fontSize="small" />
                        </Tooltip>
                      ) : (
                        <input
                          type="checkbox"
                          checked={Boolean(assignment)}
                          disabled={rowBusy}
                          onChange={(e) =>
                            handleAssignToggle(p, e.target.checked)
                          }
                        />
                      )}
                    </TableCell>
                    <TableCell>
                      {isAssigned && (
                        <Stack direction="row" spacing={1}>
                          <Button
                            size="small"
                            startIcon={<DownloadIcon />}
                            disabled={rowBusy}
                            onClick={() => handleDownload(p)}
                          >
                            Download
                          </Button>
                          <Button
                            size="small"
                            startIcon={<EmailIcon />}
                            disabled={rowBusy}
                            onClick={() => handleEmail(p)}
                          >
                            Email
                          </Button>
                        </Stack>
                      )}
                      {isReceived && assignment && (
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Button
                            size="small"
                            startIcon={<DownloadIcon />}
                            href={`/api/saps/${assignment.sapId}/file`}
                          >
                            Re-download
                          </Button>
                          <Button
                            size="small"
                            startIcon={<EmailIcon />}
                            disabled={rowBusy}
                            onClick={() => handleEmail(p)}
                          >
                            Email again
                          </Button>
                          <Chip
                            size="small"
                            label={`via ${assignment.receivedVia}`}
                          />
                        </Stack>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>

        {/* off-book */}
        <Typography variant="h5" sx={{ mb: 1 }}>
          Add off-book person
        </Typography>
        <Stack direction="row" spacing={2} sx={{ mb: 4 }} alignItems="center">
          <TextField
            label="Email"
            size="small"
            value={offbookEmail}
            onChange={(e) => setOffbookEmail(e.target.value)}
          />
          <TextField
            label="Name (optional)"
            size="small"
            value={offbookName}
            onChange={(e) => setOffbookName(e.target.value)}
          />
          <Button
            variant="outlined"
            disabled={!offbookEmail}
            onClick={handleAddOffbook}
          >
            Add
          </Button>
        </Stack>

        {/* pool / disposition */}
        <Typography variant="h5" sx={{ mb: 1 }}>
          All SAPs
        </Typography>
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Ticket ID</TableCell>
                <TableCell>Disposition</TableCell>
                <TableCell>Assignee</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {(poolData?.saps ?? []).map((s) => (
                <TableRow key={s.sapId} hover>
                  <TableCell>{s.sapDate}</TableCell>
                  <TableCell>{s.ticketId}</TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={
                        s.disposition +
                        (s.receivedVia ? ` (${s.receivedVia})` : "")
                      }
                      color={
                        s.disposition === "received"
                          ? "success"
                          : s.disposition === "burned"
                            ? "error"
                            : s.disposition === "assigned"
                              ? "warning"
                              : "default"
                      }
                    />
                  </TableCell>
                  <TableCell>{s.assignee ?? "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Container>
    </>
  );
};
