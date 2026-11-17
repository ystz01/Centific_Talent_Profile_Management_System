const normalizeBaseUrl = (value: string | undefined): string | undefined => {
  const normalized = value?.trim().replace(/\/+$/, '');
  return normalized || undefined;
};

const primaryApiUrl = normalizeBaseUrl(process.env.NEXT_PUBLIC_API_URL);
const backupApiUrl = normalizeBaseUrl(process.env.NEXT_PUBLIC_BACKUP_API_URL);

let activeApiUrl = primaryApiUrl;

export function getApiBaseUrl(): string | undefined {
  return activeApiUrl;
}

export function getConfiguredApiUrls(): string[] {
  return Array.from(new Set([activeApiUrl, primaryApiUrl, backupApiUrl].filter(
    (url): url is string => Boolean(url),
  )));
}

function shouldTryBackup(response: Response): boolean {
  return response.status >= 500;
}

export async function fetchFromApi(
  path: string,
  options: RequestInit = {},
  timeoutMs = 30_000,
): Promise<Response> {
  const apiUrls = getConfiguredApiUrls();
  if (apiUrls.length === 0) {
    throw new Error('NEXT_PUBLIC_API_URL is not configured.');
  }

  let lastError: unknown;

  for (let index = 0; index < apiUrls.length; index += 1) {
    const apiUrl = apiUrls[index];
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(`${apiUrl}${path}`, {
        ...options,
        signal: controller.signal,
      });

      if (shouldTryBackup(response) && index < apiUrls.length - 1) {
        continue;
      }

      activeApiUrl = apiUrl;
      return response;
    } catch (error) {
      lastError = error;
    } finally {
      clearTimeout(timeout);
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error('The backend service is unavailable.');
}
