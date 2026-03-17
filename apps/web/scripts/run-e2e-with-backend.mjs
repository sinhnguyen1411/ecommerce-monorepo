import { spawn } from "node:child_process";
import { dirname, resolve } from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const webDir = resolve(__dirname, "..");
const repoRoot = resolve(webDir, "..", "..");
const infraDir = resolve(repoRoot, "infra");
const playwrightCliPath = resolve(webDir, "node_modules", "playwright", "cli.js");
const services = ["mysql", "redis", "api"];
const dockerCommand = process.platform === "win32" ? "docker.exe" : "docker";

function spawnCommand(command, args, options = {}) {
  const {
    cwd = process.cwd(),
    stdio = "pipe",
    env = process.env,
    allowFailure = false,
    shell = false,
  } = options;

  return new Promise((resolvePromise, rejectPromise) => {
    const child = spawn(command, args, {
      cwd,
      env,
      stdio,
      shell,
    });

    let stdout = "";
    let stderr = "";

    if (child.stdout) {
      child.stdout.on("data", (chunk) => {
        stdout += String(chunk);
      });
    }

    if (child.stderr) {
      child.stderr.on("data", (chunk) => {
        stderr += String(chunk);
      });
    }

    child.on("error", rejectPromise);
    child.on("close", (code) => {
      const result = { code: code ?? 1, stdout, stderr };
      if (!allowFailure && result.code !== 0) {
        const error = new Error(
          `Command failed: ${command} ${args.join(" ")}\n${stderr || stdout}`.trim()
        );
        error.result = result;
        rejectPromise(error);
        return;
      }
      resolvePromise(result);
    });
  });
}

async function ensureDockerAvailable() {
  try {
    await spawnCommand(dockerCommand, ["info"], { allowFailure: false });
  } catch {
    throw new Error(
      "Docker Desktop is not running. Start Docker Desktop, then re-run `npm run test:e2e`."
    );
  }
}

async function getRunningServices() {
  const result = await spawnCommand(
    dockerCommand,
    ["compose", "ps", "--services", "--status", "running"],
    { cwd: infraDir, allowFailure: true }
  );

  if (result.code !== 0) {
    return new Set();
  }

  return new Set(
    result.stdout
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
  );
}

async function waitForApiHealth(timeoutMs = 120_000) {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    try {
      const response = await fetch("http://127.0.0.1:8080/healthz", {
        signal: AbortSignal.timeout(2_000),
      });

      if (response.ok) {
        return;
      }
    } catch {}

    await new Promise((resolvePromise) => setTimeout(resolvePromise, 2_000));
  }

  await spawnCommand(
    dockerCommand,
    ["compose", "logs", "--tail", "120", "api", "mysql", "redis"],
    { cwd: infraDir, stdio: "inherit", allowFailure: true }
  );

  throw new Error("API health check did not become ready within 120 seconds.");
}

async function startBackend() {
  console.log("[e2e] Ensuring backend services are running...");
  const runningBefore = await getRunningServices();

  await spawnCommand(
    dockerCommand,
    ["compose", "up", "-d", "--build", ...services],
    { cwd: infraDir, stdio: "inherit" }
  );

  await waitForApiHealth();
  return services.filter((service) => !runningBefore.has(service));
}

async function stopStartedServices(startedServices) {
  if (!startedServices.length) {
    return;
  }

  console.log(`[e2e] Stopping services started for this run: ${startedServices.join(", ")}`);
  await spawnCommand(dockerCommand, ["compose", "stop", ...startedServices], {
    cwd: infraDir,
    stdio: "inherit",
    allowFailure: true,
  });
}

async function run() {
  await ensureDockerAvailable();
  const startedServices = await startBackend();

  let exitCode = 1;
  try {
    const result = await spawnCommand(
      process.execPath,
      [playwrightCliPath, "test", ...process.argv.slice(2)],
      {
        cwd: webDir,
        stdio: "inherit",
        env: process.env,
      }
    );
    exitCode = result.code;
  } finally {
    await stopStartedServices(startedServices);
  }

  process.exit(exitCode);
}

run().catch((error) => {
  console.error(`[e2e] ${error.message}`);
  process.exit(1);
});
