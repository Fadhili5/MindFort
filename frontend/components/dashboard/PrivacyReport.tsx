"use client";

import { Button } from "@/components/ui/button";

function buildPdf(lines: string[]): Blob {
  const safeLines = lines.map((line) => line.replace(/[()]/g, ""));
  const content = safeLines.map((line, index) => `BT /F1 11 Tf 50 ${760 - index * 18} Td (${line}) Tj ET`).join("\n");
  const pdf = `%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Count 1/Kids[3 0 R]>>endobj\n3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 612 792]/Resources<</Font<</F1 4 0 R>>>>/Contents 5 0 R>>endobj\n4 0 obj<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>endobj\n5 0 obj<</Length ${content.length}>>stream\n${content}\nendstream\nendobj\nxref\n0 6\n0000000000 65535 f \n0000000010 00000 n \n0000000061 00000 n \n0000000120 00000 n \n0000000244 00000 n \n0000000314 00000 n \ntrailer<</Root 1 0 R/Size 6>>\nstartxref\n${314 + content.length}\n%%EOF`;
  return new Blob([pdf], { type: "application/pdf" });
}

export function PrivacyReport() {
  function downloadPdf(): void {
    const lines = [
      "MindVault Privacy Transparency Report",
      "",
      "What stays on device:",
      "- Raw answers, tutoring prompts, and mnemonic wallet seed",
      "",
      "What leaves device:",
      "- Federated gradients and signed mastery attestations",
      "",
      "Encryption:",
      "- Lightway DTLS 1.2 tunnel with PQC ML-KEM mode",
      "",
      "Credential storage:",
      "- Abelian UTXO chain outputs"
    ];
    const blob = buildPdf(lines);
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "mindvault-privacy-report.pdf";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div style={{ borderRadius: 16, border: "1px solid #f3f4f6", background: "white", padding: "1.5rem", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
      <h3 style={{ margin: "0 0 1rem", fontWeight: 700, color: "#1f2937" }}>Privacy Transparency Report</h3>
      <div style={{ marginBottom: 16, display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
        {[
          { label: "On device",            value: "Tutoring inference, answers, wallet mnemonic" },
          { label: "Leaves device",        value: "Federated gradients & mastery attestations only" },
          { label: "Transport encryption", value: "Lightway DTLS 1.2 + PQC ML-KEM tunnel" },
          { label: "Credential storage",   value: "Abelian UTXO ledger" }
        ].map((item) => (
          <div key={item.label} style={{ borderRadius: 12, background: "#f9fafb", padding: "0.75rem" }}>
            <p style={{ fontSize: "0.625rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", color: "#9ca3af", margin: 0 }}>{item.label}</p>
            <p style={{ marginTop: 4, fontSize: "0.75rem", color: "#4b5563", lineHeight: 1.6, margin: "4px 0 0" }}>{item.value}</p>
          </div>
        ))}
      </div>
      <Button onClick={downloadPdf}>Download PDF Report</Button>
    </div>
  );
}
