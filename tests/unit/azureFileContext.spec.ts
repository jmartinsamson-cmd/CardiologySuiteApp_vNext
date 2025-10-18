import { test, expect } from "@playwright/test";

test("summarizeAzureFile uses OpenAI once and returns string", async ({ page }) => {
  await page.goto("/index.html");
  await page.waitForLoadState("networkidle");

  const captured = await page.evaluate(async () => {
    let calls = 0;

    const { Readable } = await import("stream");
    const readable = Readable.from(["NSTEMI case text"]);

    const mockBlobSvc = {
      getContainerClient() {
        return {
          getBlobClient() {
            return {
              async download() {
                return { readableStreamBody: readable } as any;
              },
            } as any;
          },
          getBlockBlobClient() {
            return {
              async downloadToBuffer() {
                return Buffer.from("NSTEMI buffer text", "utf8");
              },
            } as any;
          },
        } as any;
      },
    } as any;

    const mockOpenAI = {
      chat: {
        completions: {
          create: async () => {
            calls += 1;
            return { choices: [{ message: { content: "Summarized text" } }] } as any;
          },
        },
      },
    } as any;

    // @ts-ignore
    globalThis.__TEST_OVERRIDES__ = { blobServiceClient: mockBlobSvc, openai: mockOpenAI };

    const mod = await import("/src/server/ai-search/azureFileContext.js");
    const out = await mod.summarizeAzureFile("cardiology-data", "NSTEMI.txt");
    return { out, calls };
  });

  expect(typeof captured.out).toBe("string");
  expect(captured.out.length).toBeGreaterThan(0);
  expect(captured.calls).toBe(1);
});
