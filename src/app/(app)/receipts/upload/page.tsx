import { redirect } from "next/navigation";

/** Mobile uses /receipts/upload; web canonical route is /upload. */
export default function ReceiptsUploadRedirect() {
  redirect("/upload");
}
