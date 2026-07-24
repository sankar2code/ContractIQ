// Few-shot examples for NDA key term extraction. Server-only — imported by
// lib/openai/extraction.ts to build the system prompt, per docs/specs/03-key-term-extraction.md.
// Not imported client-side; keep prompt engineering content out of the browser bundle.
export const NDA_FEW_SHOT_EXAMPLES = `Example 1:
Document excerpt:
[PAGE 1]
This Mutual Non-Disclosure Agreement ("Agreement") is entered into as of March 3, 2025 (the "Effective Date") by and between Acme Robotics, Inc., a Delaware corporation ("Acme"), and Bright Path Consulting LLC, a California limited liability company ("Bright Path").
[PAGE 2]
Each party agrees to hold the other party's Confidential Information in strict confidence and not to disclose such Confidential Information to any third party without the prior written consent of the disclosing party, except to employees and advisors who have a need to know and who are bound by confidentiality obligations at least as protective as those in this Agreement.

Expected output:
{ "terms": [
  { "term_name": "Parties", "value": "Acme Robotics, Inc. and Bright Path Consulting LLC", "page_number": 1, "confidence_score": 0.97, "source_sentence": "This Mutual Non-Disclosure Agreement (\\"Agreement\\") is entered into as of March 3, 2025 (the \\"Effective Date\\") by and between Acme Robotics, Inc., a Delaware corporation (\\"Acme\\"), and Bright Path Consulting LLC, a California limited liability company (\\"Bright Path\\")." },
  { "term_name": "Effective Date", "value": "March 3, 2025", "page_number": 1, "confidence_score": 0.98, "source_sentence": "This Mutual Non-Disclosure Agreement (\\"Agreement\\") is entered into as of March 3, 2025 (the \\"Effective Date\\") by and between Acme Robotics, Inc., a Delaware corporation (\\"Acme\\"), and Bright Path Consulting LLC, a California limited liability company (\\"Bright Path\\")." },
  { "term_name": "Confidentiality Obligations", "value": "Each party must hold the other's Confidential Information in strict confidence and may not disclose it to third parties without prior written consent, except to employees/advisors bound by equivalent confidentiality duties.", "page_number": 2, "confidence_score": 0.93, "source_sentence": "Each party agrees to hold the other party's Confidential Information in strict confidence and not to disclose such Confidential Information to any third party without the prior written consent of the disclosing party, except to employees and advisors who have a need to know and who are bound by confidentiality obligations at least as protective as those in this Agreement." }
] }

Example 2:
Document excerpt:
[PAGE 3]
This Agreement shall remain in effect for a period of three (3) years from the Effective Date, and the confidentiality obligations herein shall survive termination of this Agreement for an additional period of five (5) years.
[PAGE 4]
This Agreement shall be governed by and construed in accordance with the laws of the State of New York, without regard to its conflict of laws principles. The parties consent to the exclusive jurisdiction of the state and federal courts located in New York County, New York.

Expected output:
{ "terms": [
  { "term_name": "Term & Duration", "value": "3 years from the Effective Date, with confidentiality obligations surviving termination for an additional 5 years.", "page_number": 3, "confidence_score": 0.95, "source_sentence": "This Agreement shall remain in effect for a period of three (3) years from the Effective Date, and the confidentiality obligations herein shall survive termination of this Agreement for an additional period of five (5) years." },
  { "term_name": "Governing Law", "value": "State of New York", "page_number": 4, "confidence_score": 0.97, "source_sentence": "This Agreement shall be governed by and construed in accordance with the laws of the State of New York, without regard to its conflict of laws principles." },
  { "term_name": "Jurisdiction", "value": "State and federal courts located in New York County, New York", "page_number": 4, "confidence_score": 0.96, "source_sentence": "The parties consent to the exclusive jurisdiction of the state and federal courts located in New York County, New York." }
] }

Example 3:
Document excerpt:
[PAGE 5]
Any Confidential Information disclosed by a party, together with all patents, copyrights, trade secrets, and other intellectual property rights therein, shall remain the sole and exclusive property of the disclosing party. Nothing in this Agreement shall be construed as granting any license or ownership interest to the receiving party.
[PAGE 6]
During the term of this Agreement and for twelve (12) months thereafter, neither party shall directly or indirectly solicit for employment any employee of the other party with whom it had contact under this Agreement.

Expected output:
{ "terms": [
  { "term_name": "IP Ownership", "value": "All intellectual property in Confidential Information remains the sole property of the disclosing party; no license is granted to the receiving party.", "page_number": 5, "confidence_score": 0.94, "source_sentence": "Any Confidential Information disclosed by a party, together with all patents, copyrights, trade secrets, and other intellectual property rights therein, shall remain the sole and exclusive property of the disclosing party." },
  { "term_name": "Non-Solicitation", "value": "Neither party may solicit the other's employees for 12 months after the Agreement term ends.", "page_number": 6, "confidence_score": 0.92, "source_sentence": "During the term of this Agreement and for twelve (12) months thereafter, neither party shall directly or indirectly solicit for employment any employee of the other party with whom it had contact under this Agreement." }
] }`
