// Few-shot examples for MSA key term extraction. Server-only — imported by
// lib/openai/extraction.ts to build the system prompt, per docs/specs/03-key-term-extraction.md.
export const MSA_FEW_SHOT_EXAMPLES = `Example 1:
Document excerpt:
[PAGE 1]
This Master Service Agreement ("Agreement") is entered into by and between Northwind Logistics, Inc. ("Client") and Vertex Digital Solutions LLC ("Provider"). Provider shall perform the services described in each Statement of Work, including software development, deployment, and ongoing technical support, as further detailed in Exhibit A.
[PAGE 2]
Client shall pay Provider the fees set forth in each Statement of Work within thirty (30) days of receipt of a correct invoice. Provider shall issue invoices on a monthly basis, on or before the fifth business day of each month.

Expected output:
{ "terms": [
  { "term_name": "Parties", "value": "Northwind Logistics, Inc. (Client) and Vertex Digital Solutions LLC (Provider)", "page_number": 1, "confidence_score": 0.97, "source_sentence": "This Master Service Agreement (\\"Agreement\\") is entered into by and between Northwind Logistics, Inc. (\\"Client\\") and Vertex Digital Solutions LLC (\\"Provider\\")." },
  { "term_name": "Service Scope", "value": "Software development, deployment, and ongoing technical support as detailed in each Statement of Work and Exhibit A.", "page_number": 1, "confidence_score": 0.92, "source_sentence": "Provider shall perform the services described in each Statement of Work, including software development, deployment, and ongoing technical support, as further detailed in Exhibit A." },
  { "term_name": "Payment Terms", "value": "Payment due within 30 days of receipt of a correct invoice.", "page_number": 2, "confidence_score": 0.96, "source_sentence": "Client shall pay Provider the fees set forth in each Statement of Work within thirty (30) days of receipt of a correct invoice." },
  { "term_name": "Invoice Schedule", "value": "Monthly, on or before the fifth business day of each month.", "page_number": 2, "confidence_score": 0.95, "source_sentence": "Provider shall issue invoices on a monthly basis, on or before the fifth business day of each month." }
] }

Example 2:
Document excerpt:
[PAGE 4]
Any invoice not paid within the payment term shall accrue a late payment penalty of 1.5% per month on the outstanding balance, or the maximum rate permitted by law, whichever is lower.
[PAGE 5]
Provider's total aggregate liability arising out of or related to this Agreement shall not exceed the total fees paid by Client to Provider in the twelve (12) months preceding the claim. In no event shall either party be liable for indirect, incidental, or consequential damages.

Expected output:
{ "terms": [
  { "term_name": "Late Payment Penalty", "value": "1.5% per month on the outstanding balance (or the maximum rate permitted by law, if lower).", "page_number": 4, "confidence_score": 0.95, "source_sentence": "Any invoice not paid within the payment term shall accrue a late payment penalty of 1.5% per month on the outstanding balance, or the maximum rate permitted by law, whichever is lower." },
  { "term_name": "Liability Cap", "value": "Capped at total fees paid in the preceding 12 months; no liability for indirect, incidental, or consequential damages.", "page_number": 5, "confidence_score": 0.94, "source_sentence": "Provider's total aggregate liability arising out of or related to this Agreement shall not exceed the total fees paid by Client to Provider in the twelve (12) months preceding the claim." }
] }

Example 3:
Document excerpt:
[PAGE 7]
Either party may terminate this Agreement for convenience upon sixty (60) days' prior written notice to the other party. Either party may terminate immediately upon a material breach that remains uncured for thirty (30) days after written notice.
[PAGE 8]
This Agreement shall be governed by the laws of the State of Delaware. Any dispute arising under this Agreement shall first be submitted to non-binding mediation, and if unresolved within 45 days, to binding arbitration administered by the American Arbitration Association.

Expected output:
{ "terms": [
  { "term_name": "Termination Clause", "value": "Either party may terminate for convenience with 60 days' written notice, or immediately for uncured material breach after 30 days' notice.", "page_number": 7, "confidence_score": 0.93, "source_sentence": "Either party may terminate this Agreement for convenience upon sixty (60) days' prior written notice to the other party." },
  { "term_name": "Notice Period", "value": "60 days for termination for convenience; 30-day cure period for material breach.", "page_number": 7, "confidence_score": 0.9, "source_sentence": "Either party may terminate immediately upon a material breach that remains uncured for thirty (30) days after written notice." },
  { "term_name": "Governing Law", "value": "State of Delaware", "page_number": 8, "confidence_score": 0.97, "source_sentence": "This Agreement shall be governed by the laws of the State of Delaware." },
  { "term_name": "Dispute Resolution", "value": "Non-binding mediation first; if unresolved within 45 days, binding arbitration via the American Arbitration Association.", "page_number": 8, "confidence_score": 0.94, "source_sentence": "Any dispute arising under this Agreement shall first be submitted to non-binding mediation, and if unresolved within 45 days, to binding arbitration administered by the American Arbitration Association." }
] }`
