import { api, unwrap } from "./client";
export interface KycDocument {
  url: string;
  name: string;
}
export function uploadKycFile(file: File) {
  const form = new FormData();
  form.append("file", file);
  return unwrap<KycDocument>(api.post("/uploads", form));
}
export const submitKyc = (docs: KycDocument[]) =>
  unwrap<unknown>(
    api.post("/kyc", { docs: docs.map(({ url, name }) => ({ url, name })) }),
  );
