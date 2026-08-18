import type { QrSettings, QrType } from "lib/qr";

// A registry row as returned to the client (camelCased).
export interface IQrCode {
  qrId: number;
  qrType: QrType;
  filename: string;
  subject: string | null;
  payload: string;
  settings: QrSettings;
  purpose: "home" | "download" | null;
  burnYear: number | null;
  eventDate: string | null;
  eventTime: string | null;
  createdBy: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface IResQrList {
  statusCode: number;
  burnYear: number | null;
  qrCodes: IQrCode[];
}
