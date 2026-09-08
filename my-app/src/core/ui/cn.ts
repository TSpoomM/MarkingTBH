/** Join className values, dropping empty/false/undefined entries */
export default function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}
