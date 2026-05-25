export function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      const b64 = result.includes(",") ? result.split(",")[1] : result;
      resolve(b64 ?? "");
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
