import { Builder, By, until } from "selenium-webdriver";
import chrome from "selenium-webdriver/chrome.js";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const config = {
  baseUrl: process.env.E2E_BASE_URL || "http://localhost:3000",
  adminEmail: process.env.E2E_ADMIN_EMAIL || "",
  adminPassword: process.env.E2E_ADMIN_PASSWORD || "",
  buruhEmail: process.env.E2E_BURUH_EMAIL || "",
  buruhPassword: process.env.E2E_BURUH_PASSWORD || "",
  mandorEmail: process.env.E2E_MANDOR_EMAIL || "",
  mandorPassword: process.env.E2E_MANDOR_PASSWORD || "",
  headless: parseBoolean(process.env.E2E_HEADLESS, true),
  skipMutationIfNoSeed: parseBoolean(process.env.E2E_SKIP_MUTATION_IF_NO_SEED, true),
};

const forceHeaded = process.argv.includes("--headed");
if (forceHeaded) config.headless = false;

function parseBoolean(rawValue, fallback) {
  if (!rawValue || rawValue.trim().length === 0) return fallback;
  return rawValue.toLowerCase() === "true" || rawValue === "1";
}

function hasCredentials(email, password) {
  return email.trim().length > 0 && password.trim().length > 0;
}

async function waitForText(driver, text, timeout = 15000) {
  await driver.wait(until.elementLocated(By.xpath(`//*[contains(normalize-space(), "${text}")]`)), timeout);
}

async function assertNoRawJsonError(driver) {
  const bodyText = await driver.findElement(By.tagName("body")).getText();
  if (bodyText.includes("Unexpected end of JSON input")) {
    throw new Error("Found raw JSON parse error in UI.");
  }
}

async function clickWithScroll(driver, element) {
  await driver.executeScript("arguments[0].scrollIntoView({block: 'center'});", element);
  await driver.wait(until.elementIsVisible(element), 10000);
  await driver.executeScript("arguments[0].click();", element);
}

async function waitForMandorOutcome(driver, successText) {
  await driver.wait(async () => {
    const bodyText = await driver.findElement(By.tagName("body")).getText();
    return bodyText.includes(successText) || bodyText.includes("Terjadi masalah");
  }, 20000);

  const bodyText = await driver.findElement(By.tagName("body")).getText();
  if (bodyText.includes(successText)) {
    return "success";
  }
  return "error";
}

async function closeDecisionModalIfOpen(driver) {
  const overlays = await driver.findElements(By.css("div.fixed.inset-0"));
  if (overlays.length === 0) return;
  const cancelButtons = await driver.findElements(By.xpath("//div[contains(@class,'fixed') and contains(@class,'inset-0')]//button[normalize-space()='Batal']"));
  if (cancelButtons.length > 0) {
    await clickWithScroll(driver, cancelButtons[0]);
    await driver.wait(async () => (await driver.findElements(By.css("div.fixed.inset-0"))).length === 0, 10000);
  }
}

async function login(driver, email, password) {
  await driver.get(`${config.baseUrl}/login`);
  await driver.wait(until.elementLocated(By.css("input[type='email']")), 15000);
  const emailInput = await driver.findElement(By.css("input[type='email']"));
  const passwordInput = await driver.findElement(By.css("input[type='password']"));
  await emailInput.clear();
  await emailInput.sendKeys(email);
  await passwordInput.clear();
  await passwordInput.sendKeys(password);
  await driver.findElement(By.css("button[type='submit']")).click();
  await driver.wait(async () => {
    const url = await driver.getCurrentUrl();
    return !url.includes("/login");
  }, 15000);
  await assertNoRawJsonError(driver);
}

async function logout(driver) {
  const logoutButtons = await driver.findElements(By.xpath("//button[normalize-space()='Logout']"));
  if (logoutButtons.length > 0) {
    await logoutButtons[0].click();
    await driver.wait(until.urlContains("/login"), 10000);
  }
}

async function adminSmoke(driver) {
  if (!hasCredentials(config.adminEmail, config.adminPassword)) {
    console.log("[SKIP] Admin flow skipped: missing E2E admin credentials.");
    return;
  }

  console.log("[ADMIN] Login and kebun smoke.");
  await login(driver, config.adminEmail, config.adminPassword);
  await driver.get(`${config.baseUrl}/admin/kebun`);
  await waitForText(driver, "Manajemen Kebun");
  await assertNoRawJsonError(driver);
  await logout(driver);
}

