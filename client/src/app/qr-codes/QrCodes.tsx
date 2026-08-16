"use client";

import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Download as DownloadIcon,
  Edit as EditIcon,
  Home as HomeIcon,
} from "@mui/icons-material";
import {
  Button,
  Chip,
  Container,
  IconButton,
  Menu,
  MenuItem,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from "@mui/material";
import { enqueueSnackbar } from "notistack";
import { useState, type MouseEvent } from "react";
import useSWR from "swr";

import { ErrorPage } from "@/components/general/ErrorPage";
import { Loading } from "@/components/general/Loading";
import { Hero } from "@/components/layout/Hero";
import type { IQrCode, IResQrList } from "@/components/types/qr";
import { fetcherGet } from "@/utils/fetcher";

import { QrEditor } from "./QrEditor";
import { SIZE_OPTIONS } from "./qrDefaults";

const LIST_URL = "/api/qr-codes";

async function readError(res: Response): Promise<string> {
  try {
    return (await res.json()).message ?? `Request failed (${res.status})`;
  } catch {
    return `Request failed (${res.status})`;
  }
}

export const QrCodes = () => {
  const { data, error, mutate } = useSWR<IResQrList>(LIST_URL, fetcherGet);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<IQrCode | null>(null);
  // Download-format menu anchor + which row it's for.
  const [dlAnchor, setDlAnchor] = useState<null | HTMLElement>(null);
  const [dlRow, setDlRow] = useState<IQrCode | null>(null);

  if (error) return <ErrorPage />;
  if (!data) return <Loading />;

  const burnYear = data.burnYear ?? new Date().getFullYear();

  const openCreate = () => {
    setEditing(null);
    setEditorOpen(true);
  };
  const openEdit = (row: IQrCode) => {
    setEditing(row);
    setEditorOpen(true);
  };

  const handleDelete = async (row: IQrCode) => {
    if (!window.confirm(`Delete "${row.filename}"?`)) return;
    const res = await fetch(`/api/qr-codes/${row.qrId}`, { method: "DELETE" });
    if (!res.ok) {
      enqueueSnackbar(await readError(res), { variant: "error" });
      return;
    }
    mutate();
  };

  // Toggle a purpose. Clicking the current holder untags it; else tags this row
  // (server clears the prior holder — one per purpose).
  const handlePurpose = async (row: IQrCode, purpose: "home" | "download") => {
    const next = row.purpose === purpose ? null : purpose;
    const res = await fetch(`/api/qr-codes/${row.qrId}/purpose`, {
      method: "POST",
      body: JSON.stringify({ purpose: next }),
    });
    if (!res.ok) {
      enqueueSnackbar(await readError(res), { variant: "error" });
      return;
    }
    mutate();
  };

  const openDownloadMenu = (e: MouseEvent<HTMLElement>, row: IQrCode) => {
    setDlAnchor(e.currentTarget);
    setDlRow(row);
  };
  const download = (format: string, size?: string) => {
    if (!dlRow) return;
    const q = new URLSearchParams({ format, ...(size ? { size } : {}) });
    window.open(`/api/qr-codes/${dlRow.qrId}/download?${q}`, "_blank");
    setDlAnchor(null);
  };

  return (
    <>
      <Hero
        imageStyles={{
          backgroundImage: "url(/banners/desk-group.jpg)",
          backgroundSize: "cover",
        }}
        text="QR Codes"
      />
      <Container component="main" sx={{ mb: 6 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
          <Typography>
            Create QR codes for calendar events, links, and WiFi. Designate one for the
            home page or the downloadable slot.
          </Typography>
          <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
            New QR code
          </Button>
        </Stack>

        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Type</TableCell>
                <TableCell>Year</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Time</TableCell>
                <TableCell>Subject</TableCell>
                <TableCell>Filename</TableCell>
                <TableCell>Purpose</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data.qrCodes.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ color: "text.secondary" }}>
                    No QR codes yet — create one.
                  </TableCell>
                </TableRow>
              )}
              {data.qrCodes.map((row) => (
                <TableRow key={row.qrId} hover>
                  <TableCell sx={{ textTransform: "capitalize" }}>{row.qrType}</TableCell>
                  <TableCell>{row.burnYear ?? "—"}</TableCell>
                  <TableCell>{row.eventDate ?? "—"}</TableCell>
                  <TableCell>{row.eventTime?.slice(0, 5) ?? "—"}</TableCell>
                  <TableCell>{row.subject ?? "—"}</TableCell>
                  <TableCell>{row.filename}</TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={0.5}>
                      <Tooltip title="Show on Home page">
                        <Chip
                          size="small"
                          icon={<HomeIcon />}
                          label="Home"
                          color={row.purpose === "home" ? "primary" : "default"}
                          variant={row.purpose === "home" ? "filled" : "outlined"}
                          onClick={() => handlePurpose(row, "home")}
                        />
                      </Tooltip>
                      <Tooltip title="Public downloadable QR">
                        <Chip
                          size="small"
                          icon={<DownloadIcon />}
                          label="Download"
                          color={row.purpose === "download" ? "primary" : "default"}
                          variant={row.purpose === "download" ? "filled" : "outlined"}
                          onClick={() => handlePurpose(row, "download")}
                        />
                      </Tooltip>
                    </Stack>
                  </TableCell>
                  <TableCell align="right">
                    <IconButton size="small" onClick={(e) => openDownloadMenu(e, row)}>
                      <DownloadIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" onClick={() => openEdit(row)}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" onClick={() => handleDelete(row)}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Container>

      <Menu anchorEl={dlAnchor} open={Boolean(dlAnchor)} onClose={() => setDlAnchor(null)}>
        {SIZE_OPTIONS.map((o) => (
          <MenuItem key={o.key} onClick={() => download("png", o.key)}>
            PNG — {o.label}
          </MenuItem>
        ))}
        <MenuItem onClick={() => download("svg")}>SVG (vector)</MenuItem>
      </Menu>

      <QrEditor
        open={editorOpen}
        burnYear={burnYear}
        editing={editing}
        onClose={() => setEditorOpen(false)}
        onSaved={() => {
          setEditorOpen(false);
          mutate();
        }}
      />
    </>
  );
};
