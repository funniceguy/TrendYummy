let cachedBasePath: string | null = null;

function normalizeBasePath(value: string | undefined): string {
  if (!value) {
    return "";
  }

  const trimmed = value.trim();
  if (!trimmed || trimmed === "/") {
    return "";
  }

  const withLeadingSlash = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  return withLeadingSlash.endsWith("/")
    ? withLeadingSlash.slice(0, -1)
    : withLeadingSlash;
}

function detectBasePathFromNextAssets(): string {
  if (typeof document === "undefined" || typeof window === "undefined") {
    return "";
  }

  const scripts = document.querySelectorAll<HTMLScriptElement>(
    "script[src*=\"/_next/\"]",
  );

  for (const script of scripts) {
    const rawSrc = script.getAttribute("src");
    if (!rawSrc) {
      continue;
    }

    const pathname = rawSrc.startsWith("http")
      ? new URL(rawSrc, window.location.origin).pathname
      : rawSrc;

    const nextAssetIndex = pathname.indexOf("/_next/");
    if (nextAssetIndex > 0) {
      return pathname.slice(0, nextAssetIndex);
    }
  }

  return "";
}

export function getBasePath(): string {
  if (cachedBasePath !== null) {
    return cachedBasePath;
  }

  const envBasePath = normalizeBasePath(process.env.NEXT_PUBLIC_BASE_PATH);
  if (envBasePath) {
    cachedBasePath = envBasePath;
    return cachedBasePath;
  }

  cachedBasePath = detectBasePathFromNextAssets();
  return cachedBasePath;
}

export function getApiPath(path: string): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const basePath = getBasePath();
  return `${basePath}${normalizedPath}`;
}
