import Link from "next/link";

export default function DashboardButton() {
  return (
    <Link
      href="/"
      className="fixed bottom-6 right-6 p-4! rounded-full bg-white/10 hover:bg-white/20 transition-colors z-20"
      aria-label="Open dashboard"
    >
      <DashboardIcon />
    </Link>
  );
}

function DashboardIcon({ size = 18 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="#ffffff"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  );
}