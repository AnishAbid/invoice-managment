"use client";

async function renderCanvas(el: HTMLElement) {
  const { default: html2canvas } = await import("html2canvas-pro");
  // Make sure web fonts (Urdu Nastaliq) are ready before rasterising
  await document.fonts.ready;
  return html2canvas(el, { scale: 2, backgroundColor: "#ffffff", useCORS: true });
}

function triggerDownload(href: string, filename: string) {
  const a = document.createElement("a");
  a.href = href;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

export async function downloadAsPDF(el: HTMLElement, filename: string) {
  const [{ jsPDF }, canvas] = await Promise.all([import("jspdf"), renderCanvas(el)]);
  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  const margin = 10;
  const imgW = pageW - margin * 2;
  const imgH = (canvas.height * imgW) / canvas.width;
  const img = canvas.toDataURL("image/jpeg", 0.95);

  if (imgH <= pageH - margin * 2) {
    pdf.addImage(img, "JPEG", margin, margin, imgW, imgH);
  } else {
    // Long receipts: slice across multiple pages
    const usableH = pageH - margin * 2;
    let offset = 0;
    while (offset < imgH) {
      if (offset > 0) pdf.addPage();
      pdf.addImage(img, "JPEG", margin, margin - offset, imgW, imgH);
      offset += usableH;
    }
  }
  pdf.save(filename.endsWith(".pdf") ? filename : `${filename}.pdf`);
}

export async function downloadAsPNG(el: HTMLElement, filename: string) {
  const canvas = await renderCanvas(el);
  triggerDownload(canvas.toDataURL("image/png"), filename.endsWith(".png") ? filename : `${filename}.png`);
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  triggerDownload(url, filename);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Prints only the given element by cloning it into a hidden iframe. */
export function printElement(el: HTMLElement, title: string) {
  const iframe = document.createElement("iframe");
  iframe.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0";
  document.body.appendChild(iframe);
  const doc = iframe.contentDocument!;
  const styles = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'))
    .map((n) => n.outerHTML)
    .join("");
  doc.open();
  doc.write(
    `<!doctype html><html class="${document.documentElement.className}"><head><title>${title}</title>${styles}
    <style>@page{size:A4;margin:12mm}body{background:#fff;margin:0}</style></head>
    <body>${el.outerHTML}</body></html>`,
  );
  doc.close();
  let printed = false;
  const go = () => {
    if (printed) return;
    printed = true;
    iframe.contentWindow!.focus();
    iframe.contentWindow!.print();
    setTimeout(() => iframe.remove(), 1000);
  };
  iframe.onload = () => (iframe.contentDocument!.fonts ? iframe.contentDocument!.fonts.ready.then(go) : go());
  // Some browsers don't fire onload after document.write
  setTimeout(() => iframe.isConnected && go(), 1200);
}

/** Prints an image or PDF file blob directly. */
export function printFile(blob: Blob) {
  const url = URL.createObjectURL(blob);
  if (blob.type === "application/pdf") {
    const w = window.open(url, "_blank");
    w?.addEventListener("load", () => w.print());
    return;
  }
  const iframe = document.createElement("iframe");
  iframe.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0";
  document.body.appendChild(iframe);
  const doc = iframe.contentDocument!;
  doc.open();
  doc.write(
    `<!doctype html><html><head><style>@page{margin:10mm}body{margin:0;display:flex;justify-content:center}img{max-width:100%;max-height:100vh}</style></head><body><img src="${url}"></body></html>`,
  );
  doc.close();
  const img = doc.querySelector("img")!;
  const go = () => {
    iframe.contentWindow!.print();
    setTimeout(() => {
      iframe.remove();
      URL.revokeObjectURL(url);
    }, 1000);
  };
  if (img.complete) go();
  else img.onload = go;
}