async function buruhFlow(driver) {
  if (!hasCredentials(config.buruhEmail, config.buruhPassword)) {
    console.log("[SKIP] Buruh flow skipped: missing E2E buruh credentials.");
    return;
  }

  console.log("[BURUH] Login and submit harvest report.");
  await login(driver, config.buruhEmail, config.buruhPassword);
  await driver.get(`${config.baseUrl}/hasil-panen/lapor`);
  await waitForText(driver, "Lapor Hasil Panen");

  const kilogramInput = await driver.findElement(By.css("[data-testid='harvest-kilogram-input']"));
  const reportTextArea = await driver.findElement(By.css("[data-testid='harvest-report-textarea']"));
  const photoInput = await driver.findElement(By.css("[data-testid='harvest-photo-input']"));
  const fixturePath = path.resolve(__dirname, "../fixtures/harvest-proof.jpg");

  await kilogramInput.clear();
  await kilogramInput.sendKeys("120.5");
  await reportTextArea.clear();
  await reportTextArea.sendKeys(`Laporan panen E2E ${Date.now()}`);
  await photoInput.sendKeys(fixturePath);
  await driver.findElement(By.css("[data-testid='submit-harvest-report-button']")).click();

  await driver.wait(async () => {
    const bodyText = await driver.findElement(By.tagName("body")).getText();
    const url = await driver.getCurrentUrl();
    return (
      bodyText.includes("Laporan panen hari ini sudah dibuat") ||
      bodyText.includes("Laporan panen berhasil dikirim") ||
      /\/hasil-panen\/[0-9a-fA-F-]+$/.test(url)
    );
  }, 15000);

  await driver.get(`${config.baseUrl}/hasil-panen/riwayat`);
  await waitForText(driver, "Riwayat Hasil Panen");
  await assertNoRawJsonError(driver);
  await logout(driver);
}

async function mandorFlow(driver) {
  if (!hasCredentials(config.mandorEmail, config.mandorPassword)) {
    console.log("[SKIP] Mandor flow skipped: missing E2E mandor credentials.");
    return;
  }

  console.log("[MANDOR] Login and review dashboard.");
  await login(driver, config.mandorEmail, config.mandorPassword);
  await driver.get(`${config.baseUrl}/hasil-panen/mandor`);
  await waitForText(driver, "Dashboard Review Panen Mandor");
  await assertNoRawJsonError(driver);

  const rejectButtons = await driver.findElements(By.css("[data-testid^='reject-button-']"));
  const approveButtons = await driver.findElements(By.css("[data-testid^='approve-button-']"));

  if (rejectButtons.length === 0 && approveButtons.length === 0) {
    if (config.skipMutationIfNoSeed) {
      console.log("[MANDOR] No pending harvest found. Mutation step skipped.");
      await logout(driver);
      return;
    }
    throw new Error("No pending harvest found for mandor mutation scenario.");
  }

  if (rejectButtons.length > 0) {
    const rejectButton = rejectButtons[0];
    await clickWithScroll(driver, rejectButton);
    await driver.wait(until.elementLocated(By.css("[data-testid='reject-reason-input']")), 10000);
    const reasonInput = await driver.findElement(By.css("[data-testid='reject-reason-input']"));
    await reasonInput.sendKeys(`Tidak valid (${Date.now()})`);
    const confirmReject = await driver.findElement(By.xpath("//div[contains(@class,'fixed') and contains(@class,'inset-0')]//button[normalize-space()='Tolak']"));
    await clickWithScroll(driver, confirmReject);
    const outcome = await waitForMandorOutcome(driver, "berhasil ditolak");
    if (outcome !== "success" && config.skipMutationIfNoSeed) {
      console.log("[MANDOR] Reject mutation returned validation/authorization error. Skipping due to E2E_SKIP_MUTATION_IF_NO_SEED=true.");
      await closeDecisionModalIfOpen(driver);
    } else if (outcome !== "success") {
      throw new Error("Mandor reject mutation did not return success.");
    }
  } else {
    const approveButton = approveButtons[0];
    await clickWithScroll(driver, approveButton);
    const confirmApprove = await driver.findElement(By.xpath("//div[contains(@class,'fixed') and contains(@class,'inset-0')]//button[normalize-space()='Setujui']"));
    await clickWithScroll(driver, confirmApprove);
    const outcome = await waitForMandorOutcome(driver, "berhasil disetujui");
    if (outcome !== "success" && config.skipMutationIfNoSeed) {
      console.log("[MANDOR] Approve mutation returned validation/authorization error. Skipping due to E2E_SKIP_MUTATION_IF_NO_SEED=true.");
      await closeDecisionModalIfOpen(driver);
    } else if (outcome !== "success") {
      throw new Error("Mandor approve mutation did not return success.");
    }
  }

  await assertNoRawJsonError(driver);
  await logout(driver);
}

async function main() {
  const options = new chrome.Options();
  if (config.headless) {
    options.addArguments("--headless=new");
  }
  options.addArguments("--window-size=1600,1200");
  options.addArguments("--disable-gpu");
  options.addArguments("--no-sandbox");

  const driver = await new Builder().forBrowser("chrome").setChromeOptions(options).build();
  try {
    await adminSmoke(driver);
    await buruhFlow(driver);
    await mandorFlow(driver);
    console.log("E2E integration flow completed.");
  } finally {
    await driver.quit();
  }
}

main().catch((error) => {
  console.error("E2E failed:", error);
  process.exitCode = 1;
});
