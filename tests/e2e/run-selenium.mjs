import { Builder, By, Key, until } from "selenium-webdriver";
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
    await rejectButtons[0].click();
    await driver.wait(until.elementLocated(By.css("[data-testid='reject-reason-input']")), 10000);
    const reasonInput = await driver.findElement(By.css("[data-testid='reject-reason-input']"));
    await reasonInput.sendKeys(`Tidak valid (${Date.now()})`);
    await driver.findElement(By.xpath("//button[normalize-space()='Tolak']")).click();
    await driver.wait(until.elementLocated(By.xpath("//*[contains(normalize-space(), 'berhasil ditolak')]")), 15000);
  } else {
    await approveButtons[0].click();
    await driver.findElement(By.xpath("//button[normalize-space()='Setujui']")).click();
    await driver.wait(until.elementLocated(By.xpath("//*[contains(normalize-space(), 'berhasil disetujui')]")), 15000);
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
