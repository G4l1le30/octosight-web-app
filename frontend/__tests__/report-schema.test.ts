import { IncidentSchemas } from "@/modules/report/schemas";

describe("IncidentSchemas.Website", () => {
  it("accepts valid website report", () => {
    const result = IncidentSchemas.Website.safeParse({
      type: "Website",
      url: "phishing-site.com",
      summary: "Suspicious login page",
      incidentDate: "2026-05-29",
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing URL", () => {
    const result = IncidentSchemas.Website.safeParse({
      type: "Website",
      url: "",
      incidentDate: "2026-05-29",
    });
    expect(result.success).toBe(false);
  });

  it("validates bank account contains only digits", () => {
    const valid = IncidentSchemas.Website.safeParse({
      type: "Website",
      url: "fakebank.com",
      incidentDate: "2026-05-29",
      bankAccount: "1234567890",
    });
    expect(valid.success).toBe(true);

    const invalid = IncidentSchemas.Website.safeParse({
      type: "Website",
      url: "fakebank.com",
      incidentDate: "2026-05-29",
      bankAccount: "ABC123",
    });
    expect(invalid.success).toBe(false);
  });
});
